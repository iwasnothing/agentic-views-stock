import os
import json
import asyncio
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse

from app.schema import DecisionRequest
from app.agents.graph import decision_graph
from app.config import RECURSION_LIMIT
from app.events import status_queue_var

logger = logging.getLogger(__name__)

router = APIRouter()

NODE_LABELS = {
    "planner": "Understanding your request",
    "stock_info": "Gathering financial data",
    "financial_reporter": "Building company profile",
    "generate_personas": "Creating analyst personas",
    "analysis": "Running multi-perspective analysis",
    "generate_report": "Writing final report",
}


@router.post("/api/analyze")
async def analyze(request: DecisionRequest):
    """Run the full stock analysis LangGraph pipeline and return the final report."""
    try:
        result = await decision_graph.ainvoke(
            {"user_message": request.user_message},
            config={"recursion_limit": RECURSION_LIMIT},
        )
    except Exception as e:
        logger.exception("Pipeline failed for message: %s", request.user_message)
        raise HTTPException(status_code=500, detail=f"Analysis pipeline failed: {e}")

    return {
        "ticker": result.get("ticker", ""),
        "report": result.get("report", ""),
        "financial_info": result.get("financial_info", ""),
        "persona_analyses": result.get("persona_analyses", []),
        "company_profile": result.get("company_profile", ""),
    }


def _serialize_update(node_name: str, update: dict) -> dict:
    """Build a JSON-safe SSE payload for a completed graph node."""
    event: dict = {
        "type": "step",
        "node": node_name,
        "label": NODE_LABELS.get(node_name, node_name),
    }

    if node_name == "planner":
        event["message"] = f"Identified ticker: {update.get('ticker', 'N/A')}"
        event["ticker"] = update.get("ticker", "")
        event["intent"] = update.get("intent", "")
    elif node_name == "stock_info":
        fi = update.get("financial_info", "")
        event["message"] = f"Collected {len(fi)} chars of financial data"
        event["financial_info"] = fi
    elif node_name == "financial_reporter":
        cp = update.get("company_profile")
        event["message"] = "Company profile generated"
        if cp is not None:
            event["company_profile"] = cp.model_dump() if hasattr(cp, "model_dump") else cp
    elif node_name == "generate_personas":
        personas = update.get("personas", [])
        event["message"] = f"Generated {len(personas)} analyst personas"
        event["personas"] = [p.model_dump() for p in personas]
    elif node_name == "analysis":
        analyses = update.get("persona_analyses", [])
        event["message"] = f"Completed {len(analyses)} persona analyses"
        event["persona_analyses"] = [a.model_dump() for a in analyses]
    elif node_name == "generate_report":
        event["message"] = "Report generated successfully"
        event["report"] = update.get("report", "")

    return event


@router.post("/api/analyze/stream")
async def analyze_stream(request: DecisionRequest):
    """SSE endpoint that streams node-completion AND per-persona status events."""

    async def event_generator():
        queue: asyncio.Queue = asyncio.Queue()
        token = status_queue_var.set(queue)

        async def run_graph():
            try:
                async for chunk in decision_graph.astream(
                    {"user_message": request.user_message},
                    stream_mode="updates",
                    config={"recursion_limit": RECURSION_LIMIT},
                ):
                    for node_name, update in chunk.items():
                        payload = _serialize_update(node_name, update)
                        await queue.put(payload)
                await queue.put({"type": "complete"})
            except Exception as e:
                logger.exception("Streaming pipeline failed")
                await queue.put({"type": "error", "message": str(e)})

        task = asyncio.create_task(run_graph())

        yield f"data: {json.dumps({'type': 'start', 'message': 'Starting analysis pipeline...'})}\n\n"

        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=900)
            except asyncio.TimeoutError:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Pipeline timeout (15 min)'})}\n\n"
                break

            yield f"data: {json.dumps(event)}\n\n"

            if event.get("type") in ("complete", "error"):
                break

        status_queue_var.reset(token)
        if not task.done():
            task.cancel()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.get("/")
async def read_root():
    """Serve the HTMLX page"""
    app_dir = os.path.dirname(os.path.dirname(__file__))
    template_path = os.path.join(app_dir, "templates", "index.htmlx")
    if os.path.exists(template_path):
        return FileResponse(template_path, media_type="text/html")
    return {"message": "Template not found"}


@router.get("/health")
async def health():
    return {"status": "healthy"}
