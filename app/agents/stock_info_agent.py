import os
import json
import time
import random
import logging

import yfinance as yf
from langchain_community.utilities import DuckDuckGoSearchAPIWrapper
from langchain_core.messages import SystemMessage, HumanMessage

from app.schema import AgentState
from app.agents.llm import create_llm
from app.config import API_MAX_RETRIES
from app.events import emit_status

logger = logging.getLogger(__name__)

_ddg = DuckDuckGoSearchAPIWrapper()


def _serialize_yf(data: dict) -> str:
    """Convert yfinance dicts (with Timestamp keys) to readable JSON strings."""
    return json.dumps(
        {str(k): {str(k2): v2 for k2, v2 in v.items()} if isinstance(v, dict) else v
         for k, v in data.items()},
        indent=2, default=str,
    )


_YF_INFO_KEYS = [
    "shortName", "sector", "industry", "marketCap",
    "trailingPE", "forwardPE", "trailingEps", "forwardEps",
    "dividendYield", "beta", "fiftyTwoWeekHigh", "fiftyTwoWeekLow",
    "totalRevenue", "netIncomeToCommon", "debtToEquity",
    "returnOnEquity", "currentRatio", "freeCashflow", "operatingCashflow",
]


def _fetch_yfinance(ticker: str) -> str:
    """Fetch structured financial data from yfinance."""
    logger.info("Fetching yfinance data for %s", ticker)
    t = yf.Ticker(ticker)

    info = t.info or {}
    filtered_info = {k: v for k, v in info.items() if k in _YF_INFO_KEYS}

    financials = t.financials.to_dict() if t.financials is not None else {}
    balance_sheet = t.balance_sheet.to_dict() if t.balance_sheet is not None else {}
    cashflow = t.cashflow.to_dict() if t.cashflow is not None else {}
    quarterly_income = t.quarterly_income_stmt.to_dict() if t.quarterly_income_stmt is not None else {}

    return (
        f"### yfinance Company Info\n{json.dumps(filtered_info, indent=2, default=str)}\n\n"
        f"### yfinance Income Statement\n{_serialize_yf(financials)}\n\n"
        f"### yfinance Balance Sheet\n{_serialize_yf(balance_sheet)}\n\n"
        f"### yfinance Cash Flow\n{_serialize_yf(cashflow)}\n\n"
        f"### yfinance Quarterly Income Statement\n{_serialize_yf(quarterly_income)}"
    )


def _search_ddg(query: str, max_results: int = 5) -> str:
    """Run a DuckDuckGo search with retry logic, returning formatted text."""
    logger.info(">>> DDG SEARCH: query=%r", query)
    for attempt in range(API_MAX_RETRIES):
        try:
            results = _ddg.results(query, max_results=max_results)
            parts = []
            for r in results:
                title = r.get("title", "")
                link = r.get("link", "")
                snippet = r.get("snippet", "")
                parts.append(f"**{title}**\n{link}\n{snippet}")
            output = "\n\n---\n\n".join(parts) if parts else "No results found."
            logger.info(">>> DDG RESULT: %d results, %d chars", len(parts), len(output))
            return output
        except Exception as exc:
            if attempt >= API_MAX_RETRIES - 1:
                logger.error("DDG search failed after %d attempts: %s", API_MAX_RETRIES, exc)
                return f"Search failed: {exc}"
            delay = (2 ** attempt) + random.uniform(0, 1)
            logger.warning("DDG search error: %s — retrying in %.1fs (%d/%d)",
                           exc, delay, attempt + 1, API_MAX_RETRIES)
            time.sleep(delay)


SEARCH_QUERIES = [
    "{ticker} business model revenue streams products and services",
    "{ticker} financial results revenue earnings margins latest quarterly annual",
    "{ticker} competitive advantage moat market position industry",
    "{ticker} growth drivers risks challenges outlook",
    "{ticker} financial statements balance sheet income statement cash flow statement",
    "{ticker} revenue by segment and geography",
    "{ticker} recurring vs non-recurring revenue split, and customer concentration",
    "{ticker} cost structure and cost drivers",
    "{ticker} capital intensity and capital expenditures",
    "{ticker} financial health and financial metrics",
    "{ticker} gross operating margin trends",
    "{ticker} annual capital expenditures vs operating cash flow",
    "{ticker} market share vs competitors",
]


async def stock_info_node(state: AgentState) -> AgentState:
    """LangGraph node: gather financial info via yfinance + DuckDuckGo, then
    pass the combined data downstream for LLM synthesis.

    1. Fetch structured data from yfinance (income statement, balance sheet, etc.)
    2. Run predefined DuckDuckGo searches for qualitative context
    3. Combine both into ``financial_info``
    """
    logger.info("=== STOCK INFO NODE START ===")
    ticker = state["ticker"]
    logger.info("Ticker: %s", ticker)

    # Step 1: yfinance structured data
    await emit_status({
        "type": "status",
        "node": "stock_info",
        "label": "Fetching yfinance data",
        "message": f"Loading financial statements for {ticker}",
    })
    yf_data = _fetch_yfinance(ticker)

    # Step 2: DuckDuckGo searches for qualitative context
    all_search_results = []
    for idx, query_template in enumerate(SEARCH_QUERIES, 1):
        query = query_template.format(ticker=ticker)
        await emit_status({
            "type": "status",
            "node": "stock_info",
            "label": f"Searching ({idx}/{len(SEARCH_QUERIES)})",
            "message": query[:80],
        })
        result = _search_ddg(query)
        all_search_results.append(f"### Search: {query}\n{result}")

    ddg_data = "\n\n".join(all_search_results)

    combined_data = (
        f"## Part A: yfinance Structured Data\n{yf_data}\n\n"
        f"## Part B: DuckDuckGo Search Results\n{ddg_data}"
    )
    logger.info("Gathered data: %d chars (yfinance + %d DDG queries)",
                len(combined_data), len(SEARCH_QUERIES))

    return {**state, "ticker": ticker, "financial_info": combined_data}
