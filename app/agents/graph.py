from langgraph.graph import StateGraph, END

from app.schema import AgentState
from app.agents.planner import planner_node
from app.agents.stock_info_agent import stock_info_node
from app.agents.persona_agent import persona_generator_node
from app.agents.analysis_agent import analysis_node
from app.agents.report_agent import report_node


def build_graph() -> StateGraph:
    """Build and compile the LangGraph stock-analysis workflow.

    Flow:
        START -> planner -> stock_info -> generate_personas -> analysis -> report -> END
    """
    workflow = StateGraph(AgentState)

    workflow.add_node("planner", planner_node)
    workflow.add_node("stock_info", stock_info_node)
    workflow.add_node("generate_personas", persona_generator_node)
    workflow.add_node("analysis", analysis_node)
    workflow.add_node("generate_report", report_node)

    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "stock_info")
    workflow.add_edge("stock_info", "generate_personas")
    workflow.add_edge("generate_personas", "analysis")
    workflow.add_edge("analysis", "generate_report")
    workflow.add_edge("generate_report", END)

    return workflow.compile()


decision_graph = build_graph()
