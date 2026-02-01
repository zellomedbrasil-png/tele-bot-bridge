import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Search, Calendar, User, MessageSquare, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import type { Contact, ContactTag } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const tagConfig: Record<ContactTag, { label: string; className: string }> = {
  triagem: { label: 'Triagem', className: 'bg-info/10 text-info border-info/20' },
  agendado: { label: 'Agendado', className: 'bg-success/10 text-success border-success/20' },
  urgente: { label: 'Urgente', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  pos_consulta: { label: 'Pós-consulta', className: 'bg-accent text-accent-foreground border-accent' },
  aguardando: { label: 'Aguardando', className: 'bg-warning/10 text-warning-foreground border-warning/20' },
};

export default function History() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching contacts:', error);
        return;
      }

      const transformedContacts: Contact[] = (data || []).map(c => ({
        ...c,
        tags: (c.tags || []) as ContactTag[]
      }));

      setContacts(transformedContacts);
      setIsLoading(false);
    };

    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone_number?.includes(searchQuery)
  );

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-1">Histórico</h1>
          <p className="text-muted-foreground">Visualize todas as conversas anteriores</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 max-w-md"
          />
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">Nenhuma conversa encontrada</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery ? 'Tente uma busca diferente' : 'As conversas aparecerão aqui'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="space-y-3">
              {filteredContacts.map((contact) => (
                <Card key={contact.id} className="shadow-soft hover:shadow-card transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        {contact.profile_pic ? (
                          <img 
                            src={contact.profile_pic} 
                            alt={contact.name || 'Contato'} 
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-medium text-foreground">
                            {contact.name || contact.phone_number || 'Contato'}
                          </h3>
                          {contact.last_message_at && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(contact.last_message_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mt-0.5">
                          {contact.phone_number || contact.remote_jid}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          {contact.tags.map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className={cn("text-[10px] px-1.5 py-0", tagConfig[tag]?.className)}
                            >
                              {tagConfig[tag]?.label || tag}
                            </Badge>
                          ))}
                          {contact.ai_enabled && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                              IA Ativa
                            </Badge>
                          )}
                        </div>

                        {contact.medical_history && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                            📋 {contact.medical_history}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </MainLayout>
  );
}
