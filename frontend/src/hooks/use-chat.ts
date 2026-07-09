import { useState, useRef, useEffect, useCallback } from "react";
import type { Client, ChartConfig, Conversation, Message } from "@/types";
import {
  listConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  getConversationMessages,
  generateConversationTitle,
} from "@/lib/api-client";
import { readSSEStream } from "@/lib/sse";
import type { AnyMessage } from "@/components/chat-message";
import { isAssistant } from "@/components/chat-message";

export function useChat(
  selectedClient: Client | null,
  token: string | null,
  conversationId: string | undefined,
) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);
  const [messages, setMessages] = useState<AnyMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const nextIdRef = useRef(0);
  const nextBranchIdRef = useRef(0);
  const conversationsRef = useRef(conversations);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (conversationId) {
      const id = Number(conversationId);
      if (!isNaN(id)) {
        setActiveConversationId(id);
        loadMessages(id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    if (!selectedClient || !token) return;
    listConversations(selectedClient.id, token)
      .then(setConversations)
      .catch(() => {});
  }, [selectedClient, token]);

  function messageFromApi(msg: Message, altId?: number): AnyMessage {
    const id = altId ?? msg.id;
    if (msg.role === "user") {
      return { id, role: "user", content: msg.content };
    }
    const branchId = nextBranchIdRef.current++;
    return {
      id,
      role: "assistant",
      branches: [
        {
          branchId,
          content: msg.content,
          thinking: "",
          thinkingDone: true,
          chartConfig: msg.chart_config ?? undefined,
        },
      ],
      currentBranch: 0,
    };
  }

  async function loadMessages(convId: number) {
    if (!token) return;
    try {
      const msgs = await getConversationMessages(convId, token);
      if (msgs.length === 0) {
        setMessages([]);
      } else {
        nextIdRef.current = msgs.length + 1;
        setMessages(msgs.map((m) => messageFromApi(m)));
      }
    } catch {
      setMessages([]);
    }
  }

  async function loadConversations() {
    if (!selectedClient || !token) return;
    try {
      const convs = await listConversations(selectedClient.id, token);
      setConversations(convs);
    } catch {
      // ignore
    }
  }

  function _createAssistantPlaceholder(targetId: number, assistantId: number | null) {
    if (assistantId !== null) {
      const branchId = nextBranchIdRef.current++;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && isAssistant(m)
            ? {
                ...m,
                branches: [
                  ...m.branches,
                  {
                    branchId,
                    content: "",
                    thinking: "",
                    thinkingDone: false,
                    chartConfig: undefined,
                  },
                ],
                currentBranch: m.branches.length,
              }
            : m,
        ),
      );
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: targetId,
          role: "assistant",
          branches: [
            {
              branchId: nextBranchIdRef.current++,
              content: "",
              thinking: "",
              thinkingDone: false,
            },
          ],
          currentBranch: 0,
        },
      ]);
    }
  }

  function _updateMessageBranch(
    targetId: number,
    content: string,
    thinking: string,
    thinkingDone: boolean,
    chartConfig: ChartConfig | undefined,
  ) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== targetId || !isAssistant(m)) return m;
        const branches = m.branches.map((b, i) =>
          i === m.branches.length - 1
            ? { branchId: b.branchId, content, thinking, thinkingDone, chartConfig }
            : b,
        );
        return { ...m, branches };
      }),
    );
  }

  function _replaceLastBranchWithError(
    targetId: number,
    thinking: string,
    thinkingDone: boolean,
    chartConfig: ChartConfig | undefined,
  ) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== targetId || !isAssistant(m)) return m;
        const branches = m.branches.map((b, i) =>
          i === m.branches.length - 1
            ? {
                branchId: b.branchId,
                content: "Ocurrió un error al obtener respuesta. Intenta de nuevo.",
                thinking,
                thinkingDone,
                chartConfig,
              }
            : b,
        );
        return { ...m, branches };
      }),
    );
  }

  async function _handlePostStream(cid: number, skipTitleCheck: boolean) {
    const shouldGenerateTitle =
      skipTitleCheck ||
      conversations.some(
        (c) => c.id === cid && c.title === "Nueva conversación",
      );
    await loadConversations();
    if (shouldGenerateTitle) {
      try {
        const result = await generateConversationTitle(cid, token!);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === cid ? { ...c, title: result.title } : c,
          ),
        );
      } catch (err) {
        console.error("generateConversationTitle failed:", err);
      }
    }
  }

  async function sendMessage(
    text: string,
    assistantId: number | null,
    convId?: number,
    skipTitleCheck = false,
  ) {
    const cid = convId ?? activeConversationId;
    if (!cid) return;
    abortRef.current = new AbortController();
    setLoading(true);

    let content = "";
    let thinking = "";
    let thinkingDone = false;
    let chartConfig: ChartConfig | undefined;

    const targetId = assistantId ?? nextIdRef.current++;
    _createAssistantPlaceholder(targetId, assistantId);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ conversation_id: cid, message: text }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`Request failed (HTTP ${res.status})`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader — response body missing");

      for await (const parsed of readSSEStream(reader)) {
        if (parsed.thinking) thinking += parsed.thinking;
        if (parsed.content) {
          thinkingDone = true;
          content += parsed.content;
        }
        if (parsed.chart_config) chartConfig = parsed.chart_config as ChartConfig;

        if (parsed.thinking || parsed.content || parsed.chart_config) {
          _updateMessageBranch(targetId, content, thinking, thinkingDone, chartConfig);
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      _replaceLastBranchWithError(targetId, thinking, thinkingDone, chartConfig);
    } finally {
      setLoading(false);
      abortRef.current = null;
      await _handlePostStream(cid, skipTitleCheck);
    }
  }

  async function handleSubmit(text: string) {
    if (!text.trim() || loading || !selectedClient) return;

    let cid = activeConversationId;
    const isNewConversation = !cid;
    if (!cid) {
      try {
        const conv = await createConversation(selectedClient.id, token!);
        setConversations((prev) => [conv, ...prev]);
        setActiveConversationId(conv.id);
        cid = conv.id;
      } catch {
        return;
      }
    }

    setMessages((prev) => [
      ...prev,
      { id: nextIdRef.current++, role: "user", content: text },
    ]);

    await sendMessage(text, null, cid, isNewConversation);
  }

  async function handleRetry(assistantId: number) {
    if (loading || !selectedClient) return;

    const idx = messages.findIndex((m) => m.id === assistantId);
    if (idx < 1) return;

    const userMsg = messages[idx - 1];
    if (!userMsg || userMsg.role !== "user") return;

    await sendMessage(userMsg.content, assistantId);
  }

  function handleBranchChange(msgId: number, branchIdx: number) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && isAssistant(m)
          ? { ...m, currentBranch: branchIdx }
          : m,
      ),
    );
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  const handleSelectConversation = useCallback(
    async (id: number) => {
      setActiveConversationId(id);
      await loadMessages(id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token],
  );

  async function handleNewConversation() {
    if (!selectedClient || !token) return;
    if (conversations.length === 0) return;
    setActiveConversationId(null);
    setMessages([]);
  }

  async function handleDeleteConversation(id: number) {
    if (!token) return;
    try {
      await deleteConversation(id, token);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        const remaining = conversationsRef.current.filter((c) => c.id !== id);
        const next = remaining[0];
        if (next) {
          setActiveConversationId(next.id);
          await loadMessages(next.id);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
    } catch {
      // ignore
    }
  }

  async function handleRenameConversation(id: number, title: string) {
    if (!token) return;
    try {
      await updateConversation(id, title, token);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c)),
      );
    } catch {
      // ignore
    }
  }

  return {
    conversations,
    activeConversationId,
    messages,
    loading,
    handleSubmit,
    handleNewConversation,
    handleDeleteConversation,
    handleRenameConversation,
    handleSelectConversation,
    handleRetry,
    handleBranchChange,
    handleStop,
  };
}
