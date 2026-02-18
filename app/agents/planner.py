import logging

from langchain_core.messages import SystemMessage, HumanMessage

from app.schema import AgentState, PlannerOutput
from app.agents.llm import create_llm

logger = logging.getLogger(__name__)


PLANNER_SYSTEM_PROMPT = """You are a planning agent for a stock analysis system.

Given a user message, your job is to:
1. Identify the user's intent (e.g. "stock_analysis", "comparison", "general_question")
2. Extract the stock ticker symbol mentioned in the message

Examples:
- "Tell me about Apple stock" → intent: "stock_analysis", ticker: "AAPL"
- "Should I invest in Tesla?" → intent: "stock_analysis", ticker: "TSLA"
- "Analyze MSFT for me" → intent: "stock_analysis", ticker: "MSFT"
- "Compare GOOG and AMZN" → intent: "comparison", ticker: "GOOG" (pick the primary one)

Always return a valid uppercase ticker symbol. If the user mentions a company name, convert it to the ticker."""


async def planner_node(state: AgentState) -> AgentState:
    """Extract intent and stock ticker from the user message."""
    logger.info("=== PLANNER NODE START ===")
    logger.info("Input state keys: %s", list(state.keys()))
    logger.info("user_message: %s", state["user_message"])

    llm = create_llm()
    structured_llm = llm.with_structured_output(PlannerOutput)

    user_message = state["user_message"]

    messages = [
        SystemMessage(content=PLANNER_SYSTEM_PROMPT),
        HumanMessage(content=f"Extract the intent and stock ticker from this message:\n\n{user_message}"),
    ]

    logger.debug("Sending %d messages to LLM for structured output (PlannerOutput)", len(messages))
    result: PlannerOutput = await structured_llm.ainvoke(messages)

    logger.info("Planner result: intent=%s, ticker=%s, reasoning=%s", result.intent, result.ticker, result.reasoning)
    logger.info("=== PLANNER NODE END ===")

    return {
        "intent": result.intent,
        "ticker": result.ticker,
        "reasoning": result.reasoning,
    }
