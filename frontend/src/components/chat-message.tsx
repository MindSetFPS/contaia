import type { ChartConfig } from "@/types";
import ChartRenderer from "@/components/chart-renderer";
import {
  Message as Msg,
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
import { CopyIcon, RefreshCw } from "lucide-react";

export type Branch = {
  branchId: number;
  content: string;
  thinking: string;
  thinkingDone: boolean;
  chartConfig?: ChartConfig;
};

export type MessageData = {
  id: number;
  role: "user";
  content: string;
};

export type AssistantMessageData = {
  id: number;
  role: "assistant";
  branches: Branch[];
  currentBranch: number;
};

export type AnyMessage = MessageData | AssistantMessageData;

export function isAssistant(m: AnyMessage): m is AssistantMessageData {
  return m.role === "assistant";
}

type ChatMessageProps = {
  message: AnyMessage;
  isLast: boolean;
  loading: boolean;
  onRetry: (id: number) => void;
  onBranchChange: (msgId: number, branchIdx: number) => void;
};

export default function ChatMessage({
  message: msg,
  isLast,
  loading,
  onRetry,
  onBranchChange,
}: ChatMessageProps) {
  const hoverClass = !isLast
    ? "opacity-0 group-hover:opacity-100 transition-opacity"
    : "";

  if (msg.role === "user") {
    return (
      <Msg key={msg.id} from="user">
        <MessageContent>{msg.content}</MessageContent>
        <MessageActions className={hoverClass}>
          <MessageAction
            label="Copiar"
            onClick={() => navigator.clipboard.writeText(msg.content)}
          >
            <CopyIcon className="size-3" />
          </MessageAction>
        </MessageActions>
      </Msg>
    );
  }

  return (
    <Msg key={msg.id} from="assistant">
      <MessageContent>
        <MessageBranch
          key={`${msg.id}-${msg.branches.length}`}
          defaultBranch={msg.currentBranch}
          onBranchChange={(i) => onBranchChange(msg.id, i)}
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
                    <ReasoningContent>{branch.thinking}</ReasoningContent>
                  </Reasoning>
                )}
                {branch.content ? (
                  <>
                    <MessageResponse>{branch.content}</MessageResponse>
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
                      <circle cx="5" cy="5" r="4" fill="currentColor" />
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
              <MessageAction label="Reintentar" onClick={() => onRetry(msg.id)}>
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
    </Msg>
  );
}
