import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useClient } from "@/contexts/client-context";
import { useAuth } from "@/contexts/auth-context";
import type { ChartConfig } from "@/types";
import ChartRenderer from "@/components/chart-renderer";
import ConversationList from "@/components/conversation-list";
import type { MockConversation } from "@/components/conversation-list";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageAction,
  MessageActions,
  MessageBranch,
  MessageBranchContent,
  MessageBranchSelector,
  MessageBranchPrevious,
  MessageBranchPage,
  MessageBranchNext,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Conversation,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { CopyIcon, RefreshCw, PanelLeftClose, PanelLeft } from "lucide-react";

let nextId = 0;
let nextBranchId = 0;

const WELCOME_BRANCH = {
  branchId: nextBranchId++,
  content:
    "¡Hola! Soy tu asistente financiero. Pregúntame sobre ingresos, gastos, utilidad o ventas de tu cliente.",
  thinking: "",
  thinkingDone: true,
};

type Branch = {
  branchId: number;
  content: string;
  thinking: string;
  thinkingDone: boolean;
  chartConfig?: ChartConfig;
};

type MessageData = {
  id: number;
  role: "user";
  content: string;
};

type AssistantMessageData = {
  id: number;
  role: "assistant";
  branches: Branch[];
  currentBranch: number;
};

type AnyMessage = MessageData | AssistantMessageData;

function isAssistant(m: AnyMessage): m is AssistantMessageData {
  return m.role === "assistant";
}

function buildHistory(messages: AnyMessage[], upToIdx: number) {
  const result: { role: string; content: string }[] = [];
  for (let i = 0; i <= upToIdx; i++) {
    const m = messages[i];
    if (!m) continue;
    if (m.role === "user") {
      result.push({ role: "user", content: m.content });
    } else if (isAssistant(m)) {
      const branch = m.branches[m.currentBranch];
      if (branch?.content) {
        result.push({ role: "assistant", content: branch.content });
      }
    }
  }
  return result;
}

function ScrollContent({ children }: { children: React.ReactNode }) {
  const { scrollRef, contentRef } = useStickToBottomContext();
  return (
    <div ref={scrollRef} className="h-full w-full overflow-y-auto">
      <div
        ref={contentRef}
        className="mx-auto max-w-3xl flex flex-col gap-8 p-4"
      >
        {children}
      </div>
    </div>
  );
}

function createWelcomeMessages(): AnyMessage[] {
  return [
    {
      id: nextId++,
      role: "assistant",
      branches: [{ ...WELCOME_BRANCH, branchId: nextBranchId++ }],
      currentBranch: 0,
    },
  ];
}

function createEmptyConversation(id: number, title: string): MockConversation {
  return {
    id,
    title,
    lastMessageAt: new Date().toISOString(),
    messageCount: 0,
    lastMessagePreview: "",
  };
}

const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: 1,
    title: "Análisis de ventas Q1",
    lastMessageAt: "2026-07-04T10:30:00",
    messageCount: 12,
    lastMessagePreview: "Las ventas totales en Q1 fueron...",
  },
  {
    id: 2,
    title: "Comparativa de gastos 2025 vs 2026",
    lastMessageAt: "2026-07-03T15:45:00",
    messageCount: 8,
    lastMessagePreview: "Los gastos administrativos aumentaron un...",
  },
  {
    id: 3,
    title: "Proyección de utilidades",
    lastMessageAt: "2026-07-02T09:15:00",
    messageCount: 5,
    lastMessagePreview:
      "Con base en los datos actuales, la utilidad proyectada...",
  },
  {
    id: 4,
    title: "Declaración mensual de impuestos",
    lastMessageAt: "2026-06-28T14:20:00",
    messageCount: 15,
    lastMessagePreview: "Recuerda que la fecha límite para...",
  },
];

const MOCK_MESSAGES: Record<number, AnyMessage[]> = {
  1: [
    {
      id: nextId++,
      role: "user",
      content: "¿Cuáles fueron las ventas totales del Q1 2026?",
    },
    {
      id: nextId++,
      role: "assistant",
      branches: [
        {
          branchId: nextBranchId++,
          content:
            "Las ventas totales del Q1 2026 fueron de $1,245,000.00 MXN, lo que representa un incremento del 12% respecto al mismo período del año anterior.",
          thinking: "",
          thinkingDone: true,
        },
      ],
      currentBranch: 0,
    },
    {
      id: nextId++,
      role: "user",
      content: "¿Cuál fue el producto más vendido?",
    },
    {
      id: nextId++,
      role: "assistant",
      branches: [
        {
          branchId: nextBranchId++,
          content:
            "El producto más vendido en Q1 2026 fue el 'Servicio Premium Plus' con 245 unidades vendidas, generando $420,000 MXN en ingresos.",
          thinking: "",
          thinkingDone: true,
        },
      ],
      currentBranch: 0,
    },
    {
      id: nextId++,
      role: "user",
      content: "Muéstrame una gráfica de ventas por mes",
    },
    {
      id: nextId++,
      role: "assistant",
      branches: [
        {
          branchId: nextBranchId++,
          content: "Aquí tienes la gráfica de ventas mensuales del Q1 2026.",
          thinking: "",
          thinkingDone: true,
          chartConfig: {
            chart_type: "bar",
            title: "Ventas Mensuales Q1 2026",
            labels: ["Enero", "Febrero", "Marzo"],
            datasets: [{ label: "Ventas", data: [380000, 415000, 450000] }],
          },
        },
      ],
      currentBranch: 0,
    },
  ],
  2: [
    {
      id: nextId++,
      role: "user",
      content: "Compara los gastos de 2025 vs 2026",
    },
    {
      id: nextId++,
      role: "assistant",
      branches: [
        {
          branchId: nextBranchId++,
          content:
            "Los gastos totales en 2025 fueron de $3,200,000 MXN, mientras que en lo que va de 2026 suman $1,850,000 MXN. Los gastos administrativos aumentaron un 8%, mientras que los operativos se redujeron un 3%.",
          thinking: "",
          thinkingDone: true,
        },
      ],
      currentBranch: 0,
    },
  ],
  3: [
    {
      id: nextId++,
      role: "user",
      content: "¿Cuál es la proyección de utilidad para este año?",
    },
    {
      id: nextId++,
      role: "assistant",
      branches: [
        {
          branchId: nextBranchId++,
          content:
            "Con base en los datos actuales y las tendencias históricas, la utilidad neta proyectada para el cierre de 2026 es de $1,520,000 MXN, un 15% superior a 2025.",
          thinking: "",
          thinkingDone: true,
        },
      ],
      currentBranch: 0,
    },
  ],
  4: [
    {
      id: nextId++,
      role: "user",
      content: "¿Cuándo es la próxima declaración de impuestos?",
    },
    {
      id: nextId++,
      role: "assistant",
      branches: [
        {
          branchId: nextBranchId++,
          content:
            "La próxima declaración mensual de impuestos vence el 17 de julio de 2026. Te recomiendo tener lista la información de ingresos y gastos de junio con al menos una semana de anticipación.",
          thinking: "",
          thinkingDone: true,
        },
      ],
      currentBranch: 0,
    },
  ],
};

export default function ChatsPage() {
  const { selectedClient } = useClient();
  const { token } = useAuth();
  const { conversationId } = useParams();
  const [conversations, setConversations] =
    useState<MockConversation[]>(MOCK_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(MOCK_CONVERSATIONS[0]?.id ?? null);
  const [messages, setMessages] = useState<AnyMessage[]>(() => {
    const id = MOCK_CONVERSATIONS[0]?.id;
    return id && MOCK_MESSAGES[id]
      ? [...MOCK_MESSAGES[id]]
      : createWelcomeMessages();
  });
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const nextConvId = useRef(MOCK_CONVERSATIONS.length + 1);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (conversationId) {
      console.log("[chats-page] loading conversation", conversationId);
    }
  }, [conversationId]);

  async function sendMessage(
    text: string,
    assistantId: number | null,
    history: { role: string; content: string }[],
  ) {
    abortRef.current = new AbortController();
    setLoading(true);
    let content = "";
    let thinking = "";
    let thinkingDone = false;
    let chartConfig: ChartConfig | undefined;
    let isTimeout = false;
    let requestPhase = "initializing";

    const targetId = assistantId ?? nextId++;

    const debug = (phase: string, detail?: unknown) => {
      requestPhase = phase;
      console.log(`[chat] ${phase}`, detail ?? "");
    };

    debug("starting request", { text: text.slice(0, 100), history, targetId });

    const timeoutId = setTimeout(() => {
      isTimeout = true;
      debug("timeout fired — aborting");
      abortRef.current?.abort();
    }, 800_000);

    if (assistantId !== null) {
      const branchId = nextBranchId++;
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
      const msg: AssistantMessageData = {
        id: targetId,
        role: "assistant",
        branches: [
          {
            branchId: nextBranchId++,
            content: "",
            thinking: "",
            thinkingDone: false,
          },
        ],
        currentBranch: 0,
      };
      setMessages((prev) => [...prev, msg]);
    }

    try {
      debug("fetching /api/chat");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          client_id: selectedClient!.id,
          message: text,
          history,
          stream: true,
        }),
        signal: abortRef.current.signal,
      });

      debug("response received", { status: res.status, ok: res.ok });
      if (!res.ok) throw new Error(`Request failed (HTTP ${res.status})`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader — response body missing");
      debug("stream reader obtained");

      const decoder = new TextDecoder();
      let buffer = "";
      let chunkCount = 0;

      while (true) {
        debug("waiting for stream chunk");
        const { done, value } = await reader.read();
        if (done) {
          debug("stream done", {
            totalChunks: chunkCount,
            finalContentLength: content.length,
          });
          break;
        }
        chunkCount++;
        debug("chunk received", {
          chunkSize: value?.byteLength ?? 0,
          chunkCount,
        });

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") {
            debug("received [DONE] signal");
            continue;
          }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.thinking) {
              thinking += parsed.thinking;
            }
            if (parsed.content) {
              thinkingDone = true;
              content += parsed.content;
            }
            if (parsed.chart_config) {
              chartConfig = parsed.chart_config;
            }
            if (parsed.thinking || parsed.content || parsed.chart_config) {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== targetId || !isAssistant(m)) return m;
                  const branches = m.branches.map((b, i) =>
                    i === m.branches.length - 1
                      ? {
                          branchId: b.branchId,
                          content,
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
          } catch (parseErr) {
            debug("parse error on SSE line", { line, error: parseErr });
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        debug("request aborted", { isTimeout });
        if (isTimeout) {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== targetId || !isAssistant(m)) return m;
              const branches = m.branches.map((b, i) =>
                i === m.branches.length - 1
                  ? {
                      branchId: b.branchId,
                      content:
                        "La respuesta está tardando demasiado. Intenta de nuevo.",
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
        return;
      }
      debug("request error", {
        error: err instanceof Error ? err.message : String(err),
        phase: requestPhase,
      });
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== targetId || !isAssistant(m)) return m;
          const branches = m.branches.map((b, i) =>
            i === m.branches.length - 1
              ? {
                  branchId: b.branchId,
                  content:
                    "Ocurrió un error al obtener respuesta. Intenta de nuevo.",
                  thinking,
                  thinkingDone,
                  chartConfig,
                }
              : b,
          );
          return { ...m, branches };
        }),
      );
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      abortRef.current = null;
      debug("done", { phase: requestPhase });
    }
  }

  async function handleSubmit(text: string) {
    if (!text.trim() || loading || !selectedClient) return;

    const userMsg: MessageData = { id: nextId++, role: "user", content: text };
    const history = buildHistory(messages, messages.length - 1);
    setMessages((prev) => [...prev, userMsg]);

    await sendMessage(text, null, history);
  }

  async function handleRetry(assistantId: number) {
    if (loading || !selectedClient) return;

    const idx = messages.findIndex((m) => m.id === assistantId);
    if (idx < 1) return;

    const userMsg = messages[idx - 1];
    if (!userMsg || userMsg.role !== "user") return;

    const history = buildHistory(messages, idx - 1);
    await sendMessage(userMsg.content, assistantId, history);
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

  const handleSelectConversation = useCallback((id: number) => {
    setActiveConversationId(id);
    setMessages(
      MOCK_MESSAGES[id] ? [...MOCK_MESSAGES[id]] : createWelcomeMessages(),
    );
  }, []);

  function handleNewConversation() {
    const id = nextConvId.current++;
    const conv = createEmptyConversation(id, "Nueva conversación");
    setConversations((prev) => [conv, ...prev]);
    setActiveConversationId(id);
    setMessages(createWelcomeMessages());
  }

  function handleDeleteConversation(id: number) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      const next = remaining[0];
      if (next) {
        handleSelectConversation(next.id);
      } else {
        setActiveConversationId(null);
        setMessages(createWelcomeMessages());
      }
    }
  }

  function handleRenameConversation(id: number, title: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c)),
    );
  }

  const sidebarEl = (
    <ConversationList
      conversations={conversations}
      activeId={activeConversationId}
      onSelect={handleSelectConversation}
      onNew={handleNewConversation}
      onDelete={handleDeleteConversation}
      onRename={handleRenameConversation}
    />
  );

  const chatPanel = (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="flex items-center h-9 px-2 border-border border-b">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="size-4" />
          ) : (
            <PanelLeft className="size-4" />
          )}
        </button>
        {activeConversationId && (
          <span className="ml-2 text-xs text-muted-foreground truncate">
            {conversations.find((c) => c.id === activeConversationId)?.title}
          </span>
        )}
      </div>

      <Conversation>
        <ScrollContent>
          {messages.map((msg, idx) => {
            const isLatest = idx === messages.length - 1;
            const hoverClass = !isLatest
              ? "opacity-0 group-hover:opacity-100 transition-opacity"
              : "";
            return msg.role === "user" ? (
              <Message key={msg.id} from="user">
                <MessageContent>{msg.content}</MessageContent>
                <MessageActions className={hoverClass}>
                  <MessageAction
                    label="Copiar"
                    onClick={() => navigator.clipboard.writeText(msg.content)}
                  >
                    <CopyIcon className="size-3" />
                  </MessageAction>
                </MessageActions>
              </Message>
            ) : (
              <Message key={msg.id} from="assistant">
                <MessageContent>
                  <MessageBranch
                    key={`${msg.id}-${msg.branches.length}`}
                    defaultBranch={msg.currentBranch}
                    onBranchChange={(i) => handleBranchChange(msg.id, i)}
                  >
                    <MessageBranchContent>
                      {msg.branches.map((branch) => (
                        <span key={branch.branchId}>
                          {branch.thinking && (
                            <Reasoning
                              className="w-full"
                              isStreaming={loading && !branch.thinkingDone}
                              defaultOpen={false}
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>
                                {branch.thinking}
                              </ReasoningContent>
                            </Reasoning>
                          )}
                          {branch.content ? (
                            <>
                              <MessageResponse>
                                {branch.content}
                              </MessageResponse>
                              {branch.chartConfig && (
                                <ChartRenderer config={branch.chartConfig} />
                              )}
                            </>
                          ) : branch.thinking ? null : loading ? (
                            <span className="inline-flex pl-0.5">
                              <svg
                                className="animate-pulse-scale text-muted-foreground"
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                aria-label="Generando respuesta"
                              >
                                <circle
                                  cx="5"
                                  cy="5"
                                  r="4"
                                  fill="currentColor"
                                />
                              </svg>
                            </span>
                          ) : null}
                        </span>
                      ))}
                    </MessageBranchContent>
                    <div className="flex items-center">
                      <MessageBranchSelector>
                        <MessageBranchPrevious />
                        <MessageBranchPage />
                        <MessageBranchNext />
                      </MessageBranchSelector>
                      <MessageActions className={hoverClass}>
                        <MessageAction
                          label="Reintentar"
                          onClick={() => handleRetry(msg.id)}
                        >
                          <RefreshCw className="size-3" />
                        </MessageAction>
                        <MessageAction
                          label="Copiar"
                          onClick={() =>
                            navigator.clipboard.writeText(
                              msg.branches[msg.currentBranch]?.content ?? "",
                            )
                          }
                        >
                          <CopyIcon className="size-3" />
                        </MessageAction>
                      </MessageActions>
                    </div>
                  </MessageBranch>
                </MessageContent>
              </Message>
            );
          })}
        </ScrollContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-3xl px-2 pb-2">
        <PromptInput
          onSubmit={async (message) => {
            await handleSubmit(message.text);
          }}
        >
          <PromptInputTextarea placeholder="Escribe tu pregunta sobre finanzas..." />
          <PromptInputSubmit
            status={loading ? "streaming" : undefined}
            onStop={handleStop}
          />
        </PromptInput>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 h-0 overflow-hidden">
      {isMobile ? (
        <div
          className="flex h-full transition-transform duration-200 ease-in-out"
          style={{ transform: `translateX(${sidebarOpen ? "0" : "-18rem"})` }}
        >
          <div className="flex w-72 shrink-0 h-full">{sidebarEl}</div>
          <div className="flex w-screen shrink-0 h-full">{chatPanel}</div>
        </div>
      ) : (
        <div className="flex h-full w-full">
          {sidebarOpen && <div className="flex h-full">{sidebarEl}</div>}
          <div className="flex flex-1 min-w-0 h-full">{chatPanel}</div>
        </div>
      )}
    </div>
  );
}
