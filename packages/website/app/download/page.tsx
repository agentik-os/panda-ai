import { Metadata } from 'next'
import { Terminal, Download, Zap, Check, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Download - Agentik OS',
  description:
    'Get started with Agentik OS in under 60 seconds. Docker, npm, or build from source.',
}

export default function DownloadPage() {
  const installMethods = [
    {
      name: 'Docker (Recommended)',
      icon: Terminal,
      time: '30 seconds',
      description: 'Fastest way to get started. No dependencies required.',
      steps: [
        {
          title: 'Pull and run',
          command: 'docker run -p 3000:3000 agentikos/agentik-os',
          description: 'Downloads and starts Agentik OS in one command',
        },
        {
          title: 'Open dashboard',
          command: 'http://localhost:3000',
          description: 'Dashboard opens automatically',
        },
        {
          title: 'Add your API keys',
          description: 'Click Settings → API Keys → Add Claude/OpenAI/Gemini keys',
        },
      ],
    },
    {
      name: 'npm / pnpm',
      icon: Download,
      time: '2 minutes',
      description: 'For developers who want to customize or contribute.',
      steps: [
        {
          title: 'Install CLI globally',
          command: 'npm install -g @agentik-os/cli',
          description: 'Installs the panda CLI tool',
        },
        {
          title: 'Initialize new instance',
          command: 'panda init my-agent-os',
          description: 'Creates a new Agentik OS instance',
        },
        {
          title: 'Start development server',
          command: 'cd my-agent-os && panda dev',
          description: 'Starts dashboard on http://localhost:3000',
        },
      ],
    },
    {
      name: 'Build from Source',
      icon: Zap,
      time: '5 minutes',
      description: 'Full control. Clone, build, and customize.',
      steps: [
        {
          title: 'Clone repository',
          command: 'git clone https://github.com/agentik-os/agentik-os.git',
        },
        {
          title: 'Install dependencies',
          command: 'cd agentik-os && pnpm install',
        },
        {
          title: 'Build packages',
          command: 'pnpm build',
        },
        {
          title: 'Start in development',
          command: 'pnpm dev',
          description: 'Starts all packages in development mode',
        },
      ],
    },
  ]

  const requirements = [
    { name: 'Docker', version: '20.10+', optional: true },
    { name: 'Node.js', version: '20+', optional: false },
    { name: 'pnpm', version: '9+', optional: false },
    { name: 'Bun', version: '1.0+', optional: true },
  ]

  const nextSteps = [
    {
      title: 'Add API Keys',
      description:
        'Connect to Claude, OpenAI, or Google AI. Settings → API Keys → Add your credentials.',
      link: '/docs/getting-started/api-keys',
    },
    {
      title: 'Create Your First Agent',
      description:
        'Use the CLI or dashboard to create an agent. Pick an OS mode (Dev, Business, etc.).',
      link: '/docs/agents/creating-agents',
    },
    {
      title: 'Install Skills',
      description:
        'Browse the marketplace for 250+ skills. GitHub, Gmail, Slack, and more.',
      link: '/docs/skills/installing-skills',
    },
    {
      title: 'Explore the Dashboard',
      description:
        'Real-time cost tracking, agent monitoring, and skill management in a beautiful UI.',
      link: '/docs/dashboard',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Get Started in{' '}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Under 60 Seconds
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Choose your installation method and start building with AI agents.
            </p>
          </div>

          {/* Quick Install */}
          <div className="max-w-2xl mx-auto bg-card border rounded-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Quickest Install</h3>
              <span className="text-sm text-muted-foreground">30 seconds</span>
            </div>
            <div className="bg-background/50 backdrop-blur-sm border rounded-lg p-4 font-mono text-sm mb-4">
              <div className="flex items-center">
                <span className="text-muted-foreground mr-2">$</span>
                <span className="text-foreground">
                  docker run -p 3000:3000 agentikos/agentik-os
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Then open{' '}
              <a
                href="http://localhost:3000"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                http://localhost:3000
              </a>{' '}
              in your browser
            </p>
          </div>
        </div>
      </section>

      {/* Installation Methods */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Choose Your Method</h2>
            <p className="text-lg text-muted-foreground">
              All methods get you the same powerful platform. Pick what works for you.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {installMethods.map((method, index) => {
              const Icon = method.icon
              return (
                <div key={index} className="bg-card border rounded-lg p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{method.time}</span>
                  </div>

                  <h3 className="text-xl font-semibold mb-2">{method.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{method.description}</p>

                  <div className="space-y-6">
                    {method.steps.map((step, sIndex) => (
                      <div key={sIndex}>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {sIndex + 1}
                          </div>
                          <h4 className="font-medium">{step.title}</h4>
                        </div>
                        {step.command && (
                          <div className="bg-background/50 rounded border p-3 mb-2 font-mono text-xs overflow-x-auto">
                            {step.command}
                          </div>
                        )}
                        {step.description && (
                          <p className="text-sm text-muted-foreground ml-8">
                            {step.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              System Requirements
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {requirements.map((req, index) => (
                <div key={index} className="bg-card border rounded-lg p-6 flex items-start">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-semibold mb-1">
                      {req.name}{' '}
                      {req.optional && (
                        <span className="text-sm text-muted-foreground font-normal">
                          (optional)
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">Version {req.version}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              What's Next?
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {nextSteps.map((step, index) => (
                <a
                  key={index}
                  href={step.link}
                  className="group bg-card border rounded-lg p-6 hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold mb-2 flex items-center">
                    {step.title}
                    <ExternalLink className="h-4 w-4 ml-2 text-muted-foreground group-hover:text-primary transition-colors" />
                  </h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold">Need Help Getting Started?</h2>
            <p className="text-lg text-muted-foreground">
              Join our Discord community for support, tutorials, and updates.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://discord.gg/agentik-os"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all"
              >
                Join Discord
              </a>
              <a
                href="/docs"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-all"
              >
                Read Documentation
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
