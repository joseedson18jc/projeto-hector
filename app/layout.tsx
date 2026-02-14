import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { Footer } from '@/components/layout/footer';
import { ToastContainer } from '@/components/ui/toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hector — Dashboard de Avaliações',
  description: 'Dashboard de acompanhamento de avaliações de funcionários',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="app-shell">
          <Sidebar />
          <main className="main-content">
            {children}
            <Footer />
          </main>
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}
