import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ContactList } from '@/components/inbox/ContactList';
import { ChatArea } from '@/components/inbox/ChatArea';
import { PatientContext } from '@/components/inbox/PatientContext';
import { supabase } from '@/integrations/supabase/client';
import { sendMessage, approveAIDraft, generateAIResponse, createAIDraft, simulateTypingDelay } from '@/services/mockWhatsApp';
import type { Contact, Message, ContactTag } from '@/types';
import { toast } from 'sonner';

export default function Inbox() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAITyping, setIsAITyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching contacts:', error);
        toast.error('Erro ao carregar contatos');
        return;
      }

      // Transform data to match our types
      const transformedContacts: Contact[] = (data || []).map(c => ({
        ...c,
        tags: (c.tags || []) as ContactTag[]
      }));

      setContacts(transformedContacts);
      setIsLoading(false);
    };

    fetchContacts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('contacts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updatedContact = {
            ...payload.new,
            tags: (payload.new.tags || []) as ContactTag[]
          } as Contact;
          setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
          if (selectedContact?.id === updatedContact.id) {
            setSelectedContact(updatedContact);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedContact?.id]);

  // Fetch messages when contact is selected
  useEffect(() => {
    if (!selectedContact) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', selectedContact.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages((data || []) as Message[]);

      // Clear unread count
      if (selectedContact.unread_count > 0) {
        await supabase
          .from('contacts')
          .update({ unread_count: 0 })
          .eq('id', selectedContact.id);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${selectedContact.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `contact_id=eq.${selectedContact.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'messages',
        filter: `contact_id=eq.${selectedContact.id}`
      }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new as Message : m));
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'messages',
        filter: `contact_id=eq.${selectedContact.id}`
      }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedContact?.id]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedContact) return;

    // Send user message
    await sendMessage(selectedContact.id, content);

    // If AI is enabled, generate response after a delay
    if (selectedContact.ai_enabled) {
      setIsAITyping(true);
      
      // Simulate typing delay (3 seconds)
      await simulateTypingDelay(3);
      
      // Generate AI response
      const aiResponse = await generateAIResponse(selectedContact.id, content);
      
      // Create draft message
      await createAIDraft(selectedContact.id, aiResponse);
      
      setIsAITyping(false);
    }
  };

  const handleApproveAI = async (messageId: string) => {
    await approveAIDraft(messageId);
    toast.success('Mensagem enviada');
  };

  const handleEditAI = (messageId: string, content: string) => {
    // For now, just show a toast - in a real app, this would open an edit modal
    toast.info('Funcionalidade de edição em desenvolvimento');
  };

  const handleTakeOver = async () => {
    if (!selectedContact) return;

    const newAIStatus = !selectedContact.ai_enabled;
    
    const { error } = await supabase
      .from('contacts')
      .update({ ai_enabled: !selectedContact.ai_enabled })
      .eq('id', selectedContact.id);

    if (error) {
      toast.error('Erro ao atualizar status da IA');
      return;
    }

    toast.success(newAIStatus ? 'IA ativada' : 'Conversa assumida');
  };

  const handleUpdateContact = async (updates: Partial<Contact>) => {
    if (!selectedContact) return;

    const { error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', selectedContact.id);

    if (error) {
      toast.error('Erro ao atualizar contato');
      return;
    }
  };

  return (
    <MainLayout>
      <div className="flex h-full">
        <div className="w-80 flex-shrink-0">
          <ContactList
            contacts={contacts}
            selectedContactId={selectedContact?.id || null}
            onSelectContact={handleSelectContact}
          />
        </div>
        <ChatArea
          contact={selectedContact}
          messages={messages}
          isAITyping={isAITyping}
          onSendMessage={handleSendMessage}
          onApproveAI={handleApproveAI}
          onEditAI={handleEditAI}
          onTakeOver={handleTakeOver}
        />
        <PatientContext
          contact={selectedContact}
          onUpdateContact={handleUpdateContact}
        />
      </div>
    </MainLayout>
  );
}
