# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Docker (Full Stack)
```bash
# Build and start all services
docker compose up --build

# Stop all services
docker compose down
```

### Backend (Local Development)
```bash
# Install dependencies
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run backend server
python -m app.app
# Or using uvicorn directly:
uvicorn app.app:app --reload --host 0.0.0.0 --port 8000

# Run CLI analysis tool (outputs to markdown file)
python -m app.agents.main <TICKER> [-o OUTPUT.md] [-v]
```

### Frontend (Local Development)
```bash
cd frontend
npm install
npm run dev      # Development server on :3000
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture Overview

This is an AI-powered stock analysis platform using a **LangGraph** multi-agent pipeline. The system generates multi-perspective investment reports by having distinct analyst personas analyze a stock.

### Service Architecture

```
┌────────────┐       ┌────────────┐       ┌────────────┐
│  Frontend   │──────▶│  Backend    │──────▶│  LiteLLM   │──▶ OpenAI-compatible LLM
│  Next.js    │ HTTP  │  FastAPI    │ HTTP  │  Proxy     │
│  :3000      │       │  :8000      │       │  :4001     │
└────────────┘       └────────────┘       └────────────┘
                            │
                            ├── yfinance (financial data)
                            └── DuckDuckGo (web search)
```

### LangGraph Agent Pipeline

The backend runs a six-stage sequential workflow defined in `app/agents/graph.py`:

```
START → planner → stock_info → financial_reporter → generate_personas → analysis → generate_report → END
```

| Node | Function | Output State Key |
|------|----------|------------------|
| **planner** | Extracts ticker and intent from free-form user input | `ticker`, `intent`, `reasoning` |
| **stock_info** | Fetches financial statements (yfinance) and searches for qualitative context (DuckDuckGo) | `financial_info` |
| **financial_reporter** | Structured extraction of company profile using `CompanyProfile` Pydantic model | `company_profile` |
| **generate_personas** | Creates 4 analyst personas with distinct risk appetites, time horizons, and values | `personas` |
| **analysis** | Each persona independently analyzes the stock using their perspective | `persona_analyses` |
| **generate_report** | Synthesizes all perspectives into final Markdown report with recommendation | `report` |

### Key State Management

- **AgentState** (`app/schema/state.py`): TypedDict that flows through all graph nodes
- All agents are async functions that return partial state updates (dict with new keys)
- The state is accumulated as each node completes

### Streaming Architecture

- **SSE (Server-Sent Events)**: Frontend receives real-time updates via `/api/analyze/stream`
- **ContextVar queue**: `status_queue_var` in `app/events.py` provides async communication between graph execution and SSE stream
- **Event types**: `step` (node completion), `status` (in-progress updates), `complete`, `error`

### LLM Integration

- **LiteLLM Proxy**: Provides OpenAI-compatible interface to any LLM provider
- **Configured in** `litellm_config.yml`: Currently points to local Qwen3-32B model
- **LLM Factory**: `create_llm()` in `app/agents/llm.py` creates LangChain `ChatOpenAI` instances with configured timeout/retries
- **Structured Output**: Many agents use `llm.with_structured_output(PydanticModel)` for type-safe responses

### Environment Variables

Key environment variables (see `.env.example`):

| Variable | Purpose |
|----------|---------|
| `OPENAI_BASE_URL` | LLM endpoint (Docker: `http://litellm:4001/v1`; local: provider URL) |
| `OPENAI_API_KEY` | API key for LLM provider |
| `OPENAI_MODEL_NAME` | Model name (must match `litellm_config.yml` entry) |
| `RECURSION_LIMIT` | Max LangGraph steps (default: 100) |
| `LLM_TIMEOUT_SECONDS` | Per-request timeout (default: 60) |
| `LOG_LEVEL` | `DEBUG`, `INFO`, `WARNING`, `ERROR` |

### Prompt System

- Prompts are stored as YAML files in `app/prompts/`
- Each agent loads prompts and substitutes placeholders (`{ticker}`, `{financial_info}`, etc.)
- System prompts define the role/persona, user prompts provide context
- Example: `stock_info_prompt.yaml`, `company_profile_prompt.yaml`, `persona_analysis_prompt.yaml`

### Frontend Architecture

- **Next.js App Router**: Pages in `frontend/src/app/`
- **Components**: Modular React components in `frontend/src/components/`
  - `SearchBar.tsx`: User input
  - `ThinkingProcess.tsx`: SSE-based progress visualization
  - `AnalystMatrix.tsx`: Displays persona analysis results
  - `ReportDashboard.tsx`: Final report presentation
- **Types**: TypeScript interfaces in `frontend/src/types/report.ts` mirror backend Pydantic models
- **API Integration**: Frontend calls `NEXT_PUBLIC_API_URL` environment variable

### Important Design Patterns

1. **Structured LLM Output**: Use `llm.with_structured_output(Model)` instead of parsing JSON strings
2. **Persona System**: Each persona has `PersonaPerspective` with risk appetite, time horizon, value orientation
3. **Context-Scoped Streaming**: Use `status_queue_var` ContextVar to avoid global state issues with concurrent requests
4. **Error Handling**: API routes catch exceptions and return HTTP 500 with error details

### Adding New Agents

1. Create node function in `app/agents/` that accepts `AgentState` and returns partial state dict
2. Add node to workflow in `app/agents/graph.py`
3. If needed, add new state key to `AgentState` in `app/schema/state.py`
4. Update `NODE_LABELS` and `_serialize_update()` in `app/api/routes.py` for streaming support
5. Create prompt YAML in `app/prompts/` if needed

### Testing Changes

```bash
# Run a quick CLI test without full stack
python -m app.agents.main AAPL -o test_report.md -v

# Check backend health
curl http://localhost:8000/health

# Test streaming endpoint
curl -N -X POST http://localhost:8000/api/analyze/stream \
  -H "Content-Type: application/json" \
  -d '{"user_message": "Analyze TSLA stock"}'
```
