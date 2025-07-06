
import { AppointmentsList } from '@/components/appointments/AppointmentsList';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function AppointmentsPage() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const confirmPaymentMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.functions.invoke('confirm-payment', {
        body: { sessionId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Pagamento confirmado!',
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro no pagamento',
        description: 'Não foi possível confirmar o pagamento.',
        variant: 'destructive',
      });
      console.error('Payment confirmation error:', error);
    },
  });

  useEffect(() => {
    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (payment === 'success' && sessionId) {
      confirmPaymentMutation.mutate(sessionId);
    } else if (payment === 'cancelled') {
      toast({
        title: 'Pagamento cancelado',
        description: 'O agendamento não foi confirmado.',
        variant: 'destructive',
      });
    }
  }, [searchParams]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
        <p className="text-gray-600">Gerencie todos os agendamentos da barbearia</p>
      </div>
      <AppointmentsList />
    </div>
  );
}
