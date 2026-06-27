import json
from collections.abc import Generator

from sqlmodel import Session

from app.llm.agent import _execute_tool_calls, _try_parse_chart_config
from app.llm.client import CYAN, GREEN, OLLAMA_MODEL, RED, RESET, YELLOW, client
from app.llm.tools import TOOLS


def get_completion(
    messages: list[dict],
    options: dict | None = None,
) -> str:
    print(f"[get_completion] calling ollama messages={len(messages)}", flush=True)
    print(f"[PROMPT] {json.dumps(messages, ensure_ascii=False, indent=2)[:10000]}", flush=True)
    response = client.chat(model=OLLAMA_MODEL, messages=messages, options=options or {}, keep_alive="59m")
    return response.message.content


def get_completion_stream(
    messages: list[dict],
    session: Session,
    accountant_id: int,
    client_id: int,
    options: dict | None = None,
) -> Generator[dict]:
    messages = [*messages]
    chart_config = None
    for turn in range(10):
        print(f"{CYAN}[stream] turn={turn} calling ollama (tool resolve){RESET}", flush=True)
        print(f"[PROMPT] {json.dumps(messages, ensure_ascii=False, indent=2)[:10000]}", flush=True)
        try:
            response = client.chat(model=OLLAMA_MODEL, messages=messages, tools=TOOLS, options=options or {}, keep_alive="59m")
            print(f"{GREEN}[stream] tool_resolve ok tool_calls={bool(response.message.tool_calls)}{RESET}", flush=True)
        except Exception as e:
            print(f"{RED}[stream] ollama ERROR during tool resolve: {e}{RESET}", flush=True)
            yield {"content": f"Error del modelo: {e}", "thinking": ""}
            return

        called, cc = _execute_tool_calls(messages, response, session, accountant_id, client_id)
        if cc:
            chart_config = cc
        if called:
            print(f"{YELLOW}[stream] tool was called, continuing{RESET}", flush=True)
            continue

        print(f"{CYAN}[stream] calling ollama with stream=True{RESET}", flush=True)
        print(f"[PROMPT] {json.dumps(messages, ensure_ascii=False, indent=2)[:10000]}", flush=True)
        try:
            stream = client.chat(model=OLLAMA_MODEL, messages=messages, options=options or {}, stream=True, think=True, keep_alive="59m")
            chunk_count = 0
            for chunk in stream:
                chunk_count += 1
                thinking = getattr(chunk.message, "thinking", None) or ""
                content = chunk.message.content or ""
                yield {"thinking": thinking, "content": content}
            print(f"[stream] stream done chunk_count={chunk_count} chart_config={chart_config is not None}", flush=True)
        except Exception as e:
            print(f"[stream] ollama ERROR during stream: {e}", flush=True)
            yield {"content": f"Error del modelo: {e}", "thinking": ""}

        if chart_config:
            yield {"content": "", "thinking": "", "chart_config": chart_config}
        return

    print("[stream] max turns exceeded", flush=True)
    yield {
        "content": "El asistente no pudo completar la respuesta (demasiadas iteraciones de herramientas).",
        "thinking": "",
    }
