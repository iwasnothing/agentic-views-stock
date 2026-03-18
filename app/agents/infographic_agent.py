import logging

from langchain_core.messages import SystemMessage, HumanMessage

from app.schema import AgentState, PersonaAnalysis, CompanyProfile
from app.schema.models import InfographicSummary
from app.agents.llm import create_llm

logger = logging.getLogger(__name__)


INFORGAPHIC_SYSTEM_PROMPT = """You are a financial infographic designer. Your job is to transform stock analysis data into a structured, visual-friendly infographic summary.

You will be given company profile, persona analyses, and financial information. Extract and synthesize this into:
1. A clear verdict (Buy/Hold/Sell/Avoid) with color code
2. 3-5 key metrics with trends (up/down/neutral)
3. 3-4 risk factors with severity
4. 2-3 growth drivers with impact
5. Analyst consensus breakdown
6. Three scores (strength, moat, valuation) out of 10
7. A 3-point investment thesis

Keep all descriptions BRIEF and CONCISE - these are for visual display.
Trends should be "up", "down", or "neutral" based on positive/negative/nominal impact.
Severity/Impact should be "low", "medium", or "high".
Color codes: "green" for Buy, "yellow" for Hold, "red" for Sell/Avoid."""


def _format_company_profile(company_profile: CompanyProfile) -> str:
    """Format the company profile for the LLM."""
    return f"""**Business Model:** {company_profile.business_model}
**Products & Customers:** {company_profile.what_they_sell_and_who_buys}
**Revenue Model:** {company_profile.how_they_make_money}
**Revenue Quality:** {company_profile.revenue_quality}
**Cost Structure:** {company_profile.cost_structure}
**Capital Intensity:** {company_profile.capital_intensity}
**Growth Drivers:** {company_profile.growth_drivers}
**Competitive Edge:** {company_profile.competitive_edge}"""


def _format_persona_analyses(analyses: list[PersonaAnalysis]) -> str:
    """Format all persona analyses for the LLM."""
    sections = []
    for i, a in enumerate(analyses, 1):
        sections.append(
            f"### Analyst {i}: {a.persona_name}\n"
            f"**Profit Outlook:** {a.executive_summary.profit_outlook}\n"
            f"**Risk Assessment:** {a.executive_summary.risk_assessment}\n"
            f"**Overall View:** {a.executive_summary.overall_view}"
        )
    return "\n\n---\n\n".join(sections)


async def generate_infographic_summary(
    ticker: str,
    company_profile: CompanyProfile,
    persona_analyses: list[PersonaAnalysis],
    financial_info: str,
) -> InfographicSummary:
    """Generate an infographic summary from the stock analysis data."""
    logger.info("=== INFOGRAPHIC SUMMARY GENERATION START ===")
    logger.info("Ticker: %s, %d persona analyses", ticker, len(persona_analyses))

    formatted_company_profile = _format_company_profile(company_profile)
    formatted_analyses = _format_persona_analyses(persona_analyses)

    llm = create_llm(temperature=0.3, max_tokens=1000)

    user_content = f"""Generate an infographic summary for {ticker}.

--- COMPANY PROFILE ---
{formatted_company_profile}
--- END COMPANY PROFILE ---

--- PERSONA ANALYSES ---
{formatted_analyses}
--- END PERSONA ANALYSES ---

--- FINANCIAL INFORMATION ---
{financial_info}
--- END FINANCIAL INFORMATION ---

Extract the key information needed for a visual infographic summary. Keep all text brief and suitable for UI display."""

    messages = [
        SystemMessage(content=INFORGAPHIC_SYSTEM_PROMPT),
        HumanMessage(content=user_content),
    ]

    logger.debug("Sending request to LLM for infographic generation")
    result = await llm.ainvoke(messages)

    # Use structured output to get the infographic summary
    structured_llm = llm.with_structured_output(InfographicSummary)
    summary = await structured_llm.ainvoke(messages)

    logger.info("Infographic summary generated for %s", ticker)
    logger.info("=== INFOGRAPHIC SUMMARY GENERATION END ===")

    return summary
