import json
import os
from collections.abc import Generator

import ollama
from sqlmodel import Session, text

CYAN = "\033[36m"
YELLOW = "\033[33m"
GREEN = "\033[32m"
RED = "\033[31m"
RESET = "\033[0m"

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3.5:9b")

client = ollama.Client(host=OLLAMA_BASE_URL)

DML_KEYWORDS = {
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE",
    "TRUNCATE", "REPLACE", "GRANT", "REVOKE", "EXECUTE",
}

CHART_PALETTE = ["#2563EB", "#16A34A", "#EA580C", "#DC2626", "#7C3AED", "#0891B2", "#CA8A04", "#BE185D"]

VALID_CHART_TYPES = {"line", "bar", "pie", "table"}

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_schema",
            "description": "Obtiene la estructura de todas las tablas de la base de datos (nombres de tablas, columnas y tipos de datos). Úsala para conocer qué información está disponible antes de hacer consultas SQL.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "execute_sql",
            "description": "Ejecuta una consulta SQL de solo lectura. Usa :accountant_id y :client_id como parámetros nombrados para filtrar por el contador y cliente. Devuelve columnas y filas, o un error si la consulta es inválida o contiene DML.",
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {
                        "type": "string",
                        "description": "La consulta SQL a ejecutar. Usa :accountant_id y :client_id como parámetros nombrados.",
                    },
                },
                "required": ["sql"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_chart",
            "description": "Ejecuta una consulta SQL de resumen y convierte el resultado en un JSON de configuración de gráfico (ChartConfig) para renderizar en el frontend. La primera columna del resultado se usará como etiquetas (labels), las columnas numéricas siguientes como series de datos (datasets).",
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {
                        "type": "string",
                        "description": "Consulta SQL que devuelva: primera columna = etiquetas (texto/fecha), columnas siguientes = valores numéricos. Usa :accountant_id y :client_id como parámetros.",
                    },
                    "chart_type": {
                        "type": "string",
                        "enum": ["line", "bar", "pie", "table"],
                        "description": "Tipo de gráfico. Si no se especifica, se infiere de los datos.",
                    },
                    "title": {
                        "type": "string",
                        "description": "Título descriptivo para el gráfico.",
                    },
                },
                "required": ["sql"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_insights",
            "description": "Busca insights guardados por palabra clave. Devuelve coincidencias de preguntas y respuestas previas para el cliente actual. Deshabilitada actualmente.",
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                        "description": "Palabra clave para buscar en insights guardados.",
                    },
                },
                "required": ["keyword"],
            },
        },
    },
]


def get_schema(session: Session) -> str:
    rows = session.exec(
        text("""
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position
        """)
    ).all()

    tables: dict[str, list[dict]] = {}
    for table_name, column_name, data_type, is_nullable in rows:
        tables.setdefault(table_name, []).append({
            "name": column_name,
            "type": data_type,
            "nullable": is_nullable == "YES",
        })

    result = [{"name": name, "columns": cols} for name, cols in tables.items()]
    payload = json.dumps({"tables": result}, ensure_ascii=False)
    print(f"[get_schema] raw output ({len(payload)} chars): {payload[:2000]}", flush=True)
    return payload


def execute_sql(session: Session, accountant_id: int, client_id: int, args: dict) -> str:
    sql = (args.get("sql") or "").strip()
    print(f"[execute_sql] accountant_id={accountant_id} client_id={client_id} sql={sql[:200]}", flush=True)
    if not sql:
        return json.dumps({"error": "No se proporcionó una consulta SQL."})

    sql_upper = sql.upper()
    for kw in DML_KEYWORDS:
        if f" {kw} " in f" {sql_upper} " or sql_upper.startswith(f"{kw} ") or sql_upper == kw:
            print(f"[execute_sql] BLOCKED DML keyword={kw}", flush=True)
            return json.dumps({"error": f"Operación DML no permitida: {kw}"})

    try:
        params = {"accountant_id": accountant_id, "client_id": client_id}
        print(f"[execute_sql] executing with params={params}", flush=True)
        result = session.exec(text(sql), params=params)
        rows = result.all()
        columns = list(result.keys()) if result.keys() else []
        payload = json.dumps({"columns": columns, "rows": [list(r) for r in rows]}, ensure_ascii=False, default=str)
        print(f"[execute_sql] raw output ({len(payload)} chars): {payload[:2000]}", flush=True)
        return payload
    except Exception as e:
        payload = json.dumps({"error": str(e)}, ensure_ascii=False)
        print(f"[execute_sql] ERROR raw output: {payload}", flush=True)
        return payload


def generate_chart(session: Session, accountant_id: int, client_id: int, args: dict) -> str:
    sql = (args.get("sql") or "").strip()
    chart_type = args.get("chart_type")
    title = args.get("title") or "Gráfico"
    print(f"{CYAN}[generate_chart] chart_type={chart_type} title={title} sql={sql[:200]}{RESET}", flush=True)

    if not sql:
        return json.dumps({"error": "No se proporcionó una consulta SQL."})

    sql_upper = sql.upper()
    for kw in DML_KEYWORDS:
        if f" {kw} " in f" {sql_upper} " or sql_upper.startswith(f"{kw} ") or sql_upper == kw:
            return json.dumps({"error": f"Operación DML no permitida: {kw}"})

    if chart_type and chart_type not in VALID_CHART_TYPES:
        return json.dumps({"error": f"Tipo de gráfico inválido: {chart_type}. Válidos: {', '.join(sorted(VALID_CHART_TYPES))}."})

    try:
        params = {"accountant_id": accountant_id, "client_id": client_id}
        result = session.exec(text(sql), params=params)
        rows = result.all()
        columns = list(result.keys()) if result.keys() else []

        if not rows or len(columns) < 2:
            return json.dumps({"error": "La consulta debe devolver al menos 2 columnas (labels + datos)."})

        labels = [str(r[0]) for r in rows]
        datasets = []
        for i in range(1, len(columns)):
            values = []
            for r in rows:
                try:
                    values.append(float(r[i]) if r[i] is not None else 0)
                except (TypeError, ValueError):
                    values.append(0)
            datasets.append({
                "label": columns[i],
                "data": values,
                "color": CHART_PALETTE[(i - 1) % len(CHART_PALETTE)],
            })

        if not chart_type:
            n_labels = len(labels)
            n_datasets = len(datasets)
            if n_datasets == 1 and 2 <= n_labels <= 15:
                chart_type = "pie"
            elif n_labels <= 12:
                chart_type = "bar"
            else:
                chart_type = "line"

        if chart_type == "pie" and len(datasets) > 1:
            datasets = datasets[:1]

        config = {
            "chart_type": chart_type,
            "title": title,
            "labels": labels,
            "datasets": datasets,
        }
        payload = json.dumps(config, ensure_ascii=False, default=str)
        print(f"{GREEN}[generate_chart] chart_config ({len(payload)} chars): {payload[:1000]}{RESET}", flush=True)
        return payload
    except Exception as e:
        payload = json.dumps({"error": str(e)}, ensure_ascii=False)
        print(f"{RED}[generate_chart] ERROR: {payload}{RESET}", flush=True)
        return payload


def search_insights(session: Session, accountant_id: int, client_id: int, args: dict) -> str:
    keyword = (args.get("keyword") or "").strip()
    print(f"{YELLOW}[search_insights] keyword={keyword} accountant_id={accountant_id} client_id={client_id}{RESET}", flush=True)
    return json.dumps({"insights": [], "message": "Búsqueda de insights deshabilitada."}, ensure_ascii=False)


TOOL_REGISTRY = {
    "get_schema": lambda session, accountant_id, client_id, args: get_schema(session),
    "execute_sql": lambda session, accountant_id, client_id, args: execute_sql(session, accountant_id, client_id, args),
    #"generate_chart": lambda session, accountant_id, client_id, args: generate_chart(session, accountant_id, client_id, args),
    # "search_insights": lambda session, accountant_id, client_id, args: search_insights(session, accountant_id, client_id, args),
}


def _execute_tool_calls(messages: list[dict], response, session: Session, accountant_id: int, client_id: int) -> bool:
    if not response.message.tool_calls:
        return False

    tool_calls = [
        {
            "type": "function",
            "function": {
                "name": tc.function.name,
                "arguments": tc.function.arguments,
            },
        }
        for tc in response.message.tool_calls
    ]

    print(f"[_execute_tool_calls] tools={[tc.function.name for tc in response.message.tool_calls]} args={[tc.function.arguments for tc in response.message.tool_calls]}", flush=True)

    messages.append({
        "role": "assistant",
        "content": response.message.content or "",
        "tool_calls": tool_calls,
    })

    for tool_call in response.message.tool_calls:
        handler = TOOL_REGISTRY.get(tool_call.function.name)
        if handler:
            print(f"[_execute_tool_calls] running handler for {tool_call.function.name}", flush=True)
            result = handler(session, accountant_id, client_id, tool_call.function.arguments)
            print(f"[_execute_tool_calls] raw tool output ({len(str(result))} chars): {result}", flush=True)
            messages.append({
                "role": "tool",
                "content": result,
            })
        else:
            print(f"[_execute_tool_calls] NO HANDLER for {tool_call.function.name}", flush=True)

    return True


def agent_loop(
    messages: list[dict],
    session: Session,
    accountant_id: int,
    client_id: int,
    options: dict | None = None,
    max_turns: int = 5,
) -> str:
    messages = [*messages]
    for turn in range(max_turns):
        print(f"[agent_loop] turn={turn} messages_count={len(messages)} calling ollama...", flush=True)
        try:
            response = client.chat(
                model=OLLAMA_MODEL,
                messages=messages,
                tools=TOOLS,
                options=options or {},
            )
            print(f"[agent_loop] ollama ok tool_calls={bool(response.message.tool_calls)}", flush=True)
        except Exception as e:
            print(f"[agent_loop] ollama ERROR: {e}", flush=True)
            raise

        if _execute_tool_calls(messages, response, session, accountant_id, client_id):
            print(f"[agent_loop] tool was called, continuing loop", flush=True)
            continue

        result = response.message.content or ""
        print(f"[agent_loop] final response len={len(result)}", flush=True)
        return result

    print(f"[agent_loop] max_turns exceeded", flush=True)
    return "El asistente no pudo completar la respuesta (demasiadas iteraciones de herramientas)."


def get_completion(
    messages: list[dict],
    options: dict | None = None,
) -> str:
    print(f"[get_completion] calling ollama messages={len(messages)}", flush=True)
    response = client.chat(model=OLLAMA_MODEL, messages=messages, options=options or {})
    return response.message.content


def get_completion_stream(
    messages: list[dict],
    session: Session,
    accountant_id: int,
    client_id: int,
    options: dict | None = None,
) -> Generator[dict]:
    messages = [*messages]
    for turn in range(10):
        print(f"{CYAN}[stream] turn={turn} calling ollama (tool resolve){RESET}", flush=True)
        try:
            response = client.chat(model=OLLAMA_MODEL, messages=messages, tools=TOOLS, options=options or {})
            print(f"{GREEN}[stream] tool_resolve ok tool_calls={bool(response.message.tool_calls)}{RESET}", flush=True)
        except Exception as e:
            print(f"{RED}[stream] ollama ERROR during tool resolve: {e}{RESET}", flush=True)
            yield {"content": f"Error del modelo: {e}", "thinking": ""}
            return

        if _execute_tool_calls(messages, response, session, accountant_id, client_id):
            print(f"{YELLOW}[stream] tool was called, continuing{RESET}", flush=True)
            continue

        print(f"{CYAN}[stream] calling ollama with stream=True{RESET}", flush=True)
        try:
            stream = client.chat(model=OLLAMA_MODEL, messages=messages, options=options or {}, stream=True, think=True)
            chunk_count = 0
            for chunk in stream:
                chunk_count += 1
                thinking = getattr(chunk.message, "thinking", None) or ""
                content = chunk.message.content or ""
                yield {"thinking": thinking, "content": content}
            print(f"[stream] stream done chunk_count={chunk_count}", flush=True)
        except Exception as e:
            print(f"[stream] ollama ERROR during stream: {e}", flush=True)
            yield {"content": f"Error del modelo: {e}", "thinking": ""}
        return

    print(f"[stream] max turns exceeded", flush=True)
    yield {
        "content": "El asistente no pudo completar la respuesta (demasiadas iteraciones de herramientas).",
        "thinking": "",
    }
