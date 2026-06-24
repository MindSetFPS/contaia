import os
from collections.abc import Generator

import ollama

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3.5:9b")

client = ollama.Client(host=OLLAMA_BASE_URL)


def get_completion(
    messages: list[dict],
) -> str:
    response = client.chat(model=OLLAMA_MODEL, messages=messages)
    return response.message.content


def get_completion_stream(
    messages: list[dict],
) -> Generator[dict]:
    stream = client.chat(model=OLLAMA_MODEL, messages=messages, stream=True, think=True)
    for chunk in stream:
        thinking = getattr(chunk.message, "thinking", None) or ""
        content = chunk.message.content or ""
        yield {"thinking": thinking, "content": content}
