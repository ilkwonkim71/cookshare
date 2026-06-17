import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Header } from '@/components/header';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CookShare — 레시피를 나눠요',
  description: '나만의 레시피를 공유하고 다양한 요리를 발견하세요.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          <main className="container py-8">{children}</main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
