import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '@/types';
import { Target, ClipboardList, Users, Calendar, Shield, FileText, BarChart3, Share2, LogOut } from 'lucide-react';

const menuItems = {
  employee: [
    { icon: Target, label: 'My Goals', path: '/employee' },
    { icon: Calendar, label: 'Check-ins', path: '/employee/check-ins' },
  ],
  manager: [
    { icon: Target, label: 'Dashboard', path: '/manager' },
    { icon: Users, label: 'Team Goals', path: '/manager/team' },
    { icon: Calendar, label: 'Check-ins', path: '/manager/check-ins' },
  ],
  admin: [
    { icon: BarChart3, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Manage Users', path: '/admin/users' },
    { icon: ClipboardList, label: 'All Goals', path: '/admin/goals' },
    { icon: Share2, label: 'Share Goals', path: '/admin/share' },
    { icon: FileText, label: 'Reports', path: '/admin/reports' },
    { icon: Shield, label: 'Audit Trail', path: '/admin/audit' },
  ],
};

export function LayoutSidebar({ user }: { user: User }) {
  const navigate = useNavigate();
  const location = useLocation();
  const items = menuItems[user.role] || [];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen">
      <div className="p-4 border-b border-slate-700">
        <div className="text-sm text-slate-400">Logged in as</div>
        <div className="font-medium">{user.name}</div>
        <div className="text-xs text-slate-400">{user.department}</div>
      </div>
      <nav className="p-3">
        {items.map(item => {
          const isActive = location.pathname === item.path || (item.path !== '/employee' && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition mb-1 ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
