# Sprint 2 — Carga de Datos (Excel Upload)

**Objetivo:** El contador puede subir archivos Excel de ventas, gastos o nómina, el sistema mapea columnas con IA, reemplaza datos del periodo y muestra resumen.

**Duración:** 1 semana

---

## Setup

| # | Tarea | Responsable | QA | Depende de |
|---|-------|-------------|-----|------------|
| 1 | Agregar `python-multipart`, `pandas`, `openpyxl` a `requirements.txt` | Backend | — | — |
| 2 | Agregar tabla `uploads` al schema en `db.py` (historial de cargas) | Backend | — | — |

## PB-07: Subir archivo Excel

| # | Tarea | Responsable | QA | Depende de |
|---|-------|-------------|-----|------------|
| 3 | Backend: `POST /api/upload` — validar .xlsx, max 10 MB, no vacío, recibir `client_id` + `table_type` | Backend | Sí | 1 |
| 4 | Backend: leer archivo con `pandas.read_excel()` → DataFrame | Backend | — | 1 |
| 5 | Frontend: página/submódulo de upload con selector de cliente, tipo de tabla (dropdown) y file input | Frontend | Sí | — |
| 6 | Frontend: conectar formulario a `POST /api/upload`, mostrar loading state | Frontend | Sí | 3, 5 |

## PB-08 + PB-09: Periodo auto-detectado + Mapeo de columnas con IA

| # | Tarea | Responsable | QA | Depende de |
|---|-------|-------------|-----|------------|
| 7 | Backend: función `llm_column_mapping()` — enviar headers + 3 sample rows al LLM, recibir JSON con mapeo + transformaciones + periodos detectados | Backend | Sí | 4 |
| 8 | Backend: aplicar mapeo y transformaciones al DataFrame completo | Backend | — | 7 |
| 9 | Backend: detectar y poblar periodos en tabla `periods` desde fechas del DataFrame | Backend | — | 8 |

## PB-10: Reutilizar mapeo anterior

| # | Tarea | Responsable | QA | Depende de |
|---|-------|-------------|-----|------------|
| 10 | Backend: implementar caché de mapeo keyeado por `(accountant_id, client_id, table_type, sorted_column_set)` | Backend | Sí | 7 |
| 11 | Backend: endpoint `GET /api/upload/mapping-check` — devolver si hay mapeo cacheado y las columnas detectadas | Backend | — | 10 |
| 12 | Frontend: mostrar modal "Usar mapeo anterior?" con columnas detectadas vs columnas del nuevo archivo | Frontend | Sí | 11 |

## PB-11: Reemplazar datos al subir

| # | Tarea | Responsable | QA | Depende de |
|---|-------|-------------|-----|------------|
| 13 | Backend: upsert — DELETE WHERE (accountant_id, client_id, period_id, table_type) + INSERT batch en tabla target (sales/expenses/payroll) | Backend | Sí | 8 |

## PB-12: Resumen de carga

| # | Tarea | Responsable | QA | Depende de |
|---|-------|-------------|-----|------------|
| 14 | Backend: `POST /api/upload` devuelve `{table_type, period, rows_processed, rows_skipped, skipped_reasons, unused_columns}` | Backend | — | 13 |
| 15 | Frontend: mostrar resumen de carga con tabla, periodo, filas procesadas/omitidas, columnas no usadas | Frontend | Sí | 14 |

## PB-13: Historial de cargas

| # | Tarea | Responsable | QA | Depende de |
|---|-------|-------------|-----|------------|
| 16 | Backend: `GET /api/uploads?client_id=X` — listar cargas ordenadas por fecha descendente | Backend | Sí | 2 |
| 17 | Frontend: tabla/historial de cargas por cliente con tipo, periodo, fecha, filas procesadas | Frontend | Sí | 16 |

---

## Tareas de QA

| # | Tarea | Responsable | Depende de |
|---|-------|-------------|------------|
| QA-1 | Setup pytest fixtures: Excel de prueba para ventas, gastos, nómina (crear archivos .xlsx de ejemplo) | QA | 1 |
| QA-2 | Tests: `POST /api/upload` — archivo válido, archivo >10MB, archivo vacío, tipo inválido, sin auth | QA | 3 |
| QA-3 | Tests: mapeo de columnas con LLM mockeado (respuesta simulada) | QA | 7 |
| QA-4 | Tests: caché de mapeo (mismo conjunto de columnas devuelve cache, columnas nuevas piden mapeo nuevo) | QA | 10 |
| QA-5 | Tests: upsert reemplaza datos existentes para mismo cliente + periodo + tipo de tabla | QA | 13 |
| QA-6 | Tests: resumen de carga tiene filas correctas | QA | 14 |
| QA-7 | Tests: `GET /api/uploads` devuelve historial ordenado | QA | 16 |
| QA-8 | Test de integración: upload → mapeo → upsert → resumen → historial | QA | QA-2 a QA-7 |

---

## Resumen

| Tipo | Cantidad |
|------|----------|
| Tareas backend | 12 |
| Tareas frontend | 6 |
| Tareas QA | 8 |
| **Total** | **26** |

## Flujo QA + Dev

```
Dev termina feature (ej. tareas 3, 4, 5, 6)
  → QA clona la branch feature/upload-endpoint
  → QA escribe tests (QA-2) y los sube a la misma branch
  → QA ejecuta tests: pytest
  → Si pasan → QA aprueba PR → merge a develop
  → Si fallan → QA reporta bug → dev corrige → QA re-ejecuta
```

## Definición de Done

Una tarea está completada cuando:
- Código implementado y funcional en entorno local
- `make lint` pasa (ruff + prettier)
- Tests automatizados escritos por QA y ejecutados sin error
- QA aprueba la funcionalidad
- Sin bugs conocidos de prioridad crítica o alta

## Release al final del Sprint

```bash
git checkout develop
git checkout -b release/v0.2.0
# Bump version en frontend/package.json
# Actualizar CHANGELOG.md
# QA regression testing
git checkout main
git merge release/v0.2.0
git tag v0.2.0
git push origin main --tags
```
