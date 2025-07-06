import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useBarbearia() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, barbearia_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: barbearia, isLoading: isLoadingBarbearia } = useQuery({
    queryKey: ['user-barbearia', profile?.barbearia_id],
    queryFn: async () => {
      if (!profile?.barbearia_id) return null;
      
      const { data, error } = await supabase
        .from('barbearias')
        .select('*')
        .eq('id', profile.barbearia_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.barbearia_id,
  });

  const needsBarbeariaSetup = profile?.role === 'admin' && !profile?.barbearia_id;

  return {
    profile,
    barbearia,
    needsBarbeariaSetup,
    isLoading: isLoading || isLoadingBarbearia,
  };
}