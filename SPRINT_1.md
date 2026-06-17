# Sprint 1 — Fundación: Auth + Clientes

**Objetivo:** El contador puede registrarse, iniciar sesión, y gestionar (crear, listar, seleccionar) sus clientes.

**Duración:** 3 días

---

## Setup inicial

| # | Tarea | Responsable | QA | Depende de |
|---|-------|-------------|-----|------------|
| 1 | Inicializar backend: FastAPI + estructura de carpetas, `main.py` con CORS, health check | Backend | — | — |
| 2 | Inicializar frontend: Vite + React + TypeScript + Tailwind + shadcn/ui configurados | Frontend | — | — |
| 3 | Crear `db.py` con esquema SQLite (tablas `accountants`, `clients`, `periods`) | Backend | — | 1 |
| 4 | Configurar variables de entorno (`.env`): `DATABASE_PATH`, `JWT_SECRET` | Backend | — | 1 |
| 5 | Configurar enrutamiento en frontend (React Router): `/`, `/login`, `/register`, `/dashboard` | Frontend | — | 2 |
| 6 | Crear layout base para páginas autenticadas (sidebar placeholder + top bar + main content) | Frontend | — | 2 |

---

## PB-01: Registro

| # | Tarea | Responsable | QA | Depende de |
|---|-------|-------------|-----|------------|
| 7 | Backend: `POST /api/auth/register` — validar email único, password ≥ 8 chars, hash con bcrypt, insertar en `accountants`, devolver JWT | Backend | Sí | 3, 4 |
| 8 | Backend: modelo Pydantic `RegisterRequest` y `AuthResponse` en `models.py` | Backend | — | 1 |
| 9 | Frontend: página `/register` con formulario (email, password, name) + validación básica | Frontend | Sí | 5 |
| 10 | Frontend: conectar formulario a `POST /api/auth/register`, guardar JWT en localStorage, redirigir a `/dashboard` | Frontend | Sí | 7, 9 |

---

## PB-02: Inicio de sesión

| # | Tarea | Responsable | QA | Depende de |
|---|-------|-------------|-----|------------|
| 11 | Backend: `POST /api/auth/login` — validar credenciales, devolver JWT + datos del usuario | Backend | Sí | 3, 4 |
| 12 | Backend: modelo Pydantic `LoginRequest` en `models.py` | Backend | — | 1 |
| 13 | Frontend: página `/login` con formulario (email, password) | Frontend | Sí | 5 |
| 14 | Frontend: conectar formulario a `POST /api/auth/login`, guardar JWT, redirigir a `/dashboard` | Frontend | Sí | 11, 13 |

---

## PB-03: Cerrar sesión + estado de auth

| # | Tarea | Responsable | QA | Depende de |
|---|-------|-------------|-----|------------|
| 15 | Backend: `GET /api/auth/me` — devolver datos del usuario desde JWT | Backend | Sí | 3, 4 |
| 16 | Frontend: crear `AuthContext` (JWT, user, login, logout, isAuthenticated) | Frontend | — | 10, 14 |
| 17 | Frontend: botón/logout en top bar — limpia JWT de localStorage, redirige a landing | Frontend | Sí | 16 |
| 18 | Frontend: landing page `/` (no autenticado) vs redirect a `/dashboard` (autenticado) | Frontend | Sí | 5, 16 |

---

## PB-04: Registrar cliente

| # | Tarea | Responsable | QA | Depende de |
|---|-------|-------------|-----|------------|
| 19 | Backend: `POST /api/clients` — validar y crear cliente asociado al `accountant_id` del JWT | Backend | Sí | 3, 4 |
| 20 | Backend: modelo Pydantic `ClientCreate` y `ClientResponse` en `models.py` | Backend | — | 1 |
| 21 | Frontend: modal "Agregar cliente" con 4 campos (nombre comercial, razón social, RFC, industria) | Frontend | Sí | 6 |
| 22 | Frontend: conectar modal a `POST /api/clients`, auto-seleccionar el nuevo cliente | Frontend | Sí | 19, 21 |

---

## PB-05: Lista de clientes

| # | Tarea | Responsable | QA | Depende de |
|---|-------|-------------|-----|------------|
| 23 | Backend: `GET /api/clients` — devolver lista de clientes del contador autenticado | Backend | Sí | 3, 4 |
| 24 | Frontend: sidebar dinámico — cargar clientes desde API, mostrar lista, resaltar seleccionado | Frontend | Sí | 6, 23 |
| 25 | Frontend: crear `ClientContext` (selectedClient, setSelectedClient, clients list) | Frontend | — | 24 |

---

## PB-06: Seleccionar cliente

| # | Tarea | Responsable | QA | Depende de |
|---|-------|-------------|-----|------------|
| 26 | Frontend: al hacer clic en un cliente del sidebar, actualizar `selectedClient` global | Frontend | Sí | 25 |
| 27 | Frontend: mostrar nombre del cliente seleccionado en top bar ("Cliente: X") | Frontend | Sí | 25 |
| 28 | Frontend: mostrar placeholder en contenido principal si no hay cliente seleccionado ("Selecciona un cliente") | Frontend | Sí | 6, 25 |

---

## Tareas de QA

### Setup de testing

| # | Tarea | Responsable | Depende de |
|---|-------|-------------|------------|
| QA-1 | Configurar pytest en backend (`conftest.py`, DB de prueba en memoria, client de prueba, fixtures) | QA | 1, 3 |

### Tests de autenticación

| # | Tarea | Responsable | Depende de |
|---|-------|-------------|------------|
| QA-2 | Escribir tests de API: `POST /api/auth/register` (éxito, email duplicado, password corto, campos vacíos) | QA | 7 |
| QA-3 | Escribir tests de API: `POST /api/auth/login` (éxito, credenciales incorrectas) | QA | 11 |
| QA-4 | Escribir tests de API: `GET /api/auth/me` (token válido, sin token, token inválido) | QA | 15 |

### Tests de clientes

| # | Tarea | Responsable | Depende de |
|---|-------|-------------|------------|
| QA-5 | Escribir tests de API: `POST /api/clients` (campos válidos, RFC vacío, industria vacía, sin auth) | QA | 19 |
| QA-6 | Escribir tests de API: `GET /api/clients` (con clientes, sin clientes, sin auth) | QA | 23 |

### Tests de integración

| # | Tarea | Responsable | Depende de |
|---|-------|-------------|------------|
| QA-7 | Escribir test de flujo completo vía API: register → login → crear cliente → listar → seleccionar | QA | QA-2, QA-3, QA-5, QA-6 |

---

## Resumen

| Tipo | Cantidad |
|------|----------|
| Tareas backend | 10 |
| Tareas frontend | 16 |
| Tareas compartidas | 2 |
| Tareas QA | 7 |
| **Total** | **35** |

## Flujo QA + Dev

```
Dev termina feature (ej. tareas 7, 8, 9, 10)
  → QA clona la branch feature/auth-register
  → QA escribe tests (QA-2, QA-3) y los sube a la misma branch
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
