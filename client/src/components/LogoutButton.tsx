import { User } from '@/types';
import { useNavigate } from 'react-router-dom';

export function LogoutButton({ setUser }: { setUser: (u: User | null) => void }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-red-600 transition">
      Logout
    </button>
  );
}
