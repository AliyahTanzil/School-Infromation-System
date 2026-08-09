import { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

export default function AdminDemoEntry() {
  const { enterAdminDemo, adminDemoEnabled } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!adminDemoEnabled) {
      navigate('/login', { replace: true });
      return;
    }
    enterAdminDemo();
    navigate('/admin', { replace: true });
  }, [adminDemoEnabled, enterAdminDemo, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <ShieldCheck className="text-indigo-400" size={18} /> Preparing local admin demo…
      </div>
    </main>
  );
}
