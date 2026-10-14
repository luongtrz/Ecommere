import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-100">
      <Outlet />
    </div>
  );
}
