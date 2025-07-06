import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, User, Phone, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BarbeariaDetails {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  telefone: string | null;
  logo_url: string | null;
}

interface Professional {
  id: string;
  name: string;
  avatar_url: string | null;
  specialties: string[] | null;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number | null;
}

export function PublicSchedulePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    professional_id: '',
    service_id: '',
    scheduled_date: '',
    scheduled_time: '',
    notes: '',
  });

  // Buscar dados da barbearia
  const { data: barbearia } = useQuery({
    queryKey: ['barbearia-details', id],
    queryFn: async () => {
      if (!id) throw new Error('ID da barbearia não fornecido');
      
      const { data, error } = await supabase
        .from('barbearias')
        .select('id, nome, cidade, estado, telefone, logo_url')
        .eq('id', id)
        .eq('ativa', true)
        .single();

      if (error) throw error;
      return data as BarbeariaDetails;
    },
    enabled: !!id
  });

  // Buscar profissionais da barbearia
  const { data: professionals = [] } = useQuery({
    queryKey: ['barbearia-professionals', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, specialties')
        .eq('barbearia_id', id)
        .eq('active', true);

      if (error) throw error;
      return data as Professional[];
    },
    enabled: !!id
  });

  // Buscar serviços
  const { data: services = [] } = useQuery({
    queryKey: ['services-for-public-schedule', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price, duration')
        .or(`barbearia_id.eq.${id},barbearia_id.is.null`)
        .eq('type', 'servico')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data as Service[];
    },
    enabled: !!id
  });

  // Criar agendamento
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: typeof formData) => {
      // Primeiro, criar ou buscar o cliente
      let clientId;
      
      // Verificar se cliente já existe pelo telefone
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', appointmentData.client_phone)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Criar novo cliente
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: appointmentData.client_name,
            phone: appointmentData.client_phone,
          })
          .select('id')
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      // Criar o agendamento
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          client_id: clientId,
          professional_id: appointmentData.professional_id,
          service_id: appointmentData.service_id,
          scheduled_date: appointmentData.scheduled_date,
          scheduled_time: appointmentData.scheduled_time,
          notes: appointmentData.notes,
          status: 'agendado',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Agendamento realizado!',
        description: 'Seu horário foi agendado com sucesso. Entraremos em contato para confirmação.',
      });
      navigate(`/barbearia/${id}`);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao agendar',
        description: 'Não foi possível realizar o agendamento. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error creating appointment:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name || !formData.client_phone || !formData.professional_id || 
        !formData.service_id || !formData.scheduled_date || !formData.scheduled_time) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    createAppointmentMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBack = () => {
    navigate(`/barbearia/${id}`);
  };

  const selectedProfessional = professionals.find(p => p.id === formData.professional_id);
  const selectedService = services.find(s => s.id === formData.service_id);

  if (!barbearia) {
    return (
      <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF5]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={barbearia.logo_url || ''} alt={barbearia.nome} />
                <AvatarFallback className="bg-slate-900 text-white">
                  {barbearia.nome.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Agendar Horário</h1>
                <p className="text-slate-600">{barbearia.nome}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Dados do Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados do Cliente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Seus Dados
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_name">Nome Completo *</Label>
                    <Input
                      id="client_name"
                      value={formData.client_name}
                      onChange={(e) => handleChange('client_name', e.target.value)}
                      placeholder="Digite seu nome completo"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="client_phone">Telefone *</Label>
                    <Input
                      id="client_phone"
                      value={formData.client_phone}
                      onChange={(e) => handleChange('client_phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Profissional */}
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

              {/* Serviço */}
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
                      {service.name} - {service.duration}min - R$ {service.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled_date">Data *</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => handleChange('scheduled_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
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

              {/* Observações */}
              <div>
                <Label htmlFor="notes">Observações</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Alguma observação especial?"
                  className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>

              {/* Resumo */}
              {selectedProfessional && selectedService && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Resumo do Agendamento:</h3>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                    <p><strong>Profissional:</strong> {selectedProfessional.name}</p>
                    <p><strong>Serviço:</strong> {selectedService.name}</p>
                    <p><strong>Valor:</strong> R$ {selectedService.price.toFixed(2)}</p>
                    {selectedService.duration && (
                      <p><strong>Duração:</strong> {selectedService.duration} minutos</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={handleBack}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAppointmentMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Scissors className="w-4 h-4" />
                  {createAppointmentMutation.isPending ? 'Agendando...' : 'Confirmar Agendamento'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}