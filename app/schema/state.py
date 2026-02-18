from typing import List
from typing_extensions import TypedDict

from app.schema.models import Persona, PersonaAnalysis


class AgentState(TypedDict, total=False):
    """Shared state for the LangGraph stock-analysis workflow.

    Flow: planner -> stock_info -> persona_generator -> analysis (loop) -> report
    """

    # Input
    user_message: str

    # Planner output
    intent: str
    ticker: str
    reasoning: str

    # Stock info agent output
    financial_info: str

    # Persona generator output
    personas: List[Persona]

    # Analysis agent output (one per persona)
    persona_analyses: List[PersonaAnalysis]

    # Final report
    report: str
