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
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center text-slate-100">
      <div>
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl bg-indigo-500 font-bold text-white">
          S
        </div>
        <p className="text-lg font-semibold">Preparing your full Demo workspace</p>
        <p className="mt-2 text-sm text-slate-400">Loading the safe testing environment…</p>
      </div>
    </main>
  );
}
