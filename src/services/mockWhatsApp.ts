// Mock WhatsApp Service - Simulates Evolution API behavior
import { supabase } from '@/integrations/supabase/client';
import type { Message, Contact } from '@/types';

// Simulate incoming message from a patient
export async function simulateIncomingMessage(contactId: string, content: string): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      contact_id: contactId,
      content,
      sender_type: 'contact',
      is_draft: false,
      status: 'received'
    })
    .select()
    .single();

  if (error) {
    console.error('Error simulating incoming message:', error);
    return null;
  }

  // Get current unread count and increment
  const { data: contactData } = await supabase
    .from('contacts')
    .select('unread_count')
    .eq('id', contactId)
    .single();

  // Update contact's last_message_at and unread_count
  await supabase
    .from('contacts')
    .update({
      last_message_at: new Date().toISOString(),
      unread_count: (contactData?.unread_count || 0) + 1
    })
    .eq('id', contactId);

  return data as Message;
}

// Send message as user (human operator)
export async function sendMessage(contactId: string, content: string): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      contact_id: contactId,
      content,
      sender_type: 'user',
      is_draft: false,
      status: 'sent'
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return null;
  }

  // Update contact's last_message_at
  await supabase
    .from('contacts')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', contactId);

  return data as Message;
}

// Create AI draft message (suggestion)
export async function createAIDraft(contactId: string, content: string): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      contact_id: contactId,
      content,
      sender_type: 'bot',
      is_draft: true,
      status: 'draft'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating AI draft:', error);
    return null;
  }

  return data as Message;
}

// Approve and send AI draft
export async function approveAIDraft(messageId: string): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .update({
      is_draft: false,
      status: 'sent'
    })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error('Error approving AI draft:', error);
    return null;
  }

  return data as Message;
}

// Delete AI draft (reject suggestion)
export async function rejectAIDraft(messageId: string): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.error('Error rejecting AI draft:', error);
    return false;
  }

  return true;
}

// Generate QR Code for WhatsApp connection (mock)
export function generateQRCode(): string {
  // In real implementation, this would call Evolution API
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=zello-chat-${Date.now()}`;
}

// Simulate AI typing delay
export function simulateTypingDelay(delaySeconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
}

// Mock AI response generator
export async function generateAIResponse(contactId: string, patientMessage: string): Promise<string> {
  // In real implementation, this would call OpenAI API
  const responses = [
    "Olá! Sou a Carol, atendente virtual da clínica. Como posso ajudar você hoje?",
    "Entendi sua situação. Para que eu possa ajudar melhor, pode me informar há quanto tempo está sentindo esses sintomas?",
    "Obrigada pelas informações! Vou verificar os horários disponíveis para sua consulta. Você tem preferência por manhã ou tarde?",
    "Perfeito! Encontrei disponibilidade para amanhã às 14h com a Dra. Ana. Confirmo o agendamento?",
    "Agendamento confirmado! Você receberá o link da videochamada por aqui 30 minutos antes da consulta. Posso ajudar em mais alguma coisa?"
  ];

  // Simulate some intelligence based on message content
  if (patientMessage.toLowerCase().includes('dor')) {
    return "Sinto muito que esteja passando por isso. Pode me descrever melhor onde sente essa dor e sua intensidade de 1 a 10?";
  }
  if (patientMessage.toLowerCase().includes('urgente') || patientMessage.toLowerCase().includes('emergência')) {
    return "Entendo a urgência da sua situação. Vou priorizar seu atendimento. Enquanto isso, está em um local seguro? Precisa de orientação imediata?";
  }
  if (patientMessage.toLowerCase().includes('horário') || patientMessage.toLowerCase().includes('agendar')) {
    return "Claro! Temos disponibilidade para hoje às 16h, amanhã às 9h ou 14h. Qual horário funciona melhor para você?";
  }

  return responses[Math.floor(Math.random() * responses.length)];
}
