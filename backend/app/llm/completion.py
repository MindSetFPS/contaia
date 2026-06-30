import json
from collections.abc import Generator

from sqlmodel import Session

from app.llm.agent import _try_parse_chart_config
from app.llm.client import CYAN, GREEN, OLLAMA_MODEL, RED, RESET, client
from app.llm.tools import TOOLS, TOOL_REGISTRY


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
        print(f"{CYAN}[stream] turn={turn} calling ollama (streaming with tools){RESET}", flush=True)
        print(f"[PROMPT] {json.dumps(messages, ensure_ascii=False, indent=2)[:10000]}", flush=True)
        try:
            stream = client.chat(
                model=OLLAMA_MODEL,
                messages=messages,
                tools=TOOLS,
                options=options or {},
                stream=True,
                think=True,
                keep_alive="59m",
            )
        except Exception as e:
            print(f"{RED}[stream] ollama ERROR: {e}{RESET}", flush=True)
            yield {"content": f"Error del modelo: {e}", "thinking": ""}
            return

        content = ""
        tool_calls = None
        chunk_count = 0

        for chunk in stream:
            chunk_count += 1
            thinking = getattr(chunk.message, "thinking", None) or ""
            content_part = chunk.message.content or ""

            if thinking:
                yield {"thinking": thinking, "content": ""}

            if content_part:
                content += content_part
                yield {"thinking": "", "content": content_part}

            if chunk.message.tool_calls:
                tool_calls = chunk.message.tool_calls

        print(f"{GREEN}[stream] turn={turn} done chunks={chunk_count} tool_calls={bool(tool_calls)} content_len={len(content)}{RESET}", flush=True)

        if tool_calls:
            tc_list = [
                {
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    },
                }
                for tc in tool_calls
            ]

            messages.append({
                "role": "assistant",
                "content": content,
                "tool_calls": tc_list,
            })

            for tc in tool_calls:
                handler = TOOL_REGISTRY.get(tc.function.name)
                if handler:
                    print(f"[stream] running handler for {tc.function.name}", flush=True)
                    result = handler(session, accountant_id, client_id, tc.function.arguments)
                    print(f"[stream] raw tool output ({len(str(result))} chars): {result}", flush=True)
                    messages.append({
                        "role": "tool",
                        "content": result,
                    })
                    if chart_config is None:
                        chart_config = _try_parse_chart_config(result)
                else:
                    print(f"[stream] NO HANDLER for {tc.function.name}", flush=True)

            continue

        if chart_config:
            yield {"thinking": "", "content": "", "chart_config": chart_config}
        return

    print("[stream] max turns exceeded", flush=True)
    yield {
        "content": "El asistente no pudo completar la respuesta (demasiadas iteraciones de herramientas).",
        "thinking": "",
    }
