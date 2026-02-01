import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, UserCheck, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import type { Contact, Message } from '@/types';

interface ChatAreaProps {
  contact: Contact | null;
  messages: Message[];
  isAITyping: boolean;
  onSendMessage: (content: string) => void;
  onApproveAI: (messageId: string) => void;
  onEditAI: (messageId: string, content: string) => void;
  onTakeOver: () => void;
}

export function ChatArea({ 
  contact, 
  messages, 
  isAITyping,
  onSendMessage, 
  onApproveAI, 
  onEditAI,
  onTakeOver 
}: ChatAreaProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAITyping]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!contact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary/20">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
            <Bot className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">ZelloChat</h3>
          <p className="text-muted-foreground">Selecione uma conversa para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-secondary/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            {contact.profile_pic ? (
              <img 
                src={contact.profile_pic} 
                alt={contact.name || 'Contato'} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-medium text-muted-foreground">
                {(contact.name || 'C')[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              {contact.name || contact.phone_number || 'Contato'}
            </h3>
            <div className="flex items-center gap-2">
              {contact.ai_enabled && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                  <Bot className="w-3 h-3 mr-1" />
                  IA Ativa
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onTakeOver}
          className={cn(
            "gap-2",
            !contact.ai_enabled && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <UserCheck className="w-4 h-4" />
          {contact.ai_enabled ? 'Assumir Conversa' : 'Conversa Assumida'}
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3 max-w-3xl mx-auto">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onApprove={onApproveAI}
              onEdit={onEditAI}
            />
          ))}
          {isAITyping && <TypingIndicator />}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 bg-card border-t border-border">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Paperclip className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Smile className="w-5 h-5" />
          </Button>
          <Textarea
            ref={textareaRef}
            placeholder="Digite uma mensagem..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[44px] max-h-32 resize-none bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            rows={1}
          />
          <Button 
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="h-11 px-4 bg-primary hover:bg-primary/90"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
