import json

from sqlmodel import Session

from app.llm.client import OLLAMA_MODEL, client
from app.llm.tools import TOOLS, TOOL_REGISTRY


def _try_parse_chart_config(result: str) -> dict | None:
    try:
        parsed = json.loads(result)
        if "chart_type" in parsed and parsed["chart_type"] in {"line", "bar", "pie", "table"}:
            return parsed
    except (json.JSONDecodeError, TypeError):
        pass
    return None


def _execute_tool_calls(
    messages: list[dict],
    response,
    session: Session,
    accountant_id: int,
    client_id: int,
) -> tuple[bool, dict | None]:
    if not response.message.tool_calls:
        return False, None

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

    chart_config = None
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
            if chart_config is None:
                chart_config = _try_parse_chart_config(result)
        else:
            print(f"[_execute_tool_calls] NO HANDLER for {tool_call.function.name}", flush=True)

    return True, chart_config


def agent_loop(
    messages: list[dict],
    session: Session,
    accountant_id: int,
    client_id: int,
    options: dict | None = None,
    max_turns: int = 5,
) -> tuple[str, dict | None]:
    messages = [*messages]
    chart_config = None
    for turn in range(max_turns):
        print(f"[agent_loop] turn={turn} messages_count={len(messages)} calling ollama...", flush=True)
        print(f"[PROMPT] {json.dumps(messages, ensure_ascii=False, indent=2)[:10000]}", flush=True)
        try:
            response = client.chat(
                model=OLLAMA_MODEL,
                messages=messages,
                tools=TOOLS,
                options=options or {},
                keep_alive="59m",
            )
            print(f"[agent_loop] ollama ok tool_calls={bool(response.message.tool_calls)}", flush=True)
        except Exception as e:
            print(f"[agent_loop] ollama ERROR: {e}", flush=True)
            raise

        called, cc = _execute_tool_calls(messages, response, session, accountant_id, client_id)
        if cc:
            chart_config = cc
        if called:
            print("[agent_loop] tool was called, continuing loop", flush=True)
            continue

        result = response.message.content or ""
        print(f"[agent_loop] final response len={len(result)} chart_config={chart_config is not None}", flush=True)
        return result, chart_config

    print("[agent_loop] max_turns exceeded", flush=True)
    return "El asistente no pudo completar la respuesta (demasiadas iteraciones de herramientas).", None
