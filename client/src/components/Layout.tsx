import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '@/types';
import { LayoutSidebar } from './LayoutSidebar';
import { LogoutButton } from './LogoutButton';
import { Target } from 'lucide-react';

export function Layout({ user, setUser, children }: { user: User; setUser: (u: User | null) => void; children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const roleLabel = user.role === 'employee' ? 'Employee' : user.role === 'manager' ? 'Manager' : 'Admin';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <LayoutSidebar user={user} />
      <div className="flex-1">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Target className="text-blue-600" size={24} />
            <div>
              <h1 className="font-bold text-slate-900">GoalTracker</h1>
              <p className="text-xs text-slate-500">{roleLabel} Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-medium text-sm">{user.name}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>
            <LogoutButton setUser={setUser} />
          </div>
        </header>
        <main className="p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
