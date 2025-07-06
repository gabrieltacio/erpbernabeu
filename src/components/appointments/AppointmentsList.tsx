
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Calendar, Clock, User, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppointmentForm } from './AppointmentForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type AppointmentStatus = Database['public']['Enums']['appointment_status'];

interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: AppointmentStatus;
  notes: string | null;
  clients: {
    name: string;
  };
  profiles: {
    name: string;
  };
  services: {
    name: string;
    duration: number;
  };
}

const statusMap: Record<AppointmentStatus, { label: string; color: string }> = {
  agendado: { label: 'Agendado', color: 'bg-blue-100 text-blue-800' },
  confirmado: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' },
  concluido: { label: 'Concluído', color: 'bg-gray-100 text-gray-800' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export function AppointmentsList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients(name),
          profiles(name),
          services(name, duration)
        `)
        .order('scheduled_date', { ascending: false })
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Status atualizado',
        description: 'Status do agendamento foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
      console.error('Error updating appointment status:', error);
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleNewAppointment = () => {
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Agendamentos
            </span>
            <Button onClick={handleNewAppointment}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando agendamentos...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Nenhum agendamento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(new Date(appointment.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {appointment.scheduled_time}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {appointment.clients.name}
                        </div>
                      </TableCell>
                      <TableCell>{appointment.profiles.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{appointment.services.name}</div>
                            <div className="text-sm text-gray-500">{appointment.services.duration}min</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusMap[appointment.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {statusMap[appointment.status]?.label || appointment.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <select
                          value={appointment.status}
                          onChange={(e) => updateStatusMutation.mutate({ 
                            id: appointment.id, 
                            status: e.target.value as AppointmentStatus
                          })}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="agendado">Agendado</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="em_andamento">Em Andamento</option>
                          <option value="concluido">Concluído</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <AppointmentForm onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
