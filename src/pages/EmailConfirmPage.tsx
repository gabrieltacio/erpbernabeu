import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function EmailConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (error) {
          setStatus('error');
          setMessage('Link de confirmação inválido ou expirado.');
          toast({
            title: "Erro na confirmação",
            description: "Link inválido ou expirado. Tente fazer um novo cadastro.",
            variant: "destructive",
          });
        } else {
          setStatus('success');
          setMessage('Email confirmado com sucesso!');
          toast({
            title: "Email confirmado!",
            description: "Sua conta foi ativada. Você pode fazer login agora.",
          });
          
          // Redirecionar para login após 3 segundos
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
        }
      } else {
        setStatus('error');
        setMessage('Link de confirmação inválido.');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            {status === 'loading' && <Loader2 className="w-12 h-12 text-slate-600 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-12 h-12 text-green-600" />}
            {status === 'error' && <XCircle className="w-12 h-12 text-red-600" />}
          </div>
          
          <CardTitle className="text-2xl font-bold text-slate-900">
            {status === 'loading' && 'Confirmando email...'}
            {status === 'success' && 'Email Confirmado!'}
            {status === 'error' && 'Erro na Confirmação'}
          </CardTitle>
          
          <CardDescription className="text-slate-600">
            {message}
          </CardDescription>
        </CardHeader>
        
        {status !== 'loading' && (
          <CardContent>
            <div className="space-y-4">
              {status === 'success' && (
                <p className="text-sm text-center text-slate-600">
                  Redirecionando para login em alguns segundos...
                </p>
              )}
              
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full bg-slate-900 hover:bg-slate-800"
              >
                {status === 'success' ? 'Ir para Login' : 'Tentar Novamente'}
              </Button>
              
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}