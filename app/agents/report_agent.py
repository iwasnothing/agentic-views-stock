import logging

from langchain_core.messages import SystemMessage, HumanMessage

from app.schema import AgentState, PersonaAnalysis
from app.agents.llm import create_llm
from app.events import emit_status, strip_tool_calls, strip_citation_markers

logger = logging.getLogger(__name__)


REPORT_SYSTEM_PROMPT = """You are a senior investment report writer. Your job is to synthesize multiple analyst perspectives and financial data into a single, well-structured investment report under 500 words.

You MUST output the report in valid Markdown format. Use proper Markdown headings, bold text, bullet lists, horizontal rules, and blockquotes for structure and readability.

The report MUST follow this exact Markdown structure:

# Investment Report: [TICKER]

## 1. Recommendation
Start with a clear recommendation in bold (e.g. **Buy**, **Hold**, **Sell**, or **Avoid**), followed by a one-paragraph rationale summarizing the consensus and key divergences across all analyst perspectives.

## 2. Executive Summary
A concise overview (200-300 words) of the company's business model, financial health, growth trajectory, and the balance of upside vs. downside. Use bullet points for key takeaways. Highlight where analysts agree and where they diverge.

## 3. Analyst Perspectives
For each analyst persona, use a ### sub-heading with the persona name, then provide:
- **Profit Outlook:** their view on future profitability
- **Risk Assessment:** their key risk concerns
- **Overall View:** their investment stance and reasoning

Separate each persona section with a horizontal rule (---). Present each persona's analysis faithfully without editorializing.

## 4. Appendix: Financial Information
Include the full original financial data gathered at the beginning of the analysis, unmodified, as reference material. Format it in a readable Markdown blockquote or code block.

Write in a professional, analytical tone. Be precise and reference specific data points. The entire output must be well-formatted Markdown ready to be saved as a .md file."""


def _format_persona_analyses(analyses: list[PersonaAnalysis]) -> str:
    """Format all persona analyses into a readable block for the LLM."""
    sections = []
    for i, a in enumerate(analyses, 1):
        sections.append(
            f"### Analyst {i}: {a.persona_name}\n"
            f"**Profit Outlook:** {a.executive_summary.profit_outlook}\n\n"
            f"**Risk Assessment:** {a.executive_summary.risk_assessment}\n\n"
            f"**Overall View:** {a.executive_summary.overall_view}\n\n"
            f"**Business Model:** {a.business_model}\n\n"
            f"**What They Sell and Who Buys:** {a.what_they_sell_and_who_buys}\n\n"
            f"**How They Make Money:** {a.how_they_make_money}\n\n"
            f"**Revenue Quality:** {a.revenue_quality}\n\n"
            f"**Cost Structure:** {a.cost_structure}\n\n"
            f"**Capital Intensity:** {a.capital_intensity}\n\n"
            f"**Growth Drivers:** {a.growth_drivers}\n\n"
            f"**Competitive Edge:** {a.competitive_edge}"
        )
    return "\n\n---\n\n".join(sections)


async def report_node(state: AgentState) -> AgentState:
    """LangGraph node: generate the final investment report."""
    logger.info("=== REPORT NODE START ===")
    ticker = state["ticker"]
    financial_info = state["financial_info"]
    persona_analyses = state["persona_analyses"]

    logger.info("Ticker: %s, financial_info: %d chars, %d persona analyses", ticker, len(financial_info), len(persona_analyses))

    for i, a in enumerate(persona_analyses):
        logger.info("  Analysis %d: %s — profit=%d chars, risk=%d chars, view=%d chars",
                     i + 1, a.persona_name, len(a.executive_summary.profit_outlook),
                     len(a.executive_summary.risk_assessment), len(a.executive_summary.overall_view))

    formatted_analyses = _format_persona_analyses(persona_analyses)
    logger.debug("Formatted analyses: %d chars", len(formatted_analyses))

    llm = create_llm()

    user_content = f"""Generate a comprehensive investment report for {ticker}.

--- PERSONA ANALYSES ---
{formatted_analyses}
--- END PERSONA ANALYSES ---

--- ORIGINAL FINANCIAL INFORMATION ---
{financial_info}
--- END ORIGINAL FINANCIAL INFORMATION ---

Follow the required report structure exactly:
1. Recommendation (with clear Buy/Hold/Sell/Avoid stance)
2. Executive Summary
3. Each persona's analysis (preserve their individual views)
"""
    messages = [
        SystemMessage(content=REPORT_SYSTEM_PROMPT),
        HumanMessage(content=user_content),
    ]

    await emit_status({
        "type": "status",
        "node": "generate_report",
        "label": "Writing final report",
        "message": "Synthesizing all analyses into the investment report…",
    })
    logger.debug("Sending %d messages to LLM for report generation", len(messages))
    result = await llm.ainvoke(messages)

    report_content = strip_citation_markers(strip_tool_calls(result.content or ""))
    logger.info("Report generated: %d chars", len(report_content))
    logger.debug("Report preview: %s...", (report_content or "")[:500])
    logger.info("=== REPORT NODE END ===")

    return {"report": report_content, "financial_info": financial_info, "persona_analyses": persona_analyses}
