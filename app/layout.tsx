import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from "@/contexts/AuthContext";
import { DialerProvider } from "@/contexts/DialerContext";
import { FloatingButtonProvider } from "@/contexts/FloatingButtonContext";
import { MinimizedDialer } from "@/components/MinimizedDialer";
import { GlobalDialer } from "@/components/GlobalDialer";
import { Toaster } from 'sonner';
import { ReduxProvider } from '@/lib/redux/provider';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import QueryProvider from "@/providers/QueryProvider";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SmartKollect',
  description: 'Intelligent debt management platform'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <QueryProvider>
          <ReduxProvider>
            <AuthProvider>
              <DialerProvider>
                <FloatingButtonProvider>
                  {children}
                  <MinimizedDialer />
                  <GlobalDialer />
                </FloatingButtonProvider>
              </DialerProvider>
            </AuthProvider>
          </ReduxProvider>
        </QueryProvider>
        <SpeedInsights />
        <Analytics />
        <Toaster 
          position="top-right" 
          theme="dark" 
          richColors 
          closeButton
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
            },
          }}
        />
      </body>
    </html>
  );
}