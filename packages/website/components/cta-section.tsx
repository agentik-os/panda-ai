import Link from 'next/link'
import { ArrowRight, Download } from 'lucide-react'

export function CTASection() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of developers building the future with AI agents.
            Self-host for free, forever.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/download"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
            >
              <Download className="mr-2 h-5 w-5" />
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-all"
            >
              Read the Docs
            </Link>
          </div>

          <div className="pt-8">
            <p className="text-sm text-muted-foreground mb-4">
              Or get started with one command:
            </p>
            <div className="inline-flex items-center bg-background/50 backdrop-blur-sm border rounded-lg px-6 py-3 font-mono text-sm">
              <span className="text-muted-foreground mr-2">$</span>
              <span className="text-foreground">
                docker run -p 3000:3000 agentikos/agentik-os
              </span>
            </div>
          </div>

          <div className="pt-8 text-sm text-muted-foreground">
            <p>
              100% Open Source • MIT License • No Vendor Lock-in
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
