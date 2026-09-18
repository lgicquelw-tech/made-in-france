'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';
import { Footer } from './footer';
import ChatBot from '@/components/ChatBot';
import type { Chiffres } from '@/lib/chiffres-format';

export default function LayoutWrapper({ children, chiffres }: { children: React.ReactNode; chiffres: Chiffres | null }) {
  const pathname = usePathname();
  const isStudio = pathname?.startsWith('/studio');
  const isAdmin = pathname?.startsWith('/admin');

  // Pas de header/footer sur les pages admin et studio
  if (isStudio || isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer chiffres={chiffres} />
      <ChatBot />
    </div>
  );
}