# ContaIA

An AI copilot that helps Mexican accountants analyze SME financial data by asking questions in natural language, receiving automated summaries, and collecting findings for client meetings.

## Vision

"An AI assistant that helps Mexican accountants quickly understand and explain business performance to their clients."

The accountant remains the analyst. The AI accelerates analysis.

## User Personas

| Persona | Description |
|---------|-------------|
| Sofia, freelance accountant | Has 20 SME clients. Uploads their Excel files monthly. Uses ContaIA to prepare for client meetings. |
| Carlos, despacho owner | Runs a 3-person firm. Uses ContaIA to delegate analysis to junior staff. Reviews the insights panel before client calls. |
| The professor | Evaluates the demo. Expects to see a complete workflow: Dashboard → Chat → Insights. |

## Contributing (Gitflow Workflow)

This project follows the [Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) branching model.

### Branches

| Branch | Purpose | Base |
|--------|---------|------|
| `main` | Production-ready code. Merged only from `release` or `hotfix` branches. | — |
| `develop` | Integration branch for ongoing work. Merged from `feature` branches. | `main` |
| `feature/*` | New features. Naming: `feature/short-description`. | `develop` |
| `release/*` | Preparation for a new production release. Naming: `release/x.x.x`. | `develop` |
| `hotfix/*` | Urgent fixes for production. Naming: `hotfix/short-description`. | `main` |

### Flow Overview

```
main ─── v0.1.0 ─── v0.2.0 ─── ...
  │                  ↑
  │            release/sprint-2
  │                  ↑
develop ──────────────────────────
  │    ↑       ↑           ↑
  │    │       │           └── feature/clients-select
  │    │       └── feature/clients-create
  │    └── feature/auth-login
  └── feature/auth-register
```

### Feature Flow (Sprint Day-to-Day)

1. Dev crea branch de `develop`: `feature/short-description`.
2. Dev implementa y commitea.
3. Dev abre PR hacia `develop`.
4. QA prueba en la feature branch o en deploy preview.
5. Si pasa → squash merge a `develop`.
6. Si falla → dev corrige en la misma branch, QA re-prueba.

### Release Flow (Fin de Sprint)

1. Cuando `develop` tiene todas las features del sprint completadas, se crea `release/x.x.x` desde `develop`.
2. Solo bug fixes y metadatos (versión, changelog) en release branch.
3. QA hace regression testing del flujo completo.
4. QA aprueba → merge a `main` + tag semántico.
5. Merge back a `develop`.

```
git checkout develop
git checkout -b release/sprint-1
  → QA regression
  → Bug fixes si es necesario
git checkout main
git merge release/sprint-1
git tag v0.1.0
git checkout develop
git merge release/sprint-1
```

### Hotfix Flow (Producción)

1. Branch desde `main`: `hotfix/short-description`.
2. Dev corrige, QA prueba.
3. Merge a `main` (con tag) y a `develop`.

```
git checkout main
git checkout -b hotfix/fix-login-validation
  → Dev corrige, QA prueba
git checkout main
git merge hotfix/fix-login-validation
git tag v0.1.1
git checkout develop
git merge hotfix/fix-login-validation
```

### Commit Conventions

Use conventional commits:

```
feat: add monthly summary endpoint
fix: handle empty upload file
refactor: extract column mapping logic
chore: update dependencies
docs: add contribution guide
```

### Before Opening a PR

- Pull latest `develop` and rebase your feature branch.
- Run `make lint` (ruff + prettier).
- Ensure the app builds and runs without errors.
- Keep the PR small and focused on a single concern.

## System Architecture

### Data Model

The system normalizes uploaded Excel files into a PostgreSQL/SQLite relational schema. Raw files are processed and discarded. The database is the single source of truth for all queries.

```sql
-- Core tables

accountants (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
)

clients (
    id              SERIAL PRIMARY KEY,
    accountant_id   INTEGER NOT NULL REFERENCES accountants(id),
    nombre_comercial VARCHAR(255) NOT NULL,
    razon_social    VARCHAR(255) NOT NULL,
    rfc             VARCHAR(13),
    industry        VARCHAR(100)
)

periods (
    id              VARCHAR(7) PRIMARY KEY,  -- "2024-01"
    year            INTEGER NOT NULL,
    month           INTEGER NOT NULL,
    label           VARCHAR(50) NOT NULL      -- "Enero 2024"
)

-- Period labels follow Spanish naming: Enero, Febrero, Marzo, Abril, Mayo, Junio,
-- Julio, Agosto, Septiembre, Octubre, Noviembre, Diciembre

sales (
    id              SERIAL PRIMARY KEY,
    accountant_id   INTEGER NOT NULL REFERENCES accountants(id),
    client_id       INTEGER NOT NULL REFERENCES clients(id),
    period_id       VARCHAR(7) NOT NULL REFERENCES periods(id),
    fecha           DATE NOT NULL,
    cliente_nombre  VARCHAR(255) NOT NULL,
    producto        VARCHAR(255) NOT NULL,
    cantidad        DECIMAL(12,2) DEFAULT 1,
    precio_unitario DECIMAL(12,2),
    monto_neto      DECIMAL(12,2) NOT NULL,
    iva             DECIMAL(12,2) DEFAULT 0,
    monto_total     DECIMAL(12,2) NOT NULL
)

expenses (
    id              SERIAL PRIMARY KEY,
    accountant_id   INTEGER NOT NULL REFERENCES accountants(id),
    client_id       INTEGER NOT NULL REFERENCES clients(id),
    period_id       VARCHAR(7) NOT NULL REFERENCES periods(id),
    fecha           DATE NOT NULL,
    categoria       VARCHAR(100) NOT NULL,
    descripcion     TEXT,
    monto           DECIMAL(12,2) NOT NULL,
    iva             DECIMAL(12,2) DEFAULT 0
)

payroll (
    id              SERIAL PRIMARY KEY,
    accountant_id   INTEGER NOT NULL REFERENCES accountants(id),
    client_id       INTEGER NOT NULL REFERENCES clients(id),
    period_id       VARCHAR(7) NOT NULL REFERENCES periods(id),
    empleado        VARCHAR(255) NOT NULL,
    puesto          VARCHAR(255),
    salario_bruto   DECIMAL(12,2) NOT NULL,
    deducciones     DECIMAL(12,2) DEFAULT 0,
    salario_neto    DECIMAL(12,2) NOT NULL,
    isr             DECIMAL(12,2) DEFAULT 0,
    imss            DECIMAL(12,2) DEFAULT 0
)

products (
    id              SERIAL PRIMARY KEY,
    accountant_id   INTEGER NOT NULL REFERENCES accountants(id),
    client_id       INTEGER NOT NULL REFERENCES clients(id),
    period_id       VARCHAR(7) NOT NULL REFERENCES periods(id),
    nombre          VARCHAR(255) NOT NULL,
    categoria       VARCHAR(100),
    precio_unitario DECIMAL(12,2),
    costo_unitario  DECIMAL(12,2)
)

conversations (
    id              SERIAL PRIMARY KEY,
    accountant_id   INTEGER NOT NULL REFERENCES accountants(id),
    client_id       INTEGER NOT NULL REFERENCES clients(id),
    created_at      TIMESTAMP DEFAULT NOW()
)

messages (
    id              SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
    role            VARCHAR(20) NOT NULL,     -- "user" or "assistant"
    content         TEXT NOT NULL,
    chart_config    JSONB,                    -- Only for assistant responses
    created_at      TIMESTAMP DEFAULT NOW()
)

insights (
    id              SERIAL PRIMARY KEY,
    accountant_id   INTEGER NOT NULL REFERENCES accountants(id),
    client_id       INTEGER NOT NULL REFERENCES clients(id),
    period_id       VARCHAR(7) NOT NULL REFERENCES periods(id),
    question        TEXT NOT NULL,            -- Original question ("Top 10 productos")
    answer_text     TEXT NOT NULL,            -- LLM answer at time of save
    chart_config    JSONB NOT NULL,           -- Chart config at time of save (non-null, only chart responses can be saved)
    is_refreshable  BOOLEAN DEFAULT FALSE,    -- Can this be re-run with new period?
    created_at      TIMESTAMP DEFAULT NOW()
)
```

### Tenant Isolation

Every data table has an `accountant_id` and `client_id` foreign key. All queries — whether from chat, dashboard, or upload — enforce a **mandatory filter** on both keys:

```python
# Every database operation includes these filters:
WHERE accountant_id = current_user.id
  AND client_id = selected_client.id
```

This applies to:
- **Uploads**: The upload form requires `client_id`. Data is written with that client_id. No cross-client data can be inserted.
- **Chat**: Conversations and messages are scoped to `client_id`. The sidebar only shows conversations for the selected client. Before generating SQL, the LLM receives the schema context filtered to the selected client. The generated SQL is injected with `client_id = ?` and `accountant_id = ?` parameters — the LLM cannot override them.
- **Dashboard**: All KPI queries filter by `client_id` and `accountant_id`.
- **Insights**: Saved insights are scoped to a `client_id`. The sidebar only loads insights for the selected client.

Additionally:
- The JWT token encodes `accountant_id`. Every API endpoint extracts it from the token and uses it as a query parameter — never from user-supplied request data.
- Write operations additionally verify that `client_id` belongs to `accountant_id` via a foreign key constraint in the database.
- There is no "super admin" or cross-accountant view in the prototype.

### Language Convention

- **API responses** (error messages, validation errors, system messages) are in **English** for developer clarity.
- **Frontend renders** all user-facing text in **Spanish (Mexico)**. The frontend is the translation boundary — LLM answers are naturally in Spanish, and the UI is built with Spanish labels.
- **API contracts** (endpoint names, JSON field names, database column names) are in **English**.

### Data Upload Flow

1. Accountant uploads an **Excel file (.xlsx only, max 10 MB)** through the web UI.
2. The upload form requires the accountant to select:
   - **Client** (dropdown of their clients)
   - **Table type** (Ventas / Gastos / Nómina — the accountant chooses)
   - **File** (the .xlsx file)
3. If the accountant has uploaded to this client before with the same table type, the system asks: **"Usar mapeo anterior?"** with the detected columns shown. The accountant can accept or trigger a fresh mapping.
4. The backend reads the file with `pandas.read_excel()`.
5. **Only the column headers + 3 sample rows are sent to the LLM** — never the full dataset. Even files with 50,000 rows cost pennies.
   - The LLM receives: the file's column headers, the target schema (table name + columns + types), and the 3 sample rows.
   - The LLM returns a JSON mapping: which source columns map to which target columns, plus any needed data transformations (date parsing, number cleaning).
   - The LLM also detects which period(s) the data covers by inspecting date values in the sample rows.
6. The mapping is applied using pandas operations across the entire DataFrame. No per-row LLM calls.
7. Data is upserted into the appropriate database table in a single batch operation:
   - Upsert key: `(accountant_id, client_id, period_id)`.
   - If rows for that key already exist, they are replaced in one transaction.
   - Periods are auto-populated in the `periods` table based on dates found in the data.
8. The accountant sees an upload summary:
   ```
   ✅ Ventas — Abril 2025
   450 filas procesadas
   3 omitidas (fecha inválida)
   Columnas no utilizadas: Descuento, Notas
   ```
9. The mapping is cached per accountant per table type. Subsequent uploads with the same columns reuse it without an LLM call. The cache is keyed by: `(accountant_id, client_id, table_type, sorted_column_set)`. If the set of column names is identical, the cached mapping is offered; otherwise a new mapping is required.

### Query Flow (Chat — Agent Loop)

The LLM runs in a tool-calling agent loop with these tools:

| Tool | Description |
|------|-------------|
| `get_schema` | Returns the database schema (tables, columns, types, foreign keys) filtered to the selected client. The LLM calls this at the start of a conversation or when it needs to recall the schema. |
| `execute_sql` | Executes a read-only SQL query. The backend injects `accountant_id` and `client_id` filters. Returns a DataFrame as JSON (rows + column names). |
| `generate_chart` | Returns a chart JSON config based on the data. Called when the LLM decides a visualization would help. |
| `search_insights` | Searches existing saved insights for the current client. The LLM can reference past findings. |

The loop:

```
User question (Spanish)
    → get_schema (first message or on request)
    → LLM reasons about what data is needed
    → execute_sql → result or error
        → If error: LLM reflects, fixes SQL, retries (up to 3 retries)
    → LLM analyzes data
    → generate_chart (if visualization is useful)
    → Final response: { answer_text: string, chart_config: ChartConfig | null }
```

All responses are complete (no token-by-token streaming). The frontend shows a loading state while the agent loop runs.

### Chart Config Format

The LLM returns chart config as JSON. The frontend renders it with Recharts.

```typescript
type ChartConfig = {
  chart_type: "line" | "bar" | "pie" | "table"
  title: string
  labels: string[]           // X-axis or row labels
  datasets: {
    label: string            // Series name
    data: number[]
    color?: string           // Hex color (optional)
  }[]
  period_label?: string      // e.g., "Mayo 2025"
}
```

Chart type selection rules:
- `line` for trends over time (revenue by month, expenses by month)
- `bar` for comparisons (sales by product, expenses by category, period vs period)
- `pie` for concentration (top customers by revenue, cost structure)
- `table` for ranked lists (top 10 products, AR aging)

The LLM decides which chart type fits the data. If no chart is useful, `chart_config` is null.

If the LLM does not specify a `color` for a dataset, the frontend assigns a random color from a predefined palette: `["#2563EB", "#16A34A", "#EA580C", "#DC2626", "#7C3AED", "#0891B2", "#CA8A04", "#BE185D"]`. Random assignment means the same dataset label does not guarantee the same color across renders.

### Insight Lifecycle

1. **Capture**: User clicks "Save to insights" on any chat response that includes a chart. Text-only responses cannot be saved.
2. **Store**: The question, answer text, chart config, and current period are saved. `chart_config` is never null for a saved insight.
3. **Refresh**: User opens an insight and clicks "Refresh." The original question is re-executed against the selected (or latest) period. A new answer and chart config are generated.
4. **Delete**: User can delete any insight. No cascade — deleted insights are gone.

## Application Screens

### 1. Authentication

- Login and register pages (email + password, minimum 8 characters).
- JWT-based auth.
- After login, user lands on `/dashboard`.
- Root route `/`:
  - If not authenticated: landing page describing the product with a "Get started" link to `/login`.
  - If authenticated: redirect to `/dashboard`.

### 2. Dashboard

Path: `/dashboard`

The landing page after login. Provides a high-level overview before drilling into chat or insights.

Components:
- **Sidebar**: List of the accountant's clients. Visible on every page. The currently selected client is highlighted with a distinct background color. Switching clients is a single click on any client name in the sidebar — no confirmation, no save button.
  - Clicking a new client selects it globally: the selection carries across Dashboard, Chat, and Insights.
   - Switching clients preserves the previous conversation and starts a new one for the new client. The insights panel reloads for the newly selected client.
  - The dashboard KPIs and charts update to reflect the newly selected client.
  - There is no multi-select. Exactly one client is active at any time.
   - **Add a client**: A "+" button at the top of the sidebar opens a modal with four fields: nombre comercial (required), razón social (required), RFC (optional), industry (optional). On submit, the client is created and automatically selected. No data is uploaded yet — the client appears in the sidebar with a "Sin datos" badge until their first Excel upload.
- **Top bar**: A persistent bar across all pages showing the selected client's name (e.g., "Marta García S.A. de C.V.") and a period selector dropdown. If no client is selected, the bar prompts "Selecciona un cliente" and the main content area is empty.
- **Period selector**: A dropdown showing only periods with uploaded data for the selected client. Chronological order (most recent first). Selecting a period updates all KPIs, charts, and subsequent chat context.
- **First login**: Accountant lands on Dashboard with no client selected. They must click a client in the sidebar to begin.
- **KPI cards**: Four cards in a row, one per metric:
  - Ingresos (total sales for period + % vs previous period)
  - Costos (total expenses for period + % vs previous period)
  - Utilidad (ingresos - costos + % vs previous period)
  - Flujo de caja (operating cash flow + trend indicator: improving/stable/weakening)
- **Mini charts**: Below KPIs, small sparkline charts showing each metric over the last 6 periods.
- **Quick links**: Cards/buttons to navigate to Chat or Insights for the selected client.

### 3. Chat

Path: `/chat`

A dedicated page for conversing with the AI about the selected client.

- Text input at the bottom.
- Messages displayed in a scrollable container filling the main content area.
- User messages in one style, AI responses in another.
- AI responses can contain:
  - Text (Spanish)
  - Inline chart (rendered from JSON config)
  - "Save to insights" button
- Chat history persists per client and is organized into conversations. Switching clients preserves the previous conversation and starts a new one. Each conversation has its own history.
- All messages (user + assistant) are sent with each request within token limits. The backend appends new messages and trims oldest if the context exceeds the model's limit.
- Context is maintained within a session (follow-up questions work).
- The sidebar (client list + period selector) remains visible on the left.

### 4. Insights

Path: `/insights`

A dedicated page for viewing and managing saved findings for the selected client.

- List of saved insights for the selected client.
- Each item shows: question, date saved, period, chart thumbnail.
- Clicking an insight expands it showing full answer + chart.
- Expanded insight has buttons: "Refresh" (if refreshable), "Delete."
- Insights can be sorted by date or by period.
- "New insight" button navigates to chat to ask a question and save it.
- The sidebar (client list + period selector) remains visible on the left.

## Core Features

### Feature 1: Natural Language Queries

The accountant types a question in Spanish. The system answers with text and optionally a chart.

Supported question types:
- Metric queries: "¿Cuáles fueron las ventas de mayo?" "¿Cuál fue el margen bruto?"
- Comparison queries: "¿Cómo vamos comparado con abril?" "¿Crecieron los ingresos?"
- Ranking queries: "¿Cuál fue el producto más rentable?" "Top 5 clientes por ventas."
- Period queries: "¿Qué pasó en el primer trimestre?"

Unsupported question types (system responds "No puedo responder esta pregunta"):
- Questions about tax filing, SAT, compliance, or regulatory obligations.
- Questions asking the system to make accounting decisions or journal entries.
- Questions about data not present in the uploaded files.

### Feature 2: Automatic Financial Summaries

Triggered by: "Genera resumen mensual" or "Resumen de mayo."

The summary includes:
- Revenue trend (vs previous period, vs same period last year if available)
- Expense trend (total and by top categories)
- Profit trend (absolute and margin %)
- Notable changes (anomalies flagged: >10% change in any category)
- Cash flow summary

### Feature 3: Explain Variations

Triggered by: "¿Por qué bajó la utilidad?" "¿Por qué aumentaron los gastos?" "¿Por qué empeoró el flujo?"

The system identifies contributing factors and quantifies them:
- "Payroll grew 15% (+$18,000) while revenue grew only 8% (+$12,000). The main driver is a new employee hired in April."
- Each factor is listed with its contribution to the total variance.

### Feature 4: Proactive Insights (On-Demand)

The insights page displays an "Analyze" button. When clicked, the system sends a summary of the client's current data to the LLM and asks "What's notable about this client's financial data?" The LLM returns a list of notable findings, each with a description and optionally a chart.

The results are displayed in the insights panel as new items with a "Proactive" badge. The accountant can dismiss or save each finding. Findings are not persisted — they regenerate on the next "Analyze" click.

There are no predefined SQL queries or hardcoded thresholds. The LLM decides what is notable based on the data it queries.

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React (Vite) | UI components, routing, chart rendering |
| Charts | Recharts | Client-side chart rendering from JSON config |
| Backend | Python + FastAPI | REST API, file upload, LLM orchestration |
| Database | SQLite (dev) / PostgreSQL (prod) | Normalized financial data |
| LLM | OpenRouter | Model-agnostic access to GPT-4o, Claude, and others. SQL generation, answer synthesis, chart config, column mapping |
| Auth | FastAPI + python-jose + passlib | JWT-based email/password |
| Testing (backend) | pytest | QA writes API tests |

## API Endpoints

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register a new accountant. Body: {email, password, name} |
| POST | /api/auth/login | Login. Returns JWT. Body: {email, password} |
| GET | /api/auth/me | Returns current user info. Header: Authorization: Bearer <token> |

### Clients

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/clients | List all clients for authenticated accountant |
| POST | /api/clients | Create a client. Body: {nombre_comercial, razon_social, rfc?, industry?} |

### Data Upload

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/upload | Upload Excel file. Multipart form: file, client_id, table_type (ventas/gastos/nomina). Period is auto-detected from date columns. Max file size: 10 MB. |
| GET | /api/uploads | List upload history for a client: ?client_id=X |

### Chat

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/chat | Send a message. Body: {client_id, conversation_id, message, history: [{role, content}]}. Creates a new conversation if conversation_id is null. Response: {answer_text, chart_config, conversation_id}. Text-only responses have chart_config: null. |
| GET | /api/chat/conversations?client_id=X | List conversations for a client, ordered by most recent |
| POST | /api/chat/summary | Generate monthly summary. Body: {client_id, period_id}. Response: {answer_text, chart_config} |

### Insights

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/insights?client_id=X | List insights for a client |
| POST | /api/insights | Save an insight. Body: {client_id, question, answer_text, chart_config (required), is_refreshable, period_id}. Only chart responses can be saved. |
| POST | /api/insights/:id/refresh | Re-execute the insight's question. Body: {period_id?} |
| DELETE | /api/insights/:id | Delete an insight |

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/dashboard?client_id=X&period_id=Y | Returns KPI data, period-over-period changes, mini chart data. Cash flow is derived from (sales collected - expenses paid) across the available periods. |

### Proactive Insights

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/insights/analyze?client_id=X&period_id=Y | Runs on-demand analysis. Sends data summary to LLM. Returns list of notable findings: [{title, description, chart_config?}]. No server-side caching — every call re-analyzes. |

## Scope Boundaries

### In scope for the prototype
- Natural language queries against financial data in Spanish
- Automatic monthly summaries with trend analysis
- Variance explanation with quantified contributing factors
- On-the-fly chart generation (line, bar, pie, table)
- Excel file upload with automated LLM-based column normalization
- Multi-accountant support (email + password auth)
- Insights panel that saves, refreshes, and deletes findings
- Dashboard with KPI cards and mini charts
- Pre-loaded synthetic Mexican SME dataset

### Out of scope for the prototype
- Tax filing, SAT integration, CFDI generation or validation
- Regulatory compliance features (e.g., CFF article 28, DIOT)
- Accounting automation (journal entries, account reconciliation)
- Double-entry bookkeeping or general ledger
- Multi-currency support
- API integrations with Mexican accounting software (Contpaq, Aspel, etc.)
- Version history or audit trail for uploaded files
- Role-based permissions within a firm
- PDF report export
- Mobile app

## Synthetic Dataset

A synthetic data generation script (`scripts/seed_data.py`) is included for development and testing. It is never run in production.

The script creates:

- 3 accountants with email/password credentials printed at the end of the script
- 5-8 clients per accountant (15-24 SMEs total)
- 12 consecutive months of data per client
- ~500-1000 sales transactions per client per year
- ~50-100 expense entries per client per month
- Payroll data for clients with employees (2-15 employees each)
- 10-20 products per product-based client

Industry distribution: retail, services, manufacturing, food & beverage, technology.

Data is generated using Faker with Mexican locale (names, RFCs, addresses, product names in Spanish).

To use: `python scripts/seed_data.py --accounts 3`. The script prints login credentials for each account.

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 22+
- Docker (optional)

### Quick Start

```bash
# 1. One-command setup (creates venv + installs all deps + copies .env)
make setup

# 2. Edit .env with your keys
#    OPENROUTER_API_KEY=sk-or-v1-...
#    JWT_SECRET=change-me-in-production

# 3. Seed the database with synthetic data
make seed

# 4. Serve everything (builds frontend + starts server on :8000)
make serve
```

Open http://localhost:8000 in your browser.

### Development (hot reload)

Run two terminals in parallel:

```bash
# Terminal 1: Backend with auto-reload on port 8000
make dev-backend

# Terminal 2: Frontend with Vite HMR on port 5173 (proxies /api to :8000)
make dev-frontend
```

Open http://localhost:5173 in your browser. The frontend automatically proxies API requests to the backend.

### Available Commands

| Command | What it does | Notes |
|---------|-------------|-------|
| `make setup` | Creates venv, installs Python + npm deps, copies `.env.example` → `.env` | Run once after cloning |
| `make dev-backend` | Starts uvicorn with hot reload on port 8000 | Requires `.env` file |
| `make dev-frontend` | Starts Vite dev server on port 5173 | Requires `make dev-backend` running separately |
| `make serve` | Builds frontend + starts uvicorn on port 8000 | Single command for production-like serving |
| `make seed` | Generates synthetic test data | Requires `.env` |
| `make lint` | Runs ruff (Python) + prettier (TS/JS) checks | Run before committing |
| `make test` | Runs pytest suite in `backend/tests/` | QA writes these tests |
| `make docker` | Builds Docker image + runs docker compose | For deployment |
| `make clean` | Removes venv, node_modules, builds, database | Start fresh |

### Known Issues & Caveats

- **Python version**: The project targets Python 3.12+. If your system runs Python 3.14+, pandas may need to compile from source (no pre-built wheel available yet). This only affects `make setup` time.
- **.env file**: `make setup` copies `.env.example` to `.env` automatically. You must edit it with your `OPENROUTER_API_KEY` and a `JWT_SECRET` before running the server.
- **Database path**: The SQLite file is created at `backend/data/contaia.db` on first run. This path is gitignored.
- **Data upload**: Excel uploads require an LLM API key (OpenRouter). Without it, the upload flow will fail at the column mapping step.
- **Client schema**: The `clients` table currently uses `name`, `rfc`, `industry` columns. The requirements define `nombre_comercial`, `razon_social`, `rfc`, `industry` — a migration is pending.

### Testing

```bash
make test
```

Runs all tests in `backend/tests/`. Tests are written by QA using pytest with an in-memory SQLite database. The test suite covers:

- Auth endpoints (register, login, me)
- Client CRUD endpoints
- Full integration flows (register → login → create client → list → select)

## Development Phases

### Phase 1: Foundation
- React (Vite) + FastAPI project scaffolding
- SQLite database with schema migrations (all tables)
- Auth endpoints (register, login, JWT)
- Synthetic data generation script
- Frontend: landing page, login, register
- Frontend: sidebar with client list (hardcoded from seed data)

### Phase 2: Chat Pipeline (Agent Loop)
- OpenRouter integration with structured output
- Agent loop: get_schema → execute_sql → generate_chart → search_insights
- SQL injection safety: accountant_id and client_id bound by backend
- Retry logic (up to 3 retries on SQL error)
- Answer synthesis in Spanish
- Chart config generation and validation
- Chat UI: messages, input, inline chart rendering

### Phase 3: Upload
- Excel file upload endpoint (multipart, max 10 MB)
- LLM column mapping with sample rows
- Period auto-detection from date columns
- Data normalization and batch upsert
- Column mapping cache with user confirmation prompt
- Upload summary display
- Frontend: upload form per client

### Phase 4: Dashboard
- KPI cards (ingresos, costos, utilidad, flujo de caja derived)
- Period-over-period change calculations
- Sparkline mini charts (last 6 periods)
- Period selector (only periods with data)
- Quick links to Chat and Insights

### Phase 5: Insights & Polish
- Save insight from chat response (chart responses only)
- Insights page with list, expand, refresh, delete
- On-demand proactive analysis (Analyze button)
- Error handling throughout (LLM unavailable, no data states, upload failures)
- Empty states (no client selected, no data for client, no insights)
- UI polish

