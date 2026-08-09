import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

export default function AdminDemoEntry() {
  const navigate = useNavigate();
  const { adminDemoEnabled, enterAdminDemo } = useAuth();
  useEffect(() => {
    if (!adminDemoEnabled) return;
    enterAdminDemo();
    navigate('/admin', { replace: true });
  }, [adminDemoEnabled, enterAdminDemo, navigate]);
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">
      <p>Demo mode is disabled in this environment.</p>
    </main>
  );
}
