import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BarbeariaSetupFormProps {
  onSuccess?: () => void;
}

export function BarbeariaSetupForm({ onSuccess }: BarbeariaSetupFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    nome: '',
    cidade: '',
    estado: '',
    telefone: '',
    logo_url: '',
  });

  const createBarbeariaMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data: barbearia, error } = await supabase
        .from('barbearias')
        .insert({
          nome: data.nome,
          cidade: data.cidade,
          estado: data.estado,
          telefone: data.telefone || null,
          logo_url: data.logo_url || null,
          criada_por: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar o perfil do usuário com a barbearia criada
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          barbearia_id: barbearia.id,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      return barbearia;
    },
    onSuccess: () => {
      toast({
        title: 'Barbearia criada!',
        description: 'Sua barbearia foi criada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar barbearia',
        description: 'Não foi possível criar a barbearia. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error creating barbearia:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.cidade || !formData.estado) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    createBarbeariaMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
            <Scissors className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Configure sua Barbearia</CardTitle>
          <p className="text-slate-600">
            Para começar a usar o sistema, você precisa configurar os dados da sua barbearia.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="nome">Nome da Barbearia *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Ex: Barbearia do João"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleChange('cidade', e.target.value)}
                  placeholder="Ex: São Paulo"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="estado">Estado *</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => handleChange('estado', e.target.value)}
                  placeholder="Ex: SP"
                  maxLength={2}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                placeholder="https://exemplo.com/logo.png"
                type="url"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-600 mt-0.5" />
                <div className="text-sm text-slate-600">
                  <p className="font-medium mb-1">Informação importante:</p>
                  <p>
                    Após criar sua barbearia, ela ficará visível na página pública do sistema 
                    para que clientes possam encontrá-la e fazer agendamentos online.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={createBarbeariaMutation.isPending}
            >
              {createBarbeariaMutation.isPending ? 'Criando...' : 'Criar Barbearia'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}