from openrouter import OpenRouter
from sqlmodel import Session

client = OpenRouter()


def get_completion(
    messages: list[dict],
    session: Session | None = None,
) -> str:
    return "LLM endpoint — not yet implemented"
