import { Outlet, Link } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex flex-col">
      <header className="p-4">
        <Link to="/" className="text-2xl font-bold text-primary">
          Thai Spray Shop
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Outlet />
      </main>
      <footer className="p-4 text-center text-sm text-gray-600">
        © 2025 Thai Spray Shop. All rights reserved.
      </footer>
    </div>
  );
}
