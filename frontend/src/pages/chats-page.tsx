import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useClient } from "@/contexts/client-context";
import { useAuth } from "@/contexts/auth-context";
import ConversationList from "@/components/conversation-list";
import ChatMessage from "@/components/chat-message";
import ChatEmptyState from "@/components/chat-empty-state";
import ChatInput from "@/components/chat-input";
import {
  Conversation as Conv,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { useChat } from "@/hooks/use-chat";

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

export default function ChatsPage() {
  const { selectedClient } = useClient();
  const { token } = useAuth();
  const { conversationId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= 768,
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const {
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
  } = useChat(selectedClient, token, conversationId);

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

      {messages.length === 0 ? (
        <ChatEmptyState
          clientName={selectedClient?.name ?? ""}
          loading={loading}
          onStop={handleStop}
          onSubmit={handleSubmit}
        />
      ) : (
        <>
          <Conv>
            <ScrollContent>
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isLast={idx === messages.length - 1}
                  loading={loading}
                  onRetry={handleRetry}
                  onBranchChange={handleBranchChange}
                />
              ))}
            </ScrollContent>
            <ConversationScrollButton />
          </Conv>

          <div className="mx-auto w-full max-w-3xl px-2 pb-2">
            <ChatInput
              loading={loading}
              onStop={handleStop}
              onSubmit={handleSubmit}
            />
          </div>
        </>
      )}
    </div>
  );

  if (!selectedClient) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Selecciona un cliente para empezar a chatear.
      </div>
    );
  }

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
