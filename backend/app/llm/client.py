import os

import ollama

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3.6:35b-a3b-q4_K_M")

client = ollama.Client(host=OLLAMA_BASE_URL)

DML_KEYWORDS = {
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE",
    "TRUNCATE", "REPLACE", "GRANT", "REVOKE", "EXECUTE",
}

CHART_PALETTE = ["#2563EB", "#16A34A", "#EA580C", "#DC2626", "#7C3AED", "#0891B2", "#CA8A04", "#BE185D"]

VALID_CHART_TYPES = {"line", "bar", "pie", "table"}

CYAN = "\033[36m"
YELLOW = "\033[33m"
GREEN = "\033[32m"
RED = "\033[31m"
RESET = "\033[0m"
