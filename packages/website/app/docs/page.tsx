import { Metadata } from 'next'
import Link from 'next/link'
import {
  BookOpen,
  Rocket,
  Terminal,
  Code,
  Shield,
  Settings,
  FileCode,
  Users,
  Zap,
  ArrowRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Documentation - Agentik OS',
  description:
    'Complete documentation for Agentik OS. Guides, API reference, tutorials, and best practices.',
}

export default function DocsPage() {
  const sections = [
    {
      icon: Rocket,
      title: 'Getting Started',
      description: 'Quick start guide, installation, and first agent',
      links: [
        { title: 'Installation', href: '/docs/getting-started/installation' },
        { title: 'Quick Start', href: '/docs/getting-started/quick-start' },
        { title: 'Configuration', href: '/docs/getting-started/configuration' },
        { title: 'API Keys', href: '/docs/getting-started/api-keys' },
      ],
    },
    {
      icon: Terminal,
      title: 'CLI Reference',
      description: 'Complete panda CLI documentation',
      links: [
        { title: 'panda init', href: '/docs/cli/init' },
        { title: 'panda agent', href: '/docs/cli/agent' },
        { title: 'panda chat', href: '/docs/cli/chat' },
        { title: 'panda skill', href: '/docs/cli/skill' },
      ],
    },
    {
      icon: Code,
      title: 'Agents',
      description: 'Creating and managing AI agents',
      links: [
        { title: 'Creating Agents', href: '/docs/agents/creating' },
        { title: 'OS Modes', href: '/docs/agents/modes' },
        { title: 'Agent Configuration', href: '/docs/agents/configuration' },
        { title: 'Best Practices', href: '/docs/agents/best-practices' },
      ],
    },
    {
      icon: FileCode,
      title: 'Skills',
      description: 'Building and using skills',
      links: [
        { title: 'Installing Skills', href: '/docs/skills/installing' },
        { title: 'Creating Skills', href: '/docs/skills/creating' },
        { title: 'Skill SDK', href: '/docs/skills/sdk' },
        { title: 'Publishing Skills', href: '/docs/skills/publishing' },
      ],
    },
    {
      icon: Settings,
      title: 'Configuration',
      description: 'System configuration and settings',
      links: [
        { title: 'Environment Variables', href: '/docs/config/environment' },
        { title: 'Model Router', href: '/docs/config/router' },
        { title: 'Cost Tracking', href: '/docs/config/cost' },
        { title: 'Security', href: '/docs/config/security' },
      ],
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Security best practices and sandboxing',
      links: [
        { title: 'WASM Sandbox', href: '/docs/security/wasm' },
        { title: 'Permissions', href: '/docs/security/permissions' },
        { title: 'Security Scanning', href: '/docs/security/scanning' },
        { title: 'Air-Gapped Deployment', href: '/docs/security/air-gapped' },
      ],
    },
    {
      icon: Zap,
      title: 'Advanced Features',
      description: 'Agent Dreams, Time Travel Debug, and more',
      links: [
        { title: 'Agent Dreams', href: '/docs/advanced/dreams' },
        { title: 'Time Travel Debug', href: '/docs/advanced/time-travel' },
        { title: 'Multi-AI Consensus', href: '/docs/advanced/consensus' },
        { title: 'Automation Engine', href: '/docs/advanced/automation' },
      ],
    },
    {
      icon: Users,
      title: 'Enterprise',
      description: 'SSO, RBAC, and multi-tenancy',
      links: [
        { title: 'SSO Setup', href: '/docs/enterprise/sso' },
        { title: 'RBAC', href: '/docs/enterprise/rbac' },
        { title: 'Audit Logs', href: '/docs/enterprise/audit-logs' },
        { title: 'Deployment', href: '/docs/enterprise/deployment' },
      ],
    },
  ]

  const quickLinks = [
    {
      title: 'Install with Docker',
      description: 'Get up and running in 30 seconds',
      href: '/download',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'API Reference',
      description: 'Complete API documentation',
      href: '/docs/api',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Tutorials',
      description: 'Step-by-step guides',
      href: '/docs/tutorials',
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Examples',
      description: 'Code examples and templates',
      href: '/docs/examples',
      color: 'from-orange-500 to-red-500',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-lg bg-primary/10 mb-6">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Documentation
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Everything you need to build production AI agents with Agentik OS.
            </p>
          </div>

          {/* Search (Placeholder) */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full px-6 py-4 bg-card border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <kbd className="px-2 py-1 text-xs bg-muted rounded">⌘K</kbd>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="group bg-card border rounded-lg p-6 hover:shadow-lg transition-all"
              >
                <div className={`h-2 w-12 rounded-full bg-gradient-to-r ${link.color} mb-4`} />
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {link.title}
                </h3>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {sections.map((section, index) => {
              const Icon = section.icon
              return (
                <div key={index} className="bg-card border rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                  <div className="space-y-2">
                    {section.links.map((link, lIndex) => (
                      <Link
                        key={lIndex}
                        href={link.href}
                        className="block text-sm text-primary hover:underline"
                      >
                        {link.title} →
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card border rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-4">Can't Find What You Need?</h3>
                <p className="text-muted-foreground mb-6">
                  Join our Discord community for help from the team and other developers.
                </p>
                <a
                  href="https://discord.gg/agentik-os"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
                >
                  Join Discord
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </div>

              <div className="bg-card border rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-4">Want to Contribute?</h3>
                <p className="text-muted-foreground mb-6">
                  Help us improve the docs. Submit a PR or suggest edits on GitHub.
                </p>
                <a
                  href="https://github.com/agentik-os/agentik-os/tree/main/docs"
                  className="inline-flex items-center justify-center px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-all"
                >
                  Edit on GitHub
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Ready to Build?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Get started with Agentik OS in under 60 seconds.
            </p>
            <div className="inline-flex items-center bg-background/50 backdrop-blur-sm border rounded-lg px-6 py-3 font-mono text-sm">
              <span className="text-muted-foreground mr-2">$</span>
              <span className="text-foreground">docker run -p 3000:3000 agentikos/agentik-os</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
