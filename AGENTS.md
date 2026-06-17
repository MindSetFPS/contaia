# ContaIA — Agent Guidelines

## Project Timeline

## Architecture Overview

```
contaia/
├── backend/             # Python 3.12 + FastAPI
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, static file mount
│   │   ├── db.py            # SQLite connection, schema init
│   │   ├── auth.py          # Register, login, JWT
│   │   ├── upload.py        # Excel upload + LLM normalization
│   │   ├── chat.py          # Agent loop endpoint
│   │   ├── dashboard.py     # KPI queries
│   │   ├── insights.py      # CRUD + refresh
│   │   ├── llm.py           # OpenRouter client wrapper + agent loop
│   │   └── models.py        # Data validation (Pydantic)
│   ├── tests/               # pytest (QA writes)
│   ├── scripts/
│   │   └── seed_data.py     # Synthetic data generator
│   ├── data/                # SQLite DB file (gitignored)
│   └── requirements.txt
├── frontend/            # React (Vite) + TypeScript + Tailwind + shadcn/ui
│   ├── src/
│   │   ├── pages/           # Route pages
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React Context providers
│   │   ├── lib/             # API client, utilities
│   │   └── types/           # TypeScript types
│   └── package.json
├── .env.example
├── .gitignore
├── AGENTS.md
└── README.md
```

## Technology Stack

| Layer | Technology | Constraint |
|-------|-----------|------------|
| Frontend | React (Vite) + TypeScript | Node 22 |
| Styling | Tailwind CSS + shadcn/ui | No custom CSS unless necessary |
| Charts | Recharts | Render from JSON config only |
| AI Components | [AI Elements](https://elements.ai-sdk.dev/) | Pre-built AI UI components (chat, messages, prompt input, attachments, etc.). Install via `npx ai-elements add <component>`. |
| Backend | Python 3.12 + FastAPI | Uvicorn server |
| Database | SQLite (sqlite3 module) | No ORM. Raw SQL with `?` parameters |
| LLM | OpenRouter Python SDK | `pip install openrouter` |
| Auth | FastAPI + python-jose + passlib | JWT, bcrypt passwords |
| Testing (backend) | pytest | QA writes API tests |
| Linter | ruff (Python) + Prettier (TS/JS) | Run before commit |
| Deployment | VPS (DigitalOcean) | FastAPI serves React build as static files |

## Global State (Selected Client + Period)

The selected client and period persist across all pages. Implemented via React Context:

```typescript
// contexts/client-context.tsx
type ClientState = {
  selectedClient: Client | null
  selectedPeriod: Period | null
}
```

### Contexts

| Context | Purpose |
|---------|---------|
| AuthContext | JWT token, current user, login/logout/register |
| ClientContext | selectedClient, selectedPeriod, setSelectedClient, setSelectedPeriod |

## Agent Loop (Backend)

The LLM runs in a tool-calling loop using the OpenRouter Python SDK. Implemented in `backend/app/llm.py`.

### Tools

| Tool | Implementation | Description |
|------|---------------|-------------|
| `get_schema` | Returns `{tables: [{name, columns: [{name, type}]}]}` filtered to selected client | Called at conversation start or when LLM needs schema recall |
| `execute_sql` | Executes read-only SQL. Backend injects `accountant_id = ? AND client_id = ?` as bound parameters | Returns `{columns: string[], rows: any[][]}` or `{error: string}` |
| `generate_chart` | Validates and returns a chart JSON config | Called when the LLM determines a chart would help |
| `search_insights` | Searches saved insights for the current client by keyword | Enables the LLM to reference past findings |

### Loop Flow

```
1. System prompt + conversation history + user question → LLM
2. If LLM returns tool_call → execute tool → append result → repeat
3. If LLM returns final answer → return {answer_text, chart_config}
4. On SQL error → append error to messages → LLM reflects + retries (max 3)
5. Final response is complete (no streaming). Frontend shows loading spinner.
```

### SQL Safety

- Every SQL query string is parameterized with `?` placeholders
- The backend binds `accountant_id = ?` and `client_id = ?` — the LLM cannot write these values
- All SQL executes in a read-only transaction
- No DML statements (INSERT, UPDATE, DELETE, DROP, ALTER) are allowed
- If the generated SQL contains forbidden keywords, return an error without executing

## API Endpoints

### Auth

| Method | Path | Details |
|--------|------|---------|
| POST | /api/auth/register | `{email, password (min 8 chars), name}` |
| POST | /api/auth/login | `{email, password}` → `{token, user}` |
| GET | /api/auth/me | Returns current user from JWT |

### Clients

| Method | Path | Details |
|--------|------|---------|
| GET | /api/clients | Returns all clients for authenticated accountant |
| POST | /api/clients | `{name, rfc?, industry?}`. No edit, no delete. |

### Upload

| Method | Path | Details |
|--------|------|---------|
| POST | /api/upload | Multipart: `file (.xlsx, max 10MB), client_id, table_type (ventas/gastos/nomina)`. Period auto-detected from date columns. |
| GET | /api/uploads?client_id=X | Returns upload history (recent first) |

### Chat

| Method | Path | Details |
|--------|------|---------|
| POST | /api/chat | `{client_id, message, history: [{role, content}]}` → `{answer_text, chart_config}` |

### Dashboard

| Method | Path | Details |
|--------|------|---------|
| GET | /api/dashboard?client_id=X&period_id=Y | KPIs: ingresos, costos, utilidad, flujo de caja (derived). All with % change vs previous period. Plus mini-chart data (last 6 periods). |

### Insights

| Method | Path | Details |
|--------|------|---------|
| GET | /api/insights?client_id=X | List saved insights |
| POST | /api/insights | `{client_id, question, answer_text, chart_config (required), is_refreshable, period_id}` |
| POST | /api/insights/:id/refresh | `{period_id?}` — re-executes the saved question |
| DELETE | /api/insights/:id | Delete an insight |
| POST | /api/insights/analyze?client_id=X&period_id=Y | On-demand proactive analysis. Returns `[{title, description, chart_config?}]`. Not persisted. |

## Database Schema

See full schema in `README.md`. Key points:

- Every data table has `accountant_id` and `client_id` as NOT NULL foreign keys
- `periods` table is auto-populated from date columns during upload
- `cliente_nombre` in `sales` is NOT NULL
- `products` has `period_id` for per-period pricing
- `insights.chart_config` is JSON — never null (only chart responses can be saved)
- No migrations system. Schema is defined in `backend/app/db.py` as CREATE TABLE statements. Changes require manual DROP TABLE or versioning.

## Chart Config Format

```typescript
type ChartConfig = {
  chart_type: "line" | "bar" | "pie" | "table"
  title: string
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color?: string
  }[]
  period_label?: string
}
```

Default palette (applied on frontend if LLM omits color):
```
#2563EB, #16A34A, #EA580C, #DC2626, #7C3AED, #0891B2, #CA8A04, #BE185D
```

## Upload Flow (Backend)

```
POST /api/upload
  → Validate file (.xlsx, max 10 MB, non-empty)
  → Read with pandas.read_excel() → DataFrame
  → Check column mapping cache: (accountant_id, client_id, table_type, sorted_column_set)
     → If cached and user confirmed "Usar mapeo anterior?" → use cached mapping
     → If no cache or user declined → send headers + 3 sample rows to LLM
        → LLM returns {column_mapping, transformations, detected_periods}
        → Cache the mapping for next time
  → Apply mapping + transformations across entire DataFrame
  → Upsert into DB table: DELETE WHERE (accountant_id, client_id, period_id) then INSERT
  → Auto-populate periods table from date columns
  → Return summary: {processed, skipped, unused_columns, period}
```

## Insights Lifecycle

- **Capture**: "Save to insights" button on chat responses that include a chart. Text-only responses cannot be saved.
- **Refresh**: Re-executes the original question with a new period. The agent loop runs again.
- **Delete**: Removes the insight row. No cascade.
- **Proactive**: "Analyze" button on insights page. LLM decides what's notable. Results are ephemeral (not saved).

## Frontend Routes

| Path | Auth Required | Component | Description |
|------|---------------|-----------|-------------|
| `/` | No | LandingPage | If not logged in: marketing page. If logged in: redirect to /dashboard |
| `/login` | No | LoginPage | Email + password form |
| `/register` | No | RegisterPage | Email + password + name form |
| `/dashboard` | Yes | DashboardPage | KPIs, mini charts, quick links |
| `/chat` | Yes | ChatPage | Message input, conversation, chart rendering. Uses AI Elements components (Conversation, Message, PromptInput). |
| `/insights` | Yes | InsightsPage | Saved insights list + analyze button |

## Frontend Conventions

- **File naming**: kebab-case (`client-list.tsx`, `chat-page.tsx`, `api-client.ts`)
- **Components**: One component per file. Default export.
- **Folder structure**: `/pages` for route pages, `/components` for reusable pieces, `/contexts` for React Contexts, `/lib` for API client and utilities, `/types` for shared TypeScript types
- **TypeScript**: Strict mode. Define types in `/types` or colocated with component. Avoid `any`.
- **Formatting**: Prettier with default config. Run before commit.
- **shadcn/ui**: Use existing components. Extend via Tailwind classes, not custom CSS.
- **AI Elements**: Use [AI Elements](https://elements.ai-sdk.dev/) for all AI-related UI components (chat messages, prompt input, conversations, attachments, artifacts, etc.). Do not build AI-specific UI from scratch. Install via `npx ai-elements add <component>`. Components are added to `src/components/ai-elements/` automatically. The existing shadcn/ui theme applies without extra configuration.

## Backend Conventions

- **File structure**: One file per resource (auth.py, upload.py, chat.py, dashboard.py, insights.py)
- **Database**: raw sqlite3 module. No ORM. All queries written as strings with `?` parameters.
  ```python
  cursor.execute("SELECT ... FROM sales WHERE accountant_id = ? AND client_id = ?", (acc_id, cl_id))
  ```
- **Pydantic**: Use for request/response validation. Define models in `models.py`.
- **Error handling**: Return HTTP 400 for validation errors, 401 for auth, 404 for not found, 500 for unexpected.
- **Formatting**: ruff with default config. Run before commit.
- **No async**: Keep it simple. Use synchronous FastAPI endpoints with threaded pool.

## Environment Variables

```
# .env (never commit)
OPENROUTER_API_KEY=sk-or-v1-...
DATABASE_PATH=data/contaia.db
JWT_SECRET=change-me-in-production
```

## LLM Configuration

```python
from openrouter import OpenRouter

client = OpenRouter(api_key=OPENROUTER_API_KEY)
```

OpenRouter Python SDK is auto-generated from the OpenAPI spec. API-compatible with OpenAI format.

## Deployment (VPS)

```
VPS (DigitalOcean Ubuntu)
  └── Systemd service: uvicorn backend.app.main:app --port 8000
      └── FastAPI serves:
          ├── /api/* → API routes
          └── /* → React static build from /frontend/dist
```

## Setup & Development

### Prerequisites

- Python 3.12+
- Node.js 22+
- Docker (optional, for containerized deployment)

### Quick Start

```bash
# 1. One-command setup (creates venv + installs all deps + copies .env.example → .env)
make setup

# 2. Copy env vars and configure
# Edit .env with your OPENROUTER_API_KEY and JWT_SECRET

# 3. Seed the database
make seed

# 4. Serve everything (builds frontend + starts server on :8000)
make serve
```

### Development (hot reload)

```bash
# Terminal 1: Backend with auto-reload
make dev-backend

# Terminal 2: Frontend with Vite HMR (:5173, proxies /api to :8000)
make dev-frontend
```

### Docker

```bash
# One command to build and run
make docker

# Or manually:
docker compose up --build
```

### Other Commands

```bash
make lint       # Run ruff + prettier checks
make test       # Run pytest suite in backend/tests/
make clean      # Remove venv, node_modules, builds, database
make seed       # Generate synthetic test data
```

### Important Notes

- The database file lives in `backend/data/contaia.db` (gitignored).
- In production, `DATABASE_PATH` env var should point to a persistent volume.
- The frontend build is served as a static site from FastAPI — no separate web server needed.
- The `serve` target runs `make build-frontend` then starts uvicorn. It is the single command for "serve the app."
- The `docker` target runs `docker build` + `docker compose up`. It is the single command for "deploy."

## What Not to Build

- Tax filing, SAT integration, CFDI generation/validation
- Accounting automation (journal entries, reconciliation)
- Multi-currency
- PDF export
- Role-based permissions
- Mobile app
- Data version history or audit trails
- CI/CD pipeline
