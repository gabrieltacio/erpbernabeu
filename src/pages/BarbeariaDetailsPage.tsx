
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Phone, Clock, DollarSign, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  description: string | null;
  price: number;
  duration: number | null;
  type: string;
}

export function BarbeariaDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: barbearia, isLoading: isLoadingBarbearia } = useQuery({
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

  const { data: services = [] } = useQuery({
    queryKey: ['barbearia-services', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, price, duration, type')
        .or(`barbearia_id.eq.${id},barbearia_id.is.null`)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data as Service[];
    },
    enabled: !!id
  });

  const handleBack = () => {
    navigate('/');
  };

  const handleSchedule = () => {
    navigate(`/barbearia/${id}/agendar`);
  };

  if (isLoadingBarbearia) {
    return (
      <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!barbearia) {
    return (
      <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Barbearia não encontrada</h2>
          <Button onClick={handleBack}>Voltar</Button>
        </div>
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
                <h1 className="text-2xl font-bold text-slate-900">{barbearia.nome}</h1>
                <div className="flex items-center text-slate-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{barbearia.cidade}, {barbearia.estado}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Informações da Barbearia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              {barbearia.telefone ? (
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {barbearia.telefone}
                </p>
              ) : (
                <p className="text-slate-500">Telefone não informado</p>
              )}
            </CardContent>
          </Card>

          {/* Serviços */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Serviços Oferecidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.length === 0 ? (
                  <p className="text-slate-500">Nenhum serviço cadastrado</p>
                ) : (
                  services.map((service) => (
                    <div key={service.id} className="flex justify-between items-start p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{service.name}</h4>
                          <Badge variant={service.type === 'servico' ? 'default' : 'secondary'}>
                            {service.type === 'servico' ? 'Serviço' : 'Produto'}
                          </Badge>
                        </div>
                        {service.description && (
                          <p className="text-sm text-slate-600 mb-2">{service.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            R$ {service.price.toFixed(2)}
                          </span>
                          {service.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {service.duration} min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profissionais */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Nossos Profissionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {professionals.length === 0 ? (
              <p className="text-slate-500">Nenhum profissional cadastrado</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {professionals.map((professional) => (
                  <div key={professional.id} className="text-center p-4 bg-slate-50 rounded-lg">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarImage src={professional.avatar_url || ''} alt={professional.name} />
                      <AvatarFallback className="bg-slate-900 text-white text-xl">
                        {professional.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg mb-2">{professional.name}</h3>
                    {professional.specialties && professional.specialties.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-slate-600 mb-2">Especialidades:</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {professional.specialties.map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button 
                      onClick={() => handleSchedule()}
                      className="w-full"
                    >
                      Agendar com {professional.name.split(' ')[0]}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
