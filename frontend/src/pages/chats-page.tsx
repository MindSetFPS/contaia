import { useState, useRef } from "react";
import { useClient } from "@/contexts/client-context";
import { useAuth } from "@/contexts/auth-context";
import type { ChartConfig } from "@/types";
import ChartRenderer from "@/components/chart-renderer";
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
import { CopyIcon, RefreshCw } from "lucide-react";

let nextId = 0;
let nextBranchId = 0;

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
      <div ref={contentRef} className="flex flex-col gap-8 p-4">
        {children}
      </div>
    </div>
  );
}

export default function ChatsPage() {
  const { selectedClient } = useClient();
  const { token } = useAuth();
  const [messages, setMessages] = useState<AnyMessage[]>([
    {
      id: nextId++,
      role: "assistant",
      branches: [
        {
          branchId: nextBranchId++,
          content:
            "¡Hola! Soy tu asistente financiero. Pregúntame sobre ingresos, gastos, utilidad o ventas de tu cliente.",
          thinking: "",
          thinkingDone: true,
        },
      ],
      currentBranch: 0,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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

  return (
    <div className="flex flex-1 flex-col h-0">
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
                          ) : (
                            <span className="inline-flex">
                              <span className="animate-pulse">▊</span>
                            </span>
                          )}
                        </span>
                      ))}
                    </MessageBranchContent>
                    <MessageBranchSelector>
                      <MessageBranchPrevious />
                      <MessageBranchPage />
                      <MessageBranchNext />
                    </MessageBranchSelector>
                  </MessageBranch>
                </MessageContent>
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
              </Message>
            );
          })}
        </ScrollContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="p-2 sm:p-3">
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
}
