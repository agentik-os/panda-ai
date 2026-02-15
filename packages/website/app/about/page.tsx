import { Metadata } from 'next'
import { Heart, Target, Users, Zap, Code, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About - Agentik OS',
  description:
    'Learn about Agentik OS - our mission to make AI agents accessible, secure, and powerful for everyone.',
}

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Open by Default',
      description:
        '100% MIT licensed. No feature gates, no bait-and-switch. We believe the best AI infrastructure should be accessible to everyone.',
    },
    {
      icon: Target,
      title: 'Production-First',
      description:
        "We're not building a toy. Every feature is designed for real-world use cases, from solo developers to Fortune 500 companies.",
    },
    {
      icon: Zap,
      title: 'Speed & Quality',
      description:
        'Fast execution matters. Beautiful UX matters. Both are non-negotiable. We refuse to compromise on either.',
    },
    {
      icon: Code,
      title: 'Developer Experience',
      description:
        "If it's not delightful to use, we haven't shipped it. From CLI ergonomics to dashboard polish, we sweat every detail.",
    },
    {
      icon: Users,
      title: 'Community-Driven',
      description:
        'Our roadmap is shaped by real users, not investors. Every feature request is tracked. Every bug gets a response.',
    },
    {
      icon: Globe,
      title: 'No Vendor Lock-In',
      description:
        'Self-host anywhere. Migrate anytime. Export everything. Your data and infrastructure are yours, always.',
    },
  ]

  const milestones = [
    {
      date: 'Q1 2026',
      title: 'The Spark',
      description:
        'After OpenClaw hit 191K stars but lacked production features, we saw an opportunity. What if we built the OS they should have?',
    },
    {
      date: 'Q2 2026',
      title: 'Foundation Built',
      description:
        'Core runtime, multi-model router, cost tracking, and WASM sandbox. The hard parts first.',
    },
    {
      date: 'Q3 2026',
      title: 'Dashboard & Marketplace',
      description:
        'Beautiful Next.js dashboard, real-time updates, and a skill marketplace with security scanning. Production-ready.',
    },
    {
      date: 'Q4 2026',
      title: 'Enterprise Features',
      description:
        'SSO, RBAC, audit logs, time travel debug, and agent dreams. Features that make CTOs say yes.',
    },
    {
      date: 'Q1 2027',
      title: 'Public Launch',
      description:
        'Open source release. Product Hunt launch. First 1,000 users. The journey begins.',
    },
    {
      date: 'Beyond',
      title: 'The Future',
      description:
        '100K GitHub stars. 10,000 production deployments. The AI Agent OS that everyone uses.',
    },
  ]

  const stats = [
    { label: 'Months of Development', value: '8' },
    { label: 'Lines of Code', value: '120K+' },
    { label: 'Features Shipped', value: '50+' },
    { label: 'GitHub Stars (Target)', value: '100K' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              We're building the AI Agent OS
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                that should have existed
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              OpenClaw proved demand. We're delivering production.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Our Mission</h2>
            <div className="bg-card border rounded-lg p-8 md:p-12">
              <p className="text-lg leading-relaxed mb-6">
                <strong className="text-foreground">
                  Make AI agents accessible, secure, and powerful for everyone.
                </strong>
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                OpenClaw showed the world that developers want an OS for AI agents. They hit 191K
                GitHub stars in months. But they stopped at the CLI. No dashboard. No cost
                tracking. No security. No production features.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We saw developers asking for these features in every GitHub issue. Comments like
                "Would love a dashboard" and "How do I track costs?" with hundreds of upvotes.
                Meanwhile, 341 malicious skills were uploaded to the marketplace (ClawHavoc).
              </p>
              <p className="text-muted-foreground leading-relaxed">
                So we built what they should have: beautiful dashboard, multi-model routing,
                real-time cost tracking, multi-layer security, enterprise features, and 50+ more
                capabilities. Same MIT license. Same open source spirit. But actually
                production-ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon
                return (
                  <div key={index} className="bg-card border rounded-lg p-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Our Journey</h2>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-6">
                  <div className="flex-shrink-0 w-24 text-right">
                    <div className="text-sm font-medium text-primary">{milestone.date}</div>
                  </div>
                  <div className="relative flex-1">
                    {index < milestones.length - 1 && (
                      <div className="absolute left-0 top-8 bottom-0 w-px bg-border" />
                    )}
                    <div className="relative bg-card border rounded-lg p-6">
                      <div className="absolute -left-6 top-6 h-3 w-3 rounded-full bg-primary border-4 border-background" />
                      <h3 className="text-lg font-semibold mb-2">{milestone.title}</h3>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">By the Numbers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Built by Developers</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Agentik OS is built by a distributed team of developers, designers, and AI
              engineers who are obsessed with developer experience and production quality.
            </p>
            <p className="text-lg text-muted-foreground mb-12">
              We're venture-backed but prioritize open source sustainability over growth at all
              costs. Our goal: 100K GitHub stars and 10,000 production deployments in 12 months.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://github.com/agentik-os"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-all"
              >
                View on GitHub
              </a>
              <a
                href="https://twitter.com/agentikos"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-all"
              >
                Follow on Twitter
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Want to Join the Journey?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              We're hiring engineers, designers, and DevRel. Remote-first, competitive comp,
              meaningful equity.
            </p>
            <a
              href="mailto:careers@agentik-os.com"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
            >
              View Open Positions
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
