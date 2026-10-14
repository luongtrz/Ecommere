import { Outlet } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { ChatbotWidget } from '@/features/chatbot/components/ChatbotWidget';

export function MainLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-teal-100 selection:text-teal-900">
      <Header />
      <main className="flex-1 pb-24 md:pb-12 lg:pb-16">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
      <ChatbotWidget />
    </div>
  );
}

export default MainLayout;
