import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="relative min-h-screen w-full bg-slate-50 text-slate-900 font-sans antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Soft ambient background gradient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-teal-500/5 blur-3xl md:h-[650px] md:w-[650px]" />
      </div>
      <main className="relative z-10 flex min-h-screen w-full flex-col justify-center py-4 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AuthLayout;
