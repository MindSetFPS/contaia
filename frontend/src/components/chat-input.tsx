import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";

type ChatInputProps = {
  loading: boolean;
  onStop: () => void;
  onSubmit: (text: string) => void;
};

export default function ChatInput({
  loading,
  onStop,
  onSubmit,
}: ChatInputProps) {
  return (
    <PromptInput
      onSubmit={async (message) => {
        await onSubmit(message.text);
      }}
    >
      <PromptInputTextarea placeholder="Escribe tu pregunta..." />
      <PromptInputSubmit
        status={loading ? "streaming" : undefined}
        onStop={onStop}
      />
    </PromptInput>
  );
}
