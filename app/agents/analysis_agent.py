import logging
import json
import yaml
from pathlib import Path

from langchain_core.messages import SystemMessage, HumanMessage

from app.schema import AgentState, Persona, PersonaAnalysis, CompanyProfile
from app.agents.llm import create_llm
from app.events import emit_status, strip_tool_calls, strip_citation_markers

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "persona_analysis_prompt.yaml"


def _load_prompt(ticker: str, financial_info: str, company_profile: CompanyProfile) -> str:
    """Load the persona analysis prompt from YAML and substitute placeholders."""
    with open(PROMPT_PATH, "r") as f:
        data = yaml.safe_load(f)
    prompt_template = data["persona_analysis_prompt"]
    company_profile_json = json.dumps(company_profile.model_dump(), indent=2)
    return prompt_template.replace("{ticker}", ticker).replace("{financial_info}", financial_info).replace("{company_profile}", company_profile_json)

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
    company_profile: CompanyProfile,
) -> PersonaAnalysis:
    """Run a single persona's analysis using a direct LLM call (no tools)."""
    logger.info("--- Analysis for persona: %s ---", persona.name)

    llm = create_llm(max_tokens=16384)
    structured_llm = llm.with_structured_output(PersonaAnalysis)

    system_prompt = _build_persona_system_prompt(persona)
    user_prompt = _load_prompt(ticker, financial_info, company_profile)

    logger.info("[%s] Invoking LLM for analysis...", persona.name)

    parsed: PersonaAnalysis = await structured_llm.ainvoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
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
    company_profile = state["company_profile"]
    logger.info("Ticker: %s, %d personas, financial_info: %d chars, company_profile available",
                 ticker, len(personas), len(financial_info))

    analyses = []
    for i, persona in enumerate(personas):
        logger.info("Running persona %d/%d: %s", i + 1, len(personas), persona.name)
        await emit_status({
            "type": "status",
            "node": "analysis",
            "label": f"Analyzing as {persona.name}",
            "message": f"Running persona {i + 1}/{len(personas)}…",
        })
        analysis = await _run_single_persona_analysis(persona, ticker, financial_info, company_profile)
        analyses.append(analysis)
        await emit_status({
            "type": "status",
            "node": "analysis",
            "label": f"Completed: {persona.name}",
            "message": f"Persona {i + 1}/{len(personas)} analysis done",
        })

    logger.info("=== ANALYSIS NODE END — %d analyses completed ===", len(analyses))
    return {"persona_analyses": analyses}
