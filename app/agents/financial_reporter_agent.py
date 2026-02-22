import logging
import yaml
from pathlib import Path

from langchain_core.messages import SystemMessage, HumanMessage

from app.schema import AgentState, CompanyProfile
from app.agents.llm import create_llm
from app.events import emit_status, strip_tool_calls, strip_citation_markers

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "company_profile_prompt.yaml"


def _load_prompt(ticker: str, financial_info: str) -> str:
    """Load the company profile prompt from YAML and substitute placeholders."""
    with open(PROMPT_PATH, "r") as f:
        data = yaml.safe_load(f)
    prompt_template = data["company_profile_prompt"]
    return prompt_template.replace("{ticker}", ticker).replace("{financial_info}", financial_info)


FINANCIAL_REPORTER_SYSTEM_PROMPT = """You are a professional financial analyst specializing in company profile analysis. Your role is to extract and structure comprehensive company information from financial data.

Focus on:
- Providing factual, verifiable information only
- Being concise and analytical
- Following the structured framework provided
- Outputting well-structured JSON with all required fields

Stay professional and objective. Do not make assumptions or include speculative information."""


async def financial_reporter_node(state: AgentState) -> AgentState:
    """LangGraph node: generate the company profile from financial info."""
    logger.info("=== FINANCIAL REPORTER NODE START ===")
    ticker = state["ticker"]
    financial_info = state["financial_info"]
    logger.info("Ticker: %s, financial_info: %d chars", ticker, len(financial_info))

    await emit_status({
        "type": "status",
        "node": "financial_reporter",
        "label": "Generating company profile",
        "message": "Analyzing financial data to build company profile…",
    })

    llm = create_llm(max_tokens=16384)
    structured_llm = llm.with_structured_output(CompanyProfile)

    user_prompt = _load_prompt(ticker, financial_info)

    logger.info("Invoking LLM for company profile generation...")
    company_profile: CompanyProfile = await structured_llm.ainvoke([
        SystemMessage(content=FINANCIAL_REPORTER_SYSTEM_PROMPT),
        HumanMessage(content=user_prompt),
    ])

    logger.info("Company profile generated: business_model=%d chars, competitive_edge=%d chars",
                 len(company_profile.business_model), len(company_profile.competitive_edge))

    await emit_status({
        "type": "status",
        "node": "financial_reporter",
        "label": "Company profile complete",
        "message": "Company profile generated successfully",
    })

    logger.info("=== FINANCIAL REPORTER NODE END ===")
    return {"company_profile": company_profile}
