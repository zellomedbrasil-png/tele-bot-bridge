import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  assistantName?: string;
}

export function TypingIndicator({ assistantName = 'Carol' }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="chat-bubble-bot px-4 py-3 shadow-soft">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-warning" />
          <span className="text-sm text-foreground">{assistantName} está digitando</span>
          <div className="typing-indicator flex gap-1 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
          </div>
        </div>
      </div>
    </div>
  );
}
