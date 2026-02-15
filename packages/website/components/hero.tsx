import Link from 'next/link'
import { ArrowRight, Github, Star, Download } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-accent/50 backdrop-blur-sm border rounded-full px-4 py-2 text-sm">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-muted-foreground">
              Open source • MIT licensed • Self-host for free
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight">
            Your AI Team,
            <br />
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Running Anywhere
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
            The AI Agent Operating System that makes OpenClaw look like a
            prototype. Multi-model intelligence, beautiful dashboard, transparent
            costs, enterprise security.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/download"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            >
              <Download className="mr-2 h-5 w-5" />
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="https://github.com/agentik-os/agentik-os"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-all"
            >
              <Github className="mr-2 h-5 w-5" />
              Star on GitHub
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">5</div>
              <div className="text-sm text-muted-foreground">AI Models</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">250+</div>
              <div className="text-sm text-muted-foreground">Integrations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">100%</div>
              <div className="text-sm text-muted-foreground">Open Source</div>
            </div>
          </div>

          {/* Install command */}
          <div className="pt-8">
            <div className="inline-flex items-center bg-secondary/50 backdrop-blur-sm border rounded-lg px-6 py-3 font-mono text-sm">
              <span className="text-muted-foreground mr-2">$</span>
              <span className="text-foreground">
                docker run -p 3000:3000 agentikos/agentik-os
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              One command. Your entire AI team. Ready in 60 seconds.
            </p>
          </div>
        </div>

        {/* Dashboard preview image placeholder */}
        <div className="mt-16 max-w-6xl mx-auto">
          <div className="relative rounded-xl border bg-gradient-to-br from-primary/10 to-purple-500/10 p-1">
            <div className="rounded-lg bg-background border aspect-video flex items-center justify-center">
              <p className="text-muted-foreground text-sm">
                Dashboard Preview Coming Soon
              </p>
            </div>
            {/* Floating elements */}
            <div className="absolute -top-4 -left-4 h-24 w-24 rounded-lg bg-primary/20 backdrop-blur-sm border" />
            <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-lg bg-purple-500/20 backdrop-blur-sm border" />
          </div>
        </div>
      </div>
    </section>
  )
}
