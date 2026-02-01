import { useState } from 'react';
import { User, FileText, Bot, Link, Video, CreditCard, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Contact } from '@/types';
import { toast } from 'sonner';

interface PatientContextProps {
  contact: Contact | null;
  onUpdateContact: (updates: Partial<Contact>) => void;
}

const personas = [
  { value: 'triagem', label: 'Triagem' },
  { value: 'pos_consulta', label: 'Pós-consulta' },
  { value: 'agendamento', label: 'Agendamento' },
  { value: 'emergencia', label: 'Emergência' },
];

export function PatientContext({ contact, onUpdateContact }: PatientContextProps) {
  const [medicalHistory, setMedicalHistory] = useState(contact?.medical_history || '');

  if (!contact) {
    return (
      <div className="w-80 border-l border-border bg-card p-4 flex items-center justify-center">
        <p className="text-muted-foreground text-sm text-center">
          Selecione um contato para ver os detalhes
        </p>
      </div>
    );
  }

  const handleSaveMedicalHistory = () => {
    onUpdateContact({ medical_history: medicalHistory });
    toast.success('Histórico médico atualizado');
  };

  const handleToggleAI = (enabled: boolean) => {
    onUpdateContact({ ai_enabled: enabled });
    toast.success(enabled ? 'IA ativada para este chat' : 'IA desativada para este chat');
  };

  const handlePersonaChange = (persona: string) => {
    onUpdateContact({ persona });
    toast.success(`Persona alterada para: ${personas.find(p => p.value === persona)?.label}`);
  };

  const handleSendPaymentLink = () => {
    toast.info('Enviando link de pagamento...');
  };

  const handleSendVideoLink = () => {
    toast.info('Enviando link da videochamada...');
  };

  return (
    <ScrollArea className="w-80 border-l border-border bg-card">
      <div className="p-4 space-y-4">
        {/* Patient Info */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Dados do Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <p className="font-medium text-foreground">{contact.name || 'Não informado'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Telefone</Label>
              <p className="font-medium text-foreground">{contact.phone_number || contact.remote_jid}</p>
            </div>
          </CardContent>
        </Card>

        {/* Medical History */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Histórico Médico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Adicione observações sobre o paciente..."
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              className="min-h-[100px] text-sm bg-secondary/30 border-0 focus-visible:ring-1 focus-visible:ring-primary resize-none"
            />
            <Button 
              size="sm" 
              onClick={handleSaveMedicalHistory}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </CardContent>
        </Card>

        {/* AI Control */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              Controle da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">IA Ativa</Label>
                <p className="text-xs text-muted-foreground">Respostas automáticas</p>
              </div>
              <Switch
                checked={contact.ai_enabled}
                onCheckedChange={handleToggleAI}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium">Persona</Label>
              <Select 
                value={contact.persona || 'triagem'} 
                onValueChange={handlePersonaChange}
                disabled={!contact.ai_enabled}
              >
                <SelectTrigger className="bg-secondary/30 border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {personas.map((persona) => (
                    <SelectItem key={persona.value} value={persona.value}>
                      {persona.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Link className="w-4 h-4 text-primary" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2"
              onClick={handleSendPaymentLink}
            >
              <CreditCard className="w-4 h-4 text-primary" />
              Enviar Link de Pagamento
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2"
              onClick={handleSendVideoLink}
            >
              <Video className="w-4 h-4 text-primary" />
              Enviar Link da Videochamada
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
