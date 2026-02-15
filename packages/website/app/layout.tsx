import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Agentik OS - Your AI Team, Running Anywhere',
  description: 'The AI Agent Operating System that makes OpenClaw look like a prototype. Multi-model intelligence, beautiful dashboard, transparent costs, enterprise security.',
  keywords: ['AI', 'AI Agents', 'OpenClaw', 'MCP', 'Automation', 'AI Operating System'],
  authors: [{ name: 'Agentik OS Team' }],
  openGraph: {
    title: 'Agentik OS - Your AI Team, Running Anywhere',
    description: 'The AI Agent Operating System that makes OpenClaw look like a prototype.',
    type: 'website',
    url: 'https://agentik-os.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentik OS - Your AI Team, Running Anywhere',
    description: 'The AI Agent Operating System that makes OpenClaw look like a prototype.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
