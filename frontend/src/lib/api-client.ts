import type { Conversation, Message } from "@/types";

const BASE_URL = "/api";

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }

  return res.json();
}

export async function listConversations(
  clientId: number,
  token: string,
): Promise<Conversation[]> {
  return apiRequest<Conversation[]>(
    "GET",
    `/chat/conversations?client_id=${clientId}`,
    undefined,
    token,
  );
}

export async function createConversation(
  clientId: number,
  token: string,
  title?: string,
): Promise<Conversation> {
  return apiRequest<Conversation>(
    "POST",
    "/chat/conversations",
    { client_id: clientId, title },
    token,
  );
}

export async function updateConversation(
  id: number,
  title: string,
  token: string,
): Promise<Conversation> {
  return apiRequest<Conversation>(
    "PUT",
    `/chat/conversations/${id}`,
    { title },
    token,
  );
}

export async function deleteConversation(
  id: number,
  token: string,
): Promise<void> {
  await apiRequest<void>(
    "DELETE",
    `/chat/conversations/${id}`,
    undefined,
    token,
  );
}

export async function getConversationMessages(
  id: number,
  token: string,
): Promise<Message[]> {
  return apiRequest<Message[]>(
    "GET",
    `/chat/conversations/${id}/messages`,
    undefined,
    token,
  );
}

export async function generateConversationTitle(
  id: number,
  token: string,
  model?: string,
): Promise<{ title: string }> {
  return apiRequest<{ title: string }>(
    "POST",
    `/chat/conversations/${id}/generate-title`,
    model ? { model } : {},
    token,
  );
}
