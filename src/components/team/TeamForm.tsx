
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'admin' | 'recepcionista' | 'profissional';
  specialties: string[] | null;
  active: boolean;
}

interface TeamFormProps {
  member?: TeamMember | null;
  onClose: () => void;
}

export function TeamForm({ member, onClose }: TeamFormProps) {
  const [formData, setFormData] = useState({
    name: member?.name || '',
    email: member?.email || '',
    phone: member?.phone || '',
    role: member?.role || 'profissional' as const,
    specialties: member?.specialties?.join(', ') || '',
    active: member?.active ?? true,
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const submitData = {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        role: data.role,
        specialties: data.specialties.split(',').map(s => s.trim()).filter(s => s.length > 0),
        active: data.active,
      };

      if (member) {
        const { error } = await supabase
          .from('profiles')
          .update(submitData)
          .eq('id', member.id);
        if (error) throw error;
      } else {
        // Para novos membros, precisaríamos criar um usuário no auth também
        // Por enquanto, apenas atualizamos perfis existentes
        toast({
          title: 'Funcionalidade limitada',
          description: 'Criação de novos membros ainda não implementada. Use apenas para editar membros existentes.',
          variant: 'destructive',
        });
        return;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: 'Membro atualizado',
        description: 'Membro da equipe atualizado com sucesso.',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o membro.',
        variant: 'destructive',
      });
      console.error('Error saving team member:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, informe o nome e e-mail.',
        variant: 'destructive',
      });
      return;
    }

    mutation.mutate(formData);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Nome completo"
          required
        />
      </div>

      <div>
        <Label htmlFor="email">E-mail *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="email@exemplo.com"
          required
        />
      </div>

      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="(11) 99999-9999"
        />
      </div>

      <div>
        <Label htmlFor="role">Função *</Label>
        <select
          id="role"
          value={formData.role}
          onChange={(e) => handleChange('role', e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          required
        >
          <option value="profissional">Profissional</option>
          <option value="recepcionista">Recepcionista</option>
          <option value="admin">Administrador</option>
        </select>
      </div>

      <div>
        <Label htmlFor="specialties">Especialidades</Label>
        <Input
          id="specialties"
          value={formData.specialties}
          onChange={(e) => handleChange('specialties', e.target.value)}
          placeholder="Corte, Barba, Coloração (separar por vírgula)"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => handleChange('active', checked as boolean)}
        />
        <Label htmlFor="active">Ativo</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando...' : (member ? 'Atualizar' : 'Criar')}
        </Button>
      </div>
    </form>
  );
}
