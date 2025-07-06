
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Download } from 'lucide-react';

interface ReportFiltersProps {
  onFiltersChange: (filters: { dateFrom: string; dateTo: string; professionalId: string }) => void;
}

export function ReportFilters({ onFiltersChange }: ReportFiltersProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [professionalId, setProfessionalId] = useState('all');

  const { data: professionals } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('active', true)
        .order('name');
      return data || [];
    }
  });

  const applyFilters = () => {
    const finalProfessionalId = professionalId === 'all' ? '' : professionalId;
    onFiltersChange({ dateFrom, dateTo, professionalId: finalProfessionalId });
  };

  const setQuickDate = (days: number) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    
    const fromDate = pastDate.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];
    
    setDateFrom(fromDate);
    setDateTo(toDate);
    const finalProfessionalId = professionalId === 'all' ? '' : professionalId;
    onFiltersChange({ dateFrom: fromDate, dateTo: toDate, professionalId: finalProfessionalId });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="dateFrom">Data Inicial</Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-white border border-gray-300"
          />
        </div>

        <div>
          <Label htmlFor="dateTo">Data Final</Label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-white border border-gray-300"
          />
        </div>

        <div>
          <Label htmlFor="professional">Profissional</Label>
          <Select value={professionalId} onValueChange={setProfessionalId}>
            <SelectTrigger className="bg-white border border-gray-300">
              <SelectValue placeholder="Todos os profissionais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {professionals?.map((prof) => (
                <SelectItem key={prof.id} value={prof.id}>
                  {prof.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setQuickDate(7)}>
          Últimos 7 dias
        </Button>
        <Button variant="outline" size="sm" onClick={() => setQuickDate(30)}>
          Últimos 30 dias
        </Button>
        <Button variant="outline" size="sm" onClick={() => setQuickDate(90)}>
          Últimos 90 dias
        </Button>
        <Button onClick={applyFilters} className="ml-auto">
          <Calendar className="w-4 h-4 mr-2" />
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
}
