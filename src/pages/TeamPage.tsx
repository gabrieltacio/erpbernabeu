
import { TeamList } from '@/components/team/TeamList';

export function TeamPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
        <p className="text-gray-600">Gerencie os membros da equipe da barbearia</p>
      </div>
      <TeamList />
    </div>
  );
}
