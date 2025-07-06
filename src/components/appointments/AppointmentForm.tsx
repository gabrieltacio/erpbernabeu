
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Calendar, Clock, User, Scissors } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AppointmentFormProps {
  onClose: () => void;
}

export function AppointmentForm({ onClose }: AppointmentFormProps) {
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [formData, setFormData] = useState({
    client_id: '',
    professional_id: '',
    service_id: '',
    scheduled_date: '',
    scheduled_time: '',
    notes: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar clientes
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-appointment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Buscar profissionais
  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Buscar serviços
  const { data: services = [] } = useQuery({
    queryKey: ['services-for-appointment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, duration, price')
        .eq('type', 'servico')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Criar sessão de pagamento
  const paymentMutation = useMutation({
    mutationFn: async (appointmentData: typeof formData) => {
      const selectedClient = clients.find(c => c.id === appointmentData.client_id);
      const selectedProfessional = professionals.find(p => p.id === appointmentData.professional_id);
      const selectedService = services.find(s => s.id === appointmentData.service_id);

      if (!selectedClient || !selectedProfessional || !selectedService) {
        throw new Error('Dados incompletos');
      }

      const { data, error } = await supabase.functions.invoke('create-payment-session', {
        body: {
          appointmentData,
          clientData: selectedClient,
          serviceData: selectedService,
          professionalData: selectedProfessional,
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Redirecionar para o Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error) => {
      toast({
        title: 'Erro ao processar pagamento',
        description: 'Não foi possível iniciar o processo de pagamento.',
        variant: 'destructive',
      });
      console.error('Error creating payment session:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.professional_id || !formData.service_id || 
        !formData.scheduled_date || !formData.scheduled_time) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (step === 'form') {
      setStep('payment');
    } else {
      paymentMutation.mutate(formData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedClient = clients.find(c => c.id === formData.client_id);
  const selectedProfessional = professionals.find(p => p.id === formData.professional_id);
  const selectedService = services.find(s => s.id === formData.service_id);

  if (step === 'payment') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Resumo do Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span><strong>Cliente:</strong> {selectedClient?.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Scissors className="h-4 w-4 text-muted-foreground" />
              <span><strong>Profissional:</strong> {selectedProfessional?.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Scissors className="h-4 w-4 text-muted-foreground" />
              <span><strong>Serviço:</strong> {selectedService?.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span><strong>Data:</strong> {new Date(formData.scheduled_date).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span><strong>Horário:</strong> {formData.scheduled_time}</span>
            </div>
            {formData.notes && (
              <div className="flex items-start gap-3">
                <span><strong>Observações:</strong> {formData.notes}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Valor Total:</span>
              <span>R$ {selectedService?.price?.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setStep('form')}>
            Voltar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={paymentMutation.isPending}
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            {paymentMutation.isPending ? 'Processando...' : 'Pagar e Confirmar'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="client_id">Cliente *</Label>
        <select
          id="client_id"
          value={formData.client_id}
          onChange={(e) => handleChange('client_id', e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          required
        >
          <option value="">Selecione um cliente</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="professional_id">Profissional *</Label>
        <select
          id="professional_id"
          value={formData.professional_id}
          onChange={(e) => handleChange('professional_id', e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          required
        >
          <option value="">Selecione um profissional</option>
          {professionals.map((professional) => (
            <option key={professional.id} value={professional.id}>
              {professional.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="service_id">Serviço *</Label>
        <select
          id="service_id"
          value={formData.service_id}
          onChange={(e) => handleChange('service_id', e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          required
        >
          <option value="">Selecione um serviço</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} - {service.duration}min - R$ {service.price}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="scheduled_date">Data *</Label>
          <Input
            id="scheduled_date"
            type="date"
            value={formData.scheduled_date}
            onChange={(e) => handleChange('scheduled_date', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="scheduled_time">Hora *</Label>
          <Input
            id="scheduled_time"
            type="time"
            value={formData.scheduled_time}
            onChange={(e) => handleChange('scheduled_time', e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Anotações sobre o agendamento..."
          className="w-full min-h-[60px] px-3 py-2 border border-input rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          Continuar para Pagamento
        </Button>
      </div>
    </form>
  );
}
