
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Barbearia {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  telefone: string | null;
  logo_url: string | null;
}

export function PublicHomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const { data: barbearias = [], isLoading } = useQuery({
    queryKey: ['barbearias-publicas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barbearias')
        .select('id, nome, cidade, estado, telefone, logo_url')
        .eq('ativa', true)
        .order('nome');

      if (error) throw error;
      return data as Barbearia[];
    }
  });

  const filteredBarbearias = barbearias.filter(barbearia =>
    barbearia.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    barbearia.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBarbeariaClick = (id: string) => {
    navigate(`/barbearia/${id}`);
  };

  const handleLoginClick = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAF5] to-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Bernabeu Barber</h1>
            </div>
            <Button onClick={handleLoginClick} variant="outline">
              Área do Profissional
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Encontre a melhor barbearia para você
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Descubra barbearias próximas e agende seu horário com os melhores profissionais
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto mb-12">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar barbearia pelo nome ou cidade"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-3 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
              <p className="mt-4 text-slate-600">Carregando barbearias...</p>
            </div>
          ) : filteredBarbearias.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg">
                {searchTerm ? 'Nenhuma barbearia encontrada para sua busca.' : 'Nenhuma barbearia cadastrada no momento.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBarbearias.map((barbearia) => (
                <Card
                  key={barbearia.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer transform hover:scale-105 transition-transform"
                  onClick={() => handleBarbeariaClick(barbearia.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={barbearia.logo_url || ''} alt={barbearia.nome} />
                        <AvatarFallback className="bg-slate-900 text-white text-xl">
                          {barbearia.nome.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-900">{barbearia.nome}</h3>
                        <div className="flex items-center text-slate-600 mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{barbearia.cidade}, {barbearia.estado}</span>
                        </div>
                        {barbearia.telefone && (
                          <div className="flex items-center text-slate-600 mt-1">
                            <Phone className="w-4 h-4 mr-1" />
                            <span>{barbearia.telefone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 Bernabeu Barber. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
