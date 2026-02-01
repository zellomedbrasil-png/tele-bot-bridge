import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Plus, RefreshCw, Trash2, Wifi, WifiOff, Loader2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { generateQRCode } from '@/services/mockWhatsApp';
import type { Instance, InstanceStatus } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusConfig: Record<InstanceStatus, { label: string; icon: React.ElementType; className: string }> = {
  connected: { label: 'Conectado', icon: Wifi, className: 'bg-success/10 text-success border-success/20' },
  disconnected: { label: 'Desconectado', icon: WifiOff, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  connecting: { label: 'Conectando...', icon: Loader2, className: 'bg-warning/10 text-warning border-warning/20' },
};

export default function Connections() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newConnectionOpen, setNewConnectionOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstances = async () => {
      const { data, error } = await supabase
        .from('instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching instances:', error);
        toast.error('Erro ao carregar conexões');
        return;
      }

      setInstances((data || []) as Instance[]);
      setIsLoading(false);
    };

    fetchInstances();
  }, []);

  const handleCreateConnection = async () => {
    if (!newInstanceName.trim()) {
      toast.error('Digite um nome para a conexão');
      return;
    }

    // Generate QR code
    const qr = generateQRCode();
    setQrCode(qr);

    // Create instance in database
    const { data, error } = await supabase
      .from('instances')
      .insert({
        name: newInstanceName,
        status: 'connecting'
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao criar conexão');
      return;
    }

    setInstances(prev => [data as Instance, ...prev]);

    // Simulate connection after 5 seconds
    setTimeout(async () => {
      await supabase
        .from('instances')
        .update({ status: 'connected', phone_number: '+55 11 99999-' + Math.floor(1000 + Math.random() * 9000) })
        .eq('id', data.id);

      setInstances(prev => prev.map(i => 
        i.id === data.id 
          ? { ...i, status: 'connected' as InstanceStatus, phone_number: '+55 11 99999-' + Math.floor(1000 + Math.random() * 9000) }
          : i
      ));

      toast.success('Conexão estabelecida!');
      setNewConnectionOpen(false);
      setQrCode(null);
      setNewInstanceName('');
    }, 5000);
  };

  const handleRestart = async (instanceId: string) => {
    await supabase
      .from('instances')
      .update({ status: 'connecting' })
      .eq('id', instanceId);

    setInstances(prev => prev.map(i => 
      i.id === instanceId ? { ...i, status: 'connecting' as InstanceStatus } : i
    ));

    toast.info('Reiniciando instância...');

    setTimeout(async () => {
      await supabase
        .from('instances')
        .update({ status: 'connected' })
        .eq('id', instanceId);

      setInstances(prev => prev.map(i => 
        i.id === instanceId ? { ...i, status: 'connected' as InstanceStatus } : i
      ));

      toast.success('Instância reconectada!');
    }, 3000);
  };

  const handleDisconnect = async (instanceId: string) => {
    await supabase
      .from('instances')
      .update({ status: 'disconnected' })
      .eq('id', instanceId);

    setInstances(prev => prev.map(i => 
      i.id === instanceId ? { ...i, status: 'disconnected' as InstanceStatus } : i
    ));

    toast.success('Instância desconectada');
  };

  const handleDelete = async (instanceId: string) => {
    const { error } = await supabase
      .from('instances')
      .delete()
      .eq('id', instanceId);

    if (error) {
      toast.error('Erro ao excluir instância');
      return;
    }

    setInstances(prev => prev.filter(i => i.id !== instanceId));
    toast.success('Instância excluída');
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Conexões</h1>
            <p className="text-muted-foreground">Gerencie suas instâncias do WhatsApp</p>
          </div>

          <Dialog open={newConnectionOpen} onOpenChange={setNewConnectionOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Conexão
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Conexão WhatsApp</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {!qrCode ? (
                  <>
                    <div className="space-y-2">
                      <Label>Nome da Instância</Label>
                      <Input
                        placeholder="Ex: Atendimento Principal"
                        value={newInstanceName}
                        onChange={(e) => setNewInstanceName(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleCreateConnection} className="w-full">
                      Gerar QR Code
                    </Button>
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="bg-card p-4 rounded-lg inline-block">
                      <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Escaneie o QR Code com o WhatsApp para conectar
                    </p>
                    <div className="flex items-center justify-center gap-2 text-warning">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Aguardando conexão...</span>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Instances Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : instances.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <QrCode className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">Nenhuma conexão</h3>
              <p className="text-muted-foreground text-sm mb-4">Adicione sua primeira instância do WhatsApp</p>
              <Button onClick={() => setNewConnectionOpen(true)} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Conexão
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instances.map((instance) => {
              const statusInfo = statusConfig[instance.status];
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={instance.id} className="shadow-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-medium">{instance.name}</CardTitle>
                      <Badge variant="outline" className={cn("gap-1", statusInfo.className)}>
                        <StatusIcon className={cn("w-3 h-3", instance.status === 'connecting' && "animate-spin")} />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Número</p>
                      <p className="font-medium text-foreground">
                        {instance.phone_number || 'Não conectado'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => handleRestart(instance.id)}
                        disabled={instance.status === 'connecting'}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reiniciar
                      </Button>
                      {instance.status === 'connected' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => handleDisconnect(instance.id)}
                        >
                          <WifiOff className="w-3.5 h-3.5" />
                          Desconectar
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(instance.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Excluir
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
