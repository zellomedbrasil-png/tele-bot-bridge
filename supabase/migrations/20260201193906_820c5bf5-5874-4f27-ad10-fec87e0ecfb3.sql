-- Create enum for message sender types
CREATE TYPE public.sender_type AS ENUM ('user', 'contact', 'bot');

-- Create enum for instance status
CREATE TYPE public.instance_status AS ENUM ('connected', 'disconnected', 'connecting');

-- Create enum for contact tags
CREATE TYPE public.contact_tag AS ENUM ('triagem', 'agendado', 'urgente', 'pos_consulta', 'aguardando');

-- Create instances table (WhatsApp connections)
CREATE TABLE public.instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone_number TEXT,
  status instance_status NOT NULL DEFAULT 'disconnected',
  server_url TEXT,
  apikey TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID REFERENCES public.instances(id) ON DELETE CASCADE,
  remote_jid TEXT NOT NULL,
  name TEXT,
  phone_number TEXT,
  profile_pic TEXT,
  tags contact_tag[] DEFAULT '{}',
  ai_enabled BOOLEAN NOT NULL DEFAULT true,
  persona TEXT DEFAULT 'triagem',
  medical_history TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  sender_type sender_type NOT NULL,
  is_draft BOOLEAN NOT NULL DEFAULT false,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prompts table (AI configurations)
CREATE TABLE public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  assistant_name TEXT NOT NULL DEFAULT 'Carol',
  tone TEXT DEFAULT 'empático',
  response_delay INTEGER DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (we'll add proper auth later)
CREATE POLICY "Allow all operations on instances" ON public.instances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on contacts" ON public.contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on prompts" ON public.prompts FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_instances_updated_at
  BEFORE UPDATE ON public.instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default prompt
INSERT INTO public.prompts (title, content, assistant_name, tone, is_active)
VALUES (
  'Triagem Padrão',
  'Você é Carol, uma atendente virtual empática e profissional da clínica de telemedicina. Sua função é fazer a triagem inicial dos pacientes, coletando informações sobre sintomas, urgência e preferências de horário. Seja acolhedora, use linguagem simples e sempre confirme as informações recebidas.',
  'Carol',
  'empático',
  true
);

-- Insert some sample data for testing
INSERT INTO public.instances (name, phone_number, status)
VALUES 
  ('Atendimento Principal', '+55 11 99999-0001', 'connected'),
  ('Emergência', '+55 11 99999-0002', 'connected'),
  ('Pós-Consulta', '+55 11 99999-0003', 'disconnected');

INSERT INTO public.contacts (instance_id, remote_jid, name, phone_number, tags, last_message_at, unread_count, medical_history)
VALUES 
  ((SELECT id FROM public.instances LIMIT 1), '5511988887777@s.whatsapp.net', 'Maria Silva', '+55 11 98888-7777', ARRAY['triagem']::contact_tag[], now() - interval '5 minutes', 2, 'Hipertensão controlada. Última consulta: 15/01/2026'),
  ((SELECT id FROM public.instances LIMIT 1), '5511977776666@s.whatsapp.net', 'João Santos', '+55 11 97777-6666', ARRAY['urgente']::contact_tag[], now() - interval '15 minutes', 0, 'Diabético tipo 2'),
  ((SELECT id FROM public.instances LIMIT 1), '5511966665555@s.whatsapp.net', 'Ana Oliveira', '+55 11 96666-5555', ARRAY['agendado']::contact_tag[], now() - interval '1 hour', 1, NULL);