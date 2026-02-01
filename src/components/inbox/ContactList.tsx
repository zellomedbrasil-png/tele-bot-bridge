import { useState } from 'react';
import { Search, Filter, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Contact, ContactTag } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContactListProps {
  contacts: Contact[];
  selectedContactId: string | null;
  onSelectContact: (contact: Contact) => void;
}

const tagConfig: Record<ContactTag, { label: string; className: string }> = {
  triagem: { label: 'Triagem', className: 'bg-info/10 text-info border-info/20' },
  agendado: { label: 'Agendado', className: 'bg-success/10 text-success border-success/20' },
  urgente: { label: 'Urgente', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  pos_consulta: { label: 'Pós-consulta', className: 'bg-accent text-accent-foreground border-accent' },
  aguardando: { label: 'Aguardando', className: 'bg-warning/10 text-warning-foreground border-warning/20' },
};

export function ContactList({ contacts, selectedContactId, onSelectContact }: ContactListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredContacts = contacts
    .filter(contact => {
      const matchesSearch = 
        contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone_number?.includes(searchQuery);
      
      if (filter === 'unread') return matchesSearch && contact.unread_count > 0;
      if (filter === 'ai') return matchesSearch && contact.ai_enabled;
      return matchesSearch;
    })
    .sort((a, b) => {
      const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return dateB - dateA;
    });

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Conversas</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>

        {/* Filters */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="w-full bg-secondary/50">
            <TabsTrigger value="all" className="flex-1 text-xs">Todos</TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 text-xs">Não Lidos</TabsTrigger>
            <TabsTrigger value="ai" className="flex-1 text-xs">IA Ativa</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Contact List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
                "hover:bg-secondary/50",
                selectedContactId === contact.id && "bg-secondary"
              )}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {contact.profile_pic ? (
                  <img 
                    src={contact.profile_pic} 
                    alt={contact.name || 'Contato'} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                {contact.ai_enabled && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[10px] text-primary-foreground font-bold">IA</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground truncate">
                    {contact.name || contact.phone_number || 'Contato'}
                  </span>
                  {contact.last_message_at && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(contact.last_message_at), { 
                        addSuffix: false, 
                        locale: ptBR 
                      })}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between gap-2 mt-1">
                  <div className="flex gap-1 flex-wrap">
                    {contact.tags.slice(0, 2).map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className={cn("text-[10px] px-1.5 py-0", tagConfig[tag]?.className)}
                      >
                        {tagConfig[tag]?.label || tag}
                      </Badge>
                    ))}
                  </div>
                  {contact.unread_count > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                      {contact.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}

          {filteredContacts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum contato encontrado</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
