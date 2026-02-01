import { Check, CheckCheck, Bot, Edit, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Message } from '@/types';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  onApprove?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
}

export function MessageBubble({ message, onApprove, onEdit }: MessageBubbleProps) {
  const isUser = message.sender_type === 'user';
  const isContact = message.sender_type === 'contact';
  const isBot = message.sender_type === 'bot';
  const isDraft = message.is_draft;

  return (
    <div className={cn(
      "flex w-full animate-fade-in",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[75%] px-4 py-2.5 shadow-soft",
        isUser && "chat-bubble-user",
        isContact && "chat-bubble-contact",
        isBot && "chat-bubble-bot"
      )}>
        {/* Bot label */}
        {isBot && (
          <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-[hsl(var(--chat-bot-border))]/30">
            <Bot className="w-3.5 h-3.5 text-warning" />
            <span className="text-xs font-medium text-warning-foreground">
              {isDraft ? 'Sugestão da IA' : 'Carol (IA)'}
            </span>
          </div>
        )}

        {/* Message content */}
        <p className={cn(
          "text-sm leading-relaxed whitespace-pre-wrap",
          isUser && "text-primary-foreground"
        )}>
          {message.content}
        </p>

        {/* Footer */}
        <div className={cn(
          "flex items-center gap-2 mt-1.5",
          isUser ? "justify-end" : "justify-between"
        )}>
          <span className={cn(
            "text-[10px]",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {format(new Date(message.created_at), 'HH:mm')}
          </span>

          {/* Status icon for user messages */}
          {isUser && (
            <span className="text-primary-foreground/70">
              {message.status === 'sent' ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
            </span>
          )}
        </div>

        {/* Draft actions */}
        {isBot && isDraft && (
          <div className="flex gap-2 mt-3 pt-2 border-t border-[hsl(var(--chat-bot-border))]/30">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onEdit?.(message.id, message.content)}
              className="flex-1 h-8 text-xs bg-transparent border-[hsl(var(--chat-bot-border))] hover:bg-warning/10"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Editar
            </Button>
            <Button 
              size="sm" 
              onClick={() => onApprove?.(message.id)}
              className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Aprovar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
