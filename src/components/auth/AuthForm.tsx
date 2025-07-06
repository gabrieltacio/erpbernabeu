
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Scissors, Mail } from 'lucide-react';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const { signIn, signUp, resendConfirmation } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Verificar se foi redirecionado por falta de confirmação de email
    if (location.state?.needsConfirmation) {
      setNeedsConfirmation(true);
    }
  }, [location.state]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error && error.message.includes('Email not confirmed')) {
      setNeedsConfirmation(true);
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    
    setLoading(true);
    const { error } = await signUp(email, password, name);
    
    if (!error) {
      setNeedsConfirmation(true);
    }
    
    setLoading(false);
  };

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResendingEmail(true);
    await resendConfirmation(email);
    setResendingEmail(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-slate-900 p-3 rounded-full">
              <Scissors className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Bernabeu Barber
          </CardTitle>
          <CardDescription className="text-slate-600">
            Sistema de gestão profissional
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {needsConfirmation ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Confirme seu email
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                Enviamos um link de confirmação para <strong>{email}</strong>. 
                Clique no link do email para ativar sua conta e poder fazer login.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={handleResendEmail}
                  variant="outline"
                  className="w-full"
                  disabled={resendingEmail}
                >
                  {resendingEmail ? 'Reenviando...' : 'Reenviar email'}
                </Button>
                <Button 
                  onClick={() => setNeedsConfirmation(false)}
                  variant="ghost"
                  className="w-full text-sm"
                >
                  Voltar ao login
                </Button>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="border-slate-300 focus:border-slate-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Senha
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border-slate-300 focus:border-slate-500"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-slate-900 hover:bg-slate-800"
                    disabled={loading}
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Nome completo
                    </label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="border-slate-300 focus:border-slate-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="border-slate-300 focus:border-slate-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Senha
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border-slate-300 focus:border-slate-500"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-slate-900 hover:bg-slate-800"
                    disabled={loading}
                  >
                    {loading ? 'Cadastrando...' : 'Cadastrar'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
