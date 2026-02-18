import logging

from langchain_core.messages import SystemMessage, HumanMessage

from app.schema import PersonaCollection, AgentState
from app.agents.llm import create_llm

logger = logging.getLogger(__name__)


PERSONA_SYSTEM_PROMPT = """You are an expert at creating diverse analytical personas for stock investment analysis.
Your task is to generate exactly 4 distinct personas, each representing a unique perspective for analyzing a stock's future profit and risk.

Each persona should have different characteristics across these axes:
1. Risk appetite: low (risk-averse), high (risk-seeking), or moderate
2. Incentive/Accountability/Responsibility: Describe the incentive structure and accountability orientation
3. Time horizon: short-term focus, long-term focus, or consideration of reversibility
4. Value orientation: Primary values from efficiency, fairness, innovation, security, stability (can have multiple)
5. Logical reasoning style: Describe the reasoning methodology and approach

Create exactly 4 personas that represent diverse investment viewpoints such as:
- Conservative value investor focused on downside protection
- Growth-oriented analyst focused on upside potential
- Macro/sector strategist focused on industry dynamics
- Quantitative/fundamental analyst focused on financial metrics

Ensure each persona has a clear name, description, perspective axes, and analysis approach."""


async def persona_generator_node(state: AgentState) -> AgentState:
    """LangGraph node that generates 4 personas tailored to the stock being analyzed."""
    logger.info("=== PERSONA GENERATOR NODE START ===")
    ticker = state["ticker"]
    financial_info = state.get("financial_info", "")
    logger.info("Ticker: %s, financial_info length: %d chars", ticker, len(financial_info))

    llm = create_llm()
    structured_llm = llm.with_structured_output(PersonaCollection)

    user_content = f"""Generate exactly 4 diverse analytical personas to analyze the stock {ticker}.

Here is a brief summary of the company's financial profile for context:
{financial_info[:1000]}

Create 4 personas that will each analyze this stock's future profit potential and risk from very different angles.
Each persona should have distinct characteristics across risk appetite, accountability, time horizon, value orientation, and reasoning style."""

    messages = [
        SystemMessage(content=PERSONA_SYSTEM_PROMPT),
        HumanMessage(content=user_content),
    ]

    logger.debug("Sending messages to LLM for structured output (PersonaCollection)")
    result: PersonaCollection = await structured_llm.ainvoke(messages)

    logger.info("Generated %d personas:", len(result.personas))
    for i, p in enumerate(result.personas):
        logger.info("  Persona %d: %s — %s (risk=%s, horizon=%s)", i + 1, p.name, p.description[:80], p.perspective.risk_appetite, p.perspective.time_horizon)
    logger.info("=== PERSONA GENERATOR NODE END ===")

    return {"personas": result.personas}
