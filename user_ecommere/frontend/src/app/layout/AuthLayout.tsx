import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="relative min-h-screen w-full bg-background text-foreground antialiased selection:bg-accent/30 selection:text-foreground">
      {/* Soft ambient background gradient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[100px] md:h-[650px] md:w-[650px] animate-float-orb" />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col justify-center px-4 py-8 md:px-8 md:py-12">
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
