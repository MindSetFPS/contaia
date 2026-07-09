import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2, Edit3, Check, X } from "lucide-react";
import type { Conversation } from "@/types";

type Props = {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
  onRename: (id: number, title: string) => void;
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr.replace(" ", "T") + "Z");
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

function ConversationRow({
  conv,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: {
  conv: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(conv.title);

  function handleSave() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== conv.title) {
      onRename(trimmed);
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditValue(conv.title);
      setEditing(false);
    }
  }

  return (
    <div
      data-active={isActive || undefined}
      className="group relative flex cursor-pointer items-start gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted data-[active]:bg-muted"
      onClick={() => {
        if (!editing) onSelect();
      }}
    >
      <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex h-6 w-full rounded border border-input bg-background px-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <Check className="size-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditValue(conv.title);
                setEditing(false);
              }}
              className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : (
          <p className="truncate font-medium">{conv.title}</p>
        )}
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {formatDate(conv.last_message_at)}
        </p>
      </div>
      <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditValue(conv.title);
            setEditing(true);
          }}
          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Edit3 className="size-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="size-3" />
        </button>
      </div>
    </div>
  );
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
}: Props) {
  return (
    <aside className="flex h-full w-72 flex-col border-border border-r bg-sidebar text-sidebar-foreground">
      <div className="border-border px-3 py-3">
        <Button
          className="w-full gap-1.5 justify-start bg-white/0 hover:bg-gray-200 text-black shadow-none"
          onClick={onNew}>
          <Plus className="size-4" />
          Nueva conversación
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No hay conversaciones aún.
            <br />
            Crea una nueva para empezar.
          </p>
        ) : (
          conversations.map((conv) => (
            <ConversationRow
              key={conv.id}
              conv={conv}
              isActive={conv.id === activeId}
              onSelect={() => onSelect(conv.id)}
              onDelete={() => onDelete(conv.id)}
              onRename={(title) => onRename(conv.id, title)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
