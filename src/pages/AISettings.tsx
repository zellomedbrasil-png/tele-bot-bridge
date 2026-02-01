import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Bot, Save, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import type { Prompt } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const tones = [
  { value: 'empático', label: 'Empático' },
  { value: 'profissional', label: 'Profissional' },
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
];

export default function AISettings() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [assistantName, setAssistantName] = useState('Carol');
  const [tone, setTone] = useState('empático');
  const [responseDelay, setResponseDelay] = useState(3);

  useEffect(() => {
    const fetchPrompts = async () => {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching prompts:', error);
        toast.error('Erro ao carregar configurações');
        return;
      }

      setPrompts((data || []) as Prompt[]);
      
      // Select active prompt by default
      const activePrompt = data?.find(p => p.is_active);
      if (activePrompt) {
        selectPrompt(activePrompt as Prompt);
      }
      
      setIsLoading(false);
    };

    fetchPrompts();
  }, []);

  const selectPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setTitle(prompt.title);
    setContent(prompt.content);
    setAssistantName(prompt.assistant_name);
    setTone(prompt.tone || 'empático');
    setResponseDelay(prompt.response_delay || 3);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSaving(true);

    const promptData = {
      title,
      content,
      assistant_name: assistantName,
      tone,
      response_delay: responseDelay,
    };

    if (selectedPrompt) {
      // Update existing
      const { error } = await supabase
        .from('prompts')
        .update(promptData)
        .eq('id', selectedPrompt.id);

      if (error) {
        toast.error('Erro ao salvar configuração');
        setIsSaving(false);
        return;
      }

      setPrompts(prev => prev.map(p => 
        p.id === selectedPrompt.id ? { ...p, ...promptData } : p
      ));
      toast.success('Configuração salva');
    } else {
      // Create new
      const { data, error } = await supabase
        .from('prompts')
        .insert(promptData)
        .select()
        .single();

      if (error) {
        toast.error('Erro ao criar configuração');
        setIsSaving(false);
        return;
      }

      setPrompts(prev => [data as Prompt, ...prev]);
      setSelectedPrompt(data as Prompt);
      toast.success('Configuração criada');
    }

    setIsSaving(false);
  };

  const handleSetActive = async (promptId: string) => {
    // Deactivate all others
    await supabase
      .from('prompts')
      .update({ is_active: false })
      .neq('id', promptId);

    // Activate selected
    await supabase
      .from('prompts')
      .update({ is_active: true })
      .eq('id', promptId);

    setPrompts(prev => prev.map(p => ({
      ...p,
      is_active: p.id === promptId
    })));

    toast.success('Configuração ativada');
  };

  const handleDelete = async (promptId: string) => {
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', promptId);

    if (error) {
      toast.error('Erro ao excluir configuração');
      return;
    }

    setPrompts(prev => prev.filter(p => p.id !== promptId));
    
    if (selectedPrompt?.id === promptId) {
      setSelectedPrompt(null);
      setTitle('');
      setContent('');
      setAssistantName('Carol');
      setTone('empático');
      setResponseDelay(3);
    }

    toast.success('Configuração excluída');
  };

  const handleNew = () => {
    setSelectedPrompt(null);
    setTitle('');
    setContent('');
    setAssistantName('Carol');
    setTone('empático');
    setResponseDelay(3);
  };

  return (
    <MainLayout>
      <div className="flex h-full">
        {/* Prompts List */}
        <div className="w-80 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-foreground">Configurações</h2>
              <Button size="sm" variant="outline" onClick={handleNew} className="gap-1">
                <Plus className="w-3.5 h-3.5" />
                Nova
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Gerencie as personas da IA</p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : prompts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhuma configuração</p>
                </div>
              ) : (
                prompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => selectPrompt(prompt)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      "hover:bg-secondary/50",
                      selectedPrompt?.id === prompt.id && "bg-secondary"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground text-sm">{prompt.title}</span>
                      {prompt.is_active && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                          Ativa
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {prompt.assistant_name} • {prompt.tone}
                    </p>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Editor */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {selectedPrompt ? 'Editar Configuração' : 'Nova Configuração'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Configure o comportamento da atendente virtual
                </p>
              </div>
            </div>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Título da Configuração</Label>
                  <Input
                    placeholder="Ex: Triagem Padrão"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Atendente</Label>
                    <Input
                      placeholder="Ex: Carol"
                      value={assistantName}
                      onChange={(e) => setAssistantName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tom de Voz</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tones.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Delay de Resposta</Label>
                    <span className="text-sm text-muted-foreground">{responseDelay}s</span>
                  </div>
                  <Slider
                    value={[responseDelay]}
                    onValueChange={([value]) => setResponseDelay(value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo de espera antes de enviar a resposta (simula digitação)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">System Prompt</CardTitle>
                <CardDescription>
                  Defina as instruções e personalidade da IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Você é uma atendente virtual empática e profissional..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar
              </Button>

              {selectedPrompt && !selectedPrompt.is_active && (
                <Button 
                  variant="outline" 
                  onClick={() => handleSetActive(selectedPrompt.id)}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  Ativar
                </Button>
              )}

              {selectedPrompt && (
                <Button 
                  variant="outline" 
                  onClick={() => handleDelete(selectedPrompt.id)}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
