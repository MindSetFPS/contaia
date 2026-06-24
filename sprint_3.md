# Sprint 3 — Chat + Insights + Dashboard

**Objetivo:** El contador puede hacer preguntas en lenguaje natural sobre sus datos, guardar hallazgos como insights, y ver KPIs en el dashboard.

**Orden por fase:** Frontend (mock) → Backend (real) → QA

---

## Setup

| # | Tarea | Responsable |
|---|-------|-------------|
| SC-1 | Agregar `openrouter` a requirements.txt, configurar cliente OpenRouter en `llm.py` | Backend |
| SC-2 | Verificar que `scripts/seed_data.py` genera fechas variadas (6+ meses por cliente) | Backend |

---

## Fase 1: Chat Agent Loop (PB-16 a PB-20)

### Frontend (mock data primero)

| # | Tarea | Depende de |
|---|-------|------------|
| FE-1.1 | Componente ChartRenderer — recibe ChartConfig JSON, renderiza con Recharts según chart_type (line/bar/pie/table). Soporta colores por defecto si el LLM no los envía. | — |
| FE-1.2 | Página /chat — layout: sidebar izquierdo (clientes, heredado de Sprint 1), área central con scroll de mensajes, input field fijo al fondo | Sprint 1 sidebar |
| FE-1.3 | Componente MessageBubble — user messages alineados derecha (azul), assistant messages alineados izquierda (gris). El assistant bubble puede contener texto + ChartRenderer | FE-1.2 |
| FE-1.4 | Integrar ChartRenderer en MessageBubble del asistente | FE-1.3, FE-1.1 |
| FE-1.5 | Conectar input a POST /api/chat, enviar history acumulado, mostrar spinner giratorio durante ejecución del agente | FE-1.2 |

### Backend

| # | Tarea | Depende de |
|---|-------|------------|
| BE-1.1 | Implementar agente base en `llm.py` — función `run_agent(question, history, client_id, accountant_id)` con loop de tool calling usando OpenRouter SDK | SC-1 |
| BE-1.2 | Tool `get_schema` — consultar `information_schema`, devolver `{tables: [{name, columns: [{name, type}]}]}` | BE-1.1 |
| BE-1.3 | Tool `execute_sql` — ejecutar SQL, inyectar `accountant_id` y `client_id` como parámetros bound, validar solo SELECT, bloquear DML (INSERT/UPDATE/DELETE/DROP/ALTER/CREATE) | BE-1.1 |
| BE-1.4 | Tool `generate_chart` — validar ChartConfig JSON devuelto por el LLM (estructura, tipos) y retornarlo o null | BE-1.1 |
| BE-1.5 | Tool `search_insights` — `SELECT * FROM insights WHERE client_id = ? AND (question ILIKE ? OR answer_text ILIKE ?)` | BE-1.1 |
| BE-1.6 | POST /api/chat — body: `{client_id, message, history}`. Llama a `run_agent()`. Response: `{answer_text, chart_config}` | BE-1.1..1.5 |
| BE-1.7 | Retry — si `execute_sql` devuelve error, agregar el error como mensaje del sistema y dejar que el LLM corrija (máx 3 intentos). Timeout total < 2 min | BE-1.3, BE-1.6 |
| BE-1.8 | History management — concatenar history recibido + nuevo mensaje + respuesta. Si excede ~100k tokens, trimear los más antiguos (system prompt + últimos 10 intercambios) | BE-1.6 |

### QA — Chat

| # | Tarea | Depende de |
|---|-------|------------|
| QA-1 | Pregunta simple: "¿Cuáles fueron las ventas de mayo?" — respuesta con número correcto | FE-1.5, BE-1.6 |
| QA-2 | Pregunta con gráfica: "Top 5 productos por ventas" — gráfica de barras renderizada | FE-1.4, BE-1.6 |
| QA-3 | Pregunta fuera de alcance: "¿Cuánto ISR debo pagar?" — responde que no puede | FE-1.5, BE-1.6 |
| QA-4 | SQL inválido: columna inexistente, verificar que reintenta (logs) y responde | BE-1.7 |
| QA-5 | Cambiar de cliente: el chat se limpia, nuevas respuestas corresponden al nuevo cliente | FE-1.5 |
| QA-6 | Aislamiento: seed data con 2 contadores, cada uno solo ve sus propios datos | BE-1.3, FE-1.5 |

---

## Fase 2: Insights (PB-26 a PB-30)

### Frontend

| # | Tarea | Depende de |
|---|-------|------------|
| FE-2.1 | Botón "Guardar en insights" en respuestas del asistente que incluyan chart (no aparece si no hay chart). Llama a POST /api/insights | FE-1.4 |
| FE-2.2 | Página /insights — layout: lista de insights guardados. Cada item: pregunta, fecha, periodo, chart thumbnail. Sidebar heredado. | — |
| FE-2.3 | Expandir insight al hacer clic — muestra answer_text completo + ChartRenderer | FE-2.2, FE-1.1 |
| FE-2.4 | Botón "Refresh" en insight expandido — llama a POST /api/insights/:id/refresh, actualiza vista | FE-2.3 |
| FE-2.5 | Botón "Delete" en insight expandido — llama a DELETE /api/insights/:id, remueve de la lista | FE-2.3 |
| FE-2.6 | Botón "Analyze" en página /insights — llama a POST /api/insights/analyze, muestra resultados con badge "Proactivo" y opción de guardar cada uno | FE-2.2 |

### Backend

| # | Tarea | Depende de |
|---|-------|------------|
| BE-2.1 | GET /api/insights?client_id=X — listar insights ordenados por fecha descendente | Sprint 2 schema |
| BE-2.2 | POST /api/insights — body: `{client_id, question, answer_text, chart_config, is_refreshable, period_date}` | Sprint 2 schema |
| BE-2.3 | DELETE /api/insights/:id — eliminar insight (verificar ownership por accountant_id) | Sprint 2 schema |
| BE-2.4 | POST /api/insights/:id/refresh — body: `{period_date?}`. Re-ejecuta la pregunta original contra nuevo periodo usando `run_agent()` | BE-1.6 |
| BE-2.5 | POST /api/insights/analyze?client_id=X&period_date=Y — envía resumen de datos al LLM, devuelve `[{title, description, chart_config?}]`. No persiste. | BE-1.6 |

### QA — Insights

| # | Tarea | Depende de |
|---|-------|------------|
| QA-7 | Guardar insight desde chat (respuesta con chart) — aparece en /insights | FE-2.1, BE-2.2 |
| QA-8 | Botón "Guardar" no aparece en respuestas sin chart | FE-2.1 |
| QA-9 | Expandir insight — muestra answer + chart correctamente | FE-2.3 |
| QA-10 | Refresh insight — re-ejecuta con nuevo periodo, chart se actualiza | FE-2.4, BE-2.4 |
| QA-11 | Delete insight — desaparece, no afecta otros insights | FE-2.5, BE-2.3 |
| QA-12 | Analyze — devuelve hallazgos, se pueden guardar individualmente | FE-2.6, BE-2.5 |

---

## Fase 3: Dashboard (PB-14 + PB-15)

### Frontend

| # | Tarea | Depende de |
|---|-------|------------|
| FE-3.1 | Componente KpiCard — props: `{title, value, changePercent, trend}` donde trend es "up"/"down"/"stable". Muestra flecha verde/roja/amarilla | — |
| FE-3.2 | Componente PeriodSelector — dropdown con labels "Mayo 2025" (mapear "2025-05" usando meses en español) | — |
| FE-3.3 | Componente MiniChart — sparkline Recharts (LineChart simple, sin ejes ni grid) para últimos 6 periodos | — |
| FE-3.4 | DashboardPage — 4 KpiCards en grid + PeriodSelector arriba + MiniCharts abajo + quick links a /chat y /insights | FE-3.1, FE-3.2, FE-3.3, Sprint 1 sidebar |
| FE-3.5 | Conectar DashboardPage a GET /api/dashboard y GET /api/clients/:id/periods, loading/error/empty states | FE-3.4 |

### Backend

| # | Tarea | Depende de |
|---|-------|------------|
| BE-3.1 | GET /api/clients/:id/periods — `SELECT DISTINCT TO_CHAR(fecha, 'YYYY-MM') FROM sales/expenses/payroll WHERE client_id = ? ORDER BY 1 DESC` | Sprint 2 schema |
| BE-3.2 | GET /api/dashboard?client_id=X&period_date=Y — Y es "2025-05-01". Calcular ingresos (SUM sales.monto_total WHERE fecha >= Y AND fecha < Y+1 mes), costos (SUM expenses.monto WHERE similar), utilidad (ingresos-costos), flujo de caja (ingresos-costos simplificado) | Sprint 2 schema |
| BE-3.3 | Calcular % change vs periodo anterior (restar 1 mes a Y, obtener KPIs de ese periodo) | BE-3.2 |
| BE-3.4 | GET /api/dashboard?client_id=X (sin period_date) — usar el mes más reciente con datos | BE-3.2 |
| BE-3.5 | GET /api/dashboard/mini-chart?client_id=X — devolver últimos 6 meses de cada métrica (ingresos, costos, utilidad) | BE-3.2 |

### QA — Dashboard

| # | Tarea | Depende de |
|---|-------|------------|
| QA-13 | KPIs correctos al seleccionar cliente con datos, cambiar periodo actualiza valores | FE-3.5, BE-3.2 |
| QA-14 | Cliente sin datos — mostrar "No hay datos" con botón a upload | FE-3.5 |
| QA-15 | Flechas de tendencia correctas (verde si % > 0, roja si < 0) | FE-3.1, FE-3.5 |
| QA-16 | Sparklines renderizan últimos 6 periodos correctamente | FE-3.3, BE-3.5 |

---

## Resumen

| Fase | Frontend | Backend | QA | Total |
|------|----------|---------|----|-------|
| Fase 1: Chat | 5 | 8 | 6 | 19 |
| Fase 2: Insights | 6 | 5 | 6 | 17 |
| Fase 3: Dashboard | 5 | 5 | 4 | 14 |
| Setup | 0 | 2 | 0 | 2 |
| **Total** | **16** | **20** | **16** | **52** |
