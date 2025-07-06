import { useNavigate } from 'react-router-dom';
import { BarbeariaSetupForm } from '@/components/barbearia/BarbeariaSetupForm';

export function BarbeariaSetupPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center p-6">
      <BarbeariaSetupForm onSuccess={handleSuccess} />
    </div>
  );
}