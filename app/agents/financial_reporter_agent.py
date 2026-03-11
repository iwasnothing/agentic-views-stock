import logging
import yaml
import asyncio
from pathlib import Path
from typing import Dict, Tuple

from langchain_core.messages import SystemMessage, HumanMessage

from app.schema import (
    AgentState,
    CompanyProfile,
    BusinessModelOutput,
    WhatTheySellOutput,
    HowTheyMakeMoneyOutput,
    RevenueQualityOutput,
    CostStructureOutput,
    CapitalIntensityOutput,
    GrowthDriversOutput,
    CompetitiveEdgeOutput,
)
from app.agents.llm import create_llm
from app.events import emit_status

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


# Mapping of dimension names to their prompt files and output models
DIMENSIONS: Dict[str, Dict] = {
    "business_model": {
        "prompt_file": "dimension_business_model.yaml",
        "prompt_key": "dimension_business_model",
        "output_model": BusinessModelOutput,
        "output_field": "business_model",
        "max_tokens": 500,
        "label": "Business Model",
    },
    "what_they_sell": {
        "prompt_file": "dimension_what_they_sell.yaml",
        "prompt_key": "dimension_what_they_sell",
        "output_model": WhatTheySellOutput,
        "output_field": "what_they_sell_and_who_buys",
        "max_tokens": 600,
        "label": "Products & Customers",
    },
    "how_they_make_money": {
        "prompt_file": "dimension_how_they_make_money.yaml",
        "prompt_key": "dimension_how_they_make_money",
        "output_model": HowTheyMakeMoneyOutput,
        "output_field": "how_they_make_money",
        "max_tokens": 600,
        "label": "Revenue Model",
    },
    "revenue_quality": {
        "prompt_file": "dimension_revenue_quality.yaml",
        "prompt_key": "dimension_revenue_quality",
        "output_model": RevenueQualityOutput,
        "output_field": "revenue_quality",
        "max_tokens": 600,
        "label": "Revenue Quality",
    },
    "cost_structure": {
        "prompt_file": "dimension_cost_structure.yaml",
        "prompt_key": "dimension_cost_structure",
        "output_model": CostStructureOutput,
        "output_field": "cost_structure",
        "max_tokens": 600,
        "label": "Cost Structure",
    },
    "capital_intensity": {
        "prompt_file": "dimension_capital_intensity.yaml",
        "prompt_key": "dimension_capital_intensity",
        "output_model": CapitalIntensityOutput,
        "output_field": "capital_intensity",
        "max_tokens": 600,
        "label": "Capital Intensity",
    },
    "growth_drivers": {
        "prompt_file": "dimension_growth_drivers.yaml",
        "prompt_key": "dimension_growth_drivers",
        "output_model": GrowthDriversOutput,
        "output_field": "growth_drivers",
        "max_tokens": 600,
        "label": "Growth Drivers",
    },
    "competitive_edge": {
        "prompt_file": "dimension_competitive_edge.yaml",
        "prompt_key": "dimension_competitive_edge",
        "output_model": CompetitiveEdgeOutput,
        "output_field": "competitive_edge",
        "max_tokens": 600,
        "label": "Competitive Edge",
    },
}


def _load_prompt(prompt_file: str, prompt_key: str, ticker: str, financial_info: str) -> str:
    """Load a dimension-specific prompt from YAML and substitute placeholders."""
    prompt_path = PROMPTS_DIR / prompt_file
    with open(prompt_path, "r") as f:
        data = yaml.safe_load(f)
    prompt_template = data[prompt_key]
    return prompt_template.replace("{ticker}", ticker).replace("{financial_info}", financial_info)


FINANCIAL_REPORTER_SYSTEM_PROMPT = """You are a professional financial analyst specializing in company profile analysis. Your role is to extract and structure comprehensive company information from financial data.

Focus on:
- Providing factual, verifiable information only
- Being concise and analytical
- Following the structured framework provided
- Outputting well-structured JSON with all required fields

Stay professional and objective. Do not make assumptions or include speculative information."""


async def _generate_dimension(
    dim_key: str,
    ticker: str,
    financial_info: str,
) -> Tuple[str, str]:
    """Generate a single dimension of the company profile.

    Returns:
        Tuple of (dimension_key, dimension_value)
    """
    dim_config = DIMENSIONS[dim_key]
    prompt = _load_prompt(
        dim_config["prompt_file"],
        dim_config["prompt_key"],
        ticker,
        financial_info,
    )

    await emit_status({
        "type": "status",
        "node": "financial_reporter",
        "label": f"Analyzing: {dim_config['label']}",
        "message": f"Processing {dim_config['label']} dimension…",
    })

    llm = create_llm(max_tokens=dim_config["max_tokens"])
    structured_llm = llm.with_structured_output(dim_config["output_model"])

    result = await structured_llm.ainvoke([
        SystemMessage(content=FINANCIAL_REPORTER_SYSTEM_PROMPT),
        HumanMessage(content=prompt),
    ])

    # Extract the single field value from the result
    output_field = dim_config["output_field"]
    value = getattr(result, output_field)

    await emit_status({
        "type": "status",
        "node": "financial_reporter",
        "label": f"Completed: {dim_config['label']}",
        "message": f"{dim_config['label']} dimension done ({len(value)} chars)",
    })

    return dim_key, value


async def financial_reporter_node(state: AgentState) -> AgentState:
    """LangGraph node: generate the company profile from financial info.

    Splits the profile generation into 8 parallel dimension calls to avoid
    context window overflow when financial_info is large.
    """
    logger.info("=== FINANCIAL REPORTER NODE START ===")
    ticker = state["ticker"]
    financial_info = state["financial_info"]
    logger.info("Ticker: %s, financial_info: %d chars", ticker, len(financial_info))

    await emit_status({
        "type": "status",
        "node": "financial_reporter",
        "label": "Starting company profile",
        "message": f"Analyzing {ticker} across {len(DIMENSIONS)} dimensions in parallel…",
    })

    # Generate all dimensions in parallel
    dimension_tasks = [_generate_dimension(dim_key, ticker, financial_info)
                       for dim_key in DIMENSIONS.keys()]

    logger.info("Starting %d parallel dimension generation tasks", len(dimension_tasks))
    results = await asyncio.gather(*dimension_tasks)

    # Combine all dimension results
    dimension_results = dict(results)

    for dim_key, value in dimension_results.items():
        logger.info("Generated dimension %s: %d chars", dim_key, len(value))

    # Build CompanyProfile from all dimensions
    company_profile = CompanyProfile(
        business_model=dimension_results["business_model"],
        what_they_sell_and_who_buys=dimension_results["what_they_sell"],
        how_they_make_money=dimension_results["how_they_make_money"],
        revenue_quality=dimension_results["revenue_quality"],
        cost_structure=dimension_results["cost_structure"],
        capital_intensity=dimension_results["capital_intensity"],
        growth_drivers=dimension_results["growth_drivers"],
        competitive_edge=dimension_results["competitive_edge"],
    )

    logger.info("Company profile generated: business_model=%d chars, competitive_edge=%d chars",
                 len(company_profile.business_model), len(company_profile.competitive_edge))

    await emit_status({
        "type": "status",
        "node": "financial_reporter",
        "label": "Company profile complete",
        "message": f"All {len(DIMENSIONS)} dimensions completed successfully",
    })

    logger.info("=== FINANCIAL REPORTER NODE END ===")
    return {"company_profile": company_profile}
