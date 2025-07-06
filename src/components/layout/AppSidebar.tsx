
import { 
  Calendar, 
  Users, 
  ShoppingBag, 
  Scissors, 
  Settings, 
  BarChart3,
  FileText,
  Calculator,
  LogOut
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: BarChart3,
  },
  {
    title: 'Agendamentos',
    url: '/agendamentos',
    icon: Calendar,
  },
  {
    title: 'Clientes',
    url: '/clientes',
    icon: Users,
  },
  {
    title: 'Vendas',
    url: '/vendas',
    icon: ShoppingBag,
  },
  {
    title: 'Serviços',
    url: '/servicos',
    icon: Scissors,
  },
  {
    title: 'Equipe',
    url: '/equipe',
    icon: Users,
  },
  {
    title: 'Relatórios',
    url: '/relatorios',
    icon: FileText,
  },
  {
    title: 'Caixa',
    url: '/caixa',
    icon: Calculator,
  },
  {
    title: 'Configurações',
    url: '/configuracoes',
    icon: Settings,
  },
];

export function AppSidebar() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar className="bg-white border-r border-gray-200">
      <SidebarContent>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Bernabeu</h2>
          <p className="text-sm text-gray-600">Barber System</p>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 text-xs uppercase tracking-wider px-6 py-3">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-3 border-t border-gray-200">
        <Button 
          onClick={handleSignOut}
          variant="ghost" 
          className="w-full justify-start text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair da Conta
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
