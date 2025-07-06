
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  Clock, 
  Bell, 
  Shield, 
  CreditCard,
  Database,
  Palette
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AdvancedSettings() {
  const { toast } = useToast();
  const [businessName, setBusinessName] = useState('Bernabeu Barber');
  const [businessDescription, setBusinessDescription] = useState('');
  
  const [workingHours, setWorkingHours] = useState({
    monday: { open: '08:00', close: '18:00', enabled: true },
    tuesday: { open: '08:00', close: '18:00', enabled: true },
    wednesday: { open: '08:00', close: '18:00', enabled: true },
    thursday: { open: '08:00', close: '18:00', enabled: true },
    friday: { open: '08:00', close: '18:00', enabled: true },
    saturday: { open: '08:00', close: '16:00', enabled: true },
    sunday: { open: '08:00', close: '14:00', enabled: false },
  });

  const [notifications, setNotifications] = useState({
    whatsapp: true,
    email: false,
    reminderTime: 60, // minutos antes
  });

  const [paymentMethods, setPaymentMethods] = useState({
    dinheiro: true,
    cartao_debito: true,
    cartao_credito: true,
    pix: true,
    transferencia: false,
  });

  const handleSaveBusinessInfo = () => {
    toast({
      title: 'Configurações salvas',
      description: 'Informações da empresa foram atualizadas.',
    });
  };

  const handleSaveWorkingHours = () => {
    toast({
      title: 'Horários atualizados',
      description: 'Horários de funcionamento foram salvos.',
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: 'Notificações configuradas',
      description: 'Preferências de notificação foram salvas.',
    });
  };

  const handleSavePayments = () => {
    toast({
      title: 'Formas de pagamento',
      description: 'Métodos de pagamento foram atualizados.',
    });
  };

  const handleBackup = () => {
    toast({
      title: 'Backup iniciado',
      description: 'O backup dos dados foi iniciado. Você receberá uma notificação quando estiver pronto.',
    });
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      toast({
        title: 'Dados limpos',
        description: 'Todos os dados foram removidos do sistema.',
        variant: 'destructive',
      });
    }
  };

  const dayNames = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };

  const paymentMethodNames = {
    dinheiro: 'Dinheiro',
    cartao_debito: 'Cartão de Débito',
    cartao_credito: 'Cartão de Crédito',
    pix: 'PIX',
    transferencia: 'Transferência',
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Pagamento
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Dados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName">Nome da Barbearia</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="bg-white border border-gray-300"
                />
              </div>
              
              <div>
                <Label htmlFor="businessDescription">Descrição</Label>
                <Textarea
                  id="businessDescription"
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="Descreva sua barbearia..."
                  className="bg-white border border-gray-300"
                />
              </div>

              <Button onClick={handleSaveBusinessInfo}>
                Salvar Informações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Horários de Funcionamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(workingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={hours.enabled}
                      onCheckedChange={(checked) =>
                        setWorkingHours(prev => ({
                          ...prev,
                          [day]: { ...prev[day as keyof typeof prev], enabled: checked }
                        }))
                      }
                    />
                    <span className="font-medium w-32">
                      {dayNames[day as keyof typeof dayNames]}
                    </span>
                  </div>
                  
                  {hours.enabled && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) =>
                          setWorkingHours(prev => ({
                            ...prev,
                            [day]: { ...prev[day as keyof typeof prev], open: e.target.value }
                          }))
                        }
                        className="w-24 bg-white border border-gray-300"
                      />
                      <span>às</span>
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) =>
                          setWorkingHours(prev => ({
                            ...prev,
                            [day]: { ...prev[day as keyof typeof prev], close: e.target.value }
                          }))
                        }
                        className="w-24 bg-white border border-gray-300"
                      />
                    </div>
                  )}
                </div>
              ))}

              <Button onClick={handleSaveWorkingHours}>
                Salvar Horários
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificações via WhatsApp</Label>
                  <p className="text-sm text-gray-500">Enviar lembretes por WhatsApp</p>
                </div>
                <Switch
                  checked={notifications.whatsapp}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, whatsapp: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificações por E-mail</Label>
                  <p className="text-sm text-gray-500">Enviar lembretes por e-mail</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, email: checked }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="reminderTime">Tempo de Lembrete (minutos antes)</Label>
                <Input
                  id="reminderTime"
                  type="number"
                  value={notifications.reminderTime}
                  onChange={(e) =>
                    setNotifications(prev => ({ ...prev, reminderTime: parseInt(e.target.value) }))
                  }
                  className="bg-white border border-gray-300"
                />
              </div>

              <Button onClick={handleSaveNotifications}>
                Salvar Notificações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Formas de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(paymentMethods).map(([method, enabled]) => (
                <div key={method} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                  <Label>{paymentMethodNames[method as keyof typeof paymentMethodNames]}</Label>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      setPaymentMethods(prev => ({ ...prev, [method]: checked }))
                    }
                  />
                </div>
              ))}

              <Button onClick={handleSavePayments}>
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-white">
                <h4 className="font-medium mb-2">Permissões por Perfil</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Admin:</strong> Acesso completo ao sistema</p>
                  <p><strong>Recepcionista:</strong> Agendamentos, clientes, vendas</p>
                  <p><strong>Profissional:</strong> Seus agendamentos e vendas</p>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-white">
                <h4 className="font-medium mb-2">Sessão</h4>
                <p className="text-sm text-gray-600 mb-4">
                  As sessões expiram automaticamente após 24 horas de inatividade.
                </p>
                <Button variant="outline">
                  Configurar Tempo de Sessão
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-white">
                <h4 className="font-medium mb-2">Backup dos Dados</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Faça backup de todos os dados do sistema para segurança.
                </p>
                <Button onClick={handleBackup}>
                  Fazer Backup
                </Button>
              </div>

              <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                <h4 className="font-medium mb-2 text-red-800">Zona de Perigo</h4>
                <p className="text-sm text-red-600 mb-4">
                  Cuidado: Esta ação removerá todos os dados do sistema permanentemente.
                </p>
                <Button variant="destructive" onClick={handleReset}>
                  Limpar Todos os Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
