import type { Metadata } from 'next';
import './globals.css';
import { ConvexClientProvider } from '@/components/providers/convex-provider';
import { WebSocketProvider } from '@/components/providers/websocket-provider';
import { ThemeProvider } from '@/lib/theme-provider';

export const metadata: Metadata = {
  title: 'Agentik OS - AI Agent Dashboard',
  description: 'Manage your AI agents, monitor costs, and orchestrate autonomous workflows',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            <WebSocketProvider>{children}</WebSocketProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
