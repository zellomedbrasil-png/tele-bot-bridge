export type SenderType = 'user' | 'contact' | 'bot';
export type InstanceStatus = 'connected' | 'disconnected' | 'connecting';
export type ContactTag = 'triagem' | 'agendado' | 'urgente' | 'pos_consulta' | 'aguardando';

export interface Instance {
  id: string;
  name: string;
  phone_number: string | null;
  status: InstanceStatus;
  server_url: string | null;
  apikey: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  instance_id: string | null;
  remote_jid: string;
  name: string | null;
  phone_number: string | null;
  profile_pic: string | null;
  tags: ContactTag[];
  ai_enabled: boolean;
  persona: string | null;
  medical_history: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  contact_id: string;
  content: string;
  sender_type: SenderType;
  is_draft: boolean;
  status: string | null;
  created_at: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  assistant_name: string;
  tone: string | null;
  response_delay: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
