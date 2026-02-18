import os
import logging
from pathlib import Path

from dotenv import load_dotenv

# ── 1. Load .env FIRST so all env vars are available ────────────────────────
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# ── 2. Configure logging BEFORE importing app modules ───────────────────────
from app.config import LOG_LEVEL  # noqa: E402 (must come after load_dotenv)

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
# Quiet noisy HTTP libraries unless in DEBUG mode
if LOG_LEVEL != "DEBUG":
    for lib in ("httpx", "httpcore", "openai", "urllib3"):
        logging.getLogger(lib).setLevel(logging.WARNING)

logger = logging.getLogger(__name__)
logger.info("Logging configured: level=%s", LOG_LEVEL)

# ── 3. Import app modules (agents, routes) ──────────────────────────────────
from fastapi import FastAPI  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from app.api import router  # noqa: E402

# Create main app
app = FastAPI(title="Agentic Decision Maker")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_path = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_path):
    app.mount("/static", StaticFiles(directory=static_path), name="static")

# Include API routes
app.include_router(router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
