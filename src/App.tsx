
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { EmailConfirmPage } from '@/pages/EmailConfirmPage';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { AppointmentsPage } from '@/pages/AppointmentsPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { SalesPage } from '@/pages/SalesPage';
import { ServicesPage } from '@/pages/ServicesPage';
import { TeamPage } from '@/pages/TeamPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdvancedDashboard } from '@/components/dashboard/AdvancedDashboard';
import { ReportsPage } from '@/pages/ReportsPage';
import { CashFlowPage } from '@/pages/CashFlowPage';
import { PublicHomePage } from '@/pages/PublicHomePage';
import { BarbeariaDetailsPage } from '@/pages/BarbeariaDetailsPage';
import { BarbeariaSetupPage } from '@/pages/BarbeariaSetupPage';
import { PublicSchedulePage } from '@/pages/PublicSchedulePage';
import { useBarbearia } from '@/hooks/useBarbearia';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { needsBarbeariaSetup, isLoading: barbeariaLoading } = useBarbearia();

  if (loading || barbeariaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (needsBarbeariaSetup) {
    return <Navigate to="/setup-barbearia" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Página inicial pública */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <PublicHomePage />} />
        <Route path="/barbearia/:id" element={<BarbeariaDetailsPage />} />
        <Route path="/barbearia/:id/agendar" element={<PublicSchedulePage />} />
        
        {/* Rota de autenticação */}
        <Route 
          path="/auth" 
          element={user ? <Navigate to="/dashboard" replace /> : <AuthForm />} 
        />
        
        {/* Rota de confirmação de email */}
        <Route path="/auth/confirm" element={<EmailConfirmPage />} />
        
        {/* Rota de configuração de barbearia */}
        <Route 
          path="/setup-barbearia" 
          element={user ? <BarbeariaSetupPage /> : <Navigate to="/auth" replace />} 
        />
        
        {/* Rotas protegidas - estrutura original restaurada */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AdvancedDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agendamentos"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AppointmentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ClientsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendas"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SalesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/servicos"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ServicesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipe"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TeamPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/relatorios"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ReportsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/caixa"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CashFlowPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>      
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
