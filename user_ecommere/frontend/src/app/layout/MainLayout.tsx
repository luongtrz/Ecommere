import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { ChatbotWidget } from '@/features/chatbot/components/ChatbotWidget';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const location = useLocation();
  const isCheckout =
    location.pathname === '/checkout' ||
    location.pathname.startsWith('/checkout/');

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-background text-foreground',
        !isCheckout && 'pb-16 md:pb-0',
      )}
    >
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {!isCheckout && <MobileNav />}
      {!isCheckout && <ChatbotWidget />}
    </div>
  );
}
