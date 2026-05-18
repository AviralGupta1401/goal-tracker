import { User } from '@/types';

export function LogoutButton({ setUser }: { setUser: (u: User | null) => void }) {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-red-600 transition">
      Logout
    </button>
  );
}
