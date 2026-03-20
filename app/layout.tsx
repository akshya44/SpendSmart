import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SpendSmart — Expense Management',
  description: 'Track, categorize and visualize your expenses with SpendSmart.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: '#0f1117', minHeight: '100vh' }}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e2132',
              color: '#f1f5f9',
              border: '1px solid #2a2f45',
              borderRadius: '12px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#0f1117' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#0f1117' },
            },
          }}
        />
      </body>
    </html>
  );
}
