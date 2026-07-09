import ChatInput from "@/components/chat-input";

type ChatEmptyStateProps = {
  clientName: string;
  loading: boolean;
  onStop: () => void;
  onSubmit: (text: string) => void;
};

export default function ChatEmptyState({
  clientName,
  loading,
  onStop,
  onSubmit,
}: ChatEmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col justify-center items-center">
      <p className="mx-auto text-2xl font-bold mb-4 text-center">
        ¿Que consulta tienes sobre {clientName}?
      </p>
      <div className="mx-auto w-full max-w-3xl px-2 mt-2 pb-16">
        <ChatInput loading={loading} onStop={onStop} onSubmit={onSubmit} />
      </div>
    </div>
  );
}
