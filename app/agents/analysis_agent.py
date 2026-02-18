import logging
import yaml
from pathlib import Path

from langchain_core.messages import SystemMessage, HumanMessage

from app.schema import AgentState, Persona, PersonaAnalysis
from app.agents.llm import create_llm
from app.events import emit_status, strip_tool_calls, strip_citation_markers

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "stock_info_prompt.yaml"


def _load_prompt(ticker: str, financial_info: str) -> str:
    """Load the stock info prompt from YAML and substitute the ticker placeholder."""
    with open(PROMPT_PATH, "r") as f:
        data = yaml.safe_load(f)
    prompt_template = data["stock_info_prompt"]
    return prompt_template.replace("{ticker}", ticker).replace("{financial_info}", financial_info)

def _build_persona_system_prompt(persona: Persona) -> str:
    """Build a system prompt that fully embodies the persona's role and background."""
    p = persona.perspective
    values = ", ".join(p.value_orientation)
    return f"""You are {persona.name}: {persona.description}

Your analytical profile:
- Risk appetite: {p.risk_appetite}
- Accountability orientation: {p.incentive_accountability}
- Time horizon: {p.time_horizon}
- Core values: {values}
- Reasoning style: {p.logical_reasoning_style}
- Analysis approach: {persona.analysis_approach}

Stay fully in character. Every judgment you make must reflect this persona's worldview, risk tolerance, and reasoning style.
Base your analysis EXCLUSIVELY on the financial information provided — do not request or assume any external data."""


async def _run_single_persona_analysis(
    persona: Persona,
    ticker: str,
    financial_info: str,
) -> PersonaAnalysis:
    """Run a single persona's analysis using a direct LLM call (no tools)."""
    logger.info("--- Analysis for persona: %s ---", persona.name)

    llm = create_llm()
    system_prompt = _build_persona_system_prompt(persona)

    user_prompt = _load_prompt(ticker, financial_info)

    logger.info("[%s] Invoking LLM for analysis...", persona.name)
    result = await llm.ainvoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ])

    response = strip_citation_markers(strip_tool_calls(result.content or ""))
    logger.info("[%s] Analysis response: %d chars", persona.name, len(response))

    logger.info("[%s] Parsing into PersonaAnalysis...", persona.name)
    parse_llm = create_llm(max_tokens=16384)
    structured_llm = parse_llm.with_structured_output(PersonaAnalysis)

    parsed: PersonaAnalysis = await structured_llm.ainvoke([
        SystemMessage(content="Extract the structured analysis from the following text. Preserve the analytical depth."),
        HumanMessage(content=f"Persona name: {persona.name}\n\nAnalysis:\n{response}"),
    ])

    logger.info(
        "[%s] Parsed: profit_outlook=%d chars, risk_assessment=%d chars, overall_view=%d chars",
        persona.name,
        len(parsed.executive_summary.profit_outlook),
        len(parsed.executive_summary.risk_assessment),
        len(parsed.executive_summary.overall_view),
    )
    logger.info("--- Analysis for persona %s DONE ---", persona.name)
    return parsed


async def analysis_node(state: AgentState) -> AgentState:
    """LangGraph node: run each persona's analysis sequentially."""
    logger.info("=== ANALYSIS NODE START ===")
    personas = state["personas"]
    ticker = state["ticker"]
    financial_info = state["financial_info"]
    logger.info("Ticker: %s, %d personas, financial_info: %d chars", ticker, len(personas), len(financial_info))

    analyses = []
    for i, persona in enumerate(personas):
        logger.info("Running persona %d/%d: %s", i + 1, len(personas), persona.name)
        await emit_status({
            "type": "status",
            "node": "analysis",
            "label": f"Analyzing as {persona.name}",
            "message": f"Running persona {i + 1}/{len(personas)}…",
        })
        analysis = await _run_single_persona_analysis(persona, ticker, financial_info)
        analyses.append(analysis)
        await emit_status({
            "type": "status",
            "node": "analysis",
            "label": f"Completed: {persona.name}",
            "message": f"Persona {i + 1}/{len(personas)} analysis done",
        })

    logger.info("=== ANALYSIS NODE END — %d analyses completed ===", len(analyses))
    return {"persona_analyses": analyses}
