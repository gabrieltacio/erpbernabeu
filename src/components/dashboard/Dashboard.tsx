import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Calendar, 
  Scissors, 
  User, 
  ShoppingBag, 
  BarChart3,
  TrendingUp,
  Clock
} from 'lucide-react';
import { ClientsList } from '@/components/clients/ClientsList';
import { AppointmentsList } from '@/components/appointments/AppointmentsList';
import { ServicesList } from '@/components/services/ServicesList';
import { TeamList } from '@/components/team/TeamList';
import { SalesList } from '@/components/sales/SalesList';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdvancedDashboard } from './AdvancedDashboard';

export function Dashboard() {
  return <AdvancedDashboard />;
}
