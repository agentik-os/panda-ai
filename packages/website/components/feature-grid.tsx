import {
  BarChart3,
  Network,
  Lock,
  Sparkles,
  Users,
  Terminal,
  Boxes,
  Workflow,
  MessageSquare,
} from 'lucide-react'

export function FeatureGrid() {
  const features = [
    {
      icon: BarChart3,
      title: 'Cost Dashboard',
      description:
        'Real-time cost tracking with breakdown by model, agent, and skill. Budget limits and alerts.',
    },
    {
      icon: Network,
      title: 'Multi-Model Router',
      description:
        'Automatic routing between Claude, GPT, Gemini, and Ollama based on complexity and cost.',
    },
    {
      icon: Lock,
      title: 'Multi-Layer Security',
      description:
        'WASM sandbox, gVisor, Kata Containers, and security scanning on all marketplace skills.',
    },
    {
      icon: Sparkles,
      title: 'Beautiful Dashboard',
      description:
        'Next.js 16 dashboard with real-time WebSocket updates, dark mode, and responsive design.',
    },
    {
      icon: Users,
      title: 'Multi-Tenancy',
      description:
        'SSO, RBAC, audit logs, and workspace isolation for teams and enterprises.',
    },
    {
      icon: Terminal,
      title: 'Powerful CLI',
      description:
        'panda CLI for agent management, chat, logs, deployment, and skill development.',
    },
    {
      icon: Boxes,
      title: 'OS Modes',
      description:
        '9 pre-built OS modes: Human, Business, Dev, Marketing, Sales, Finance, Learning, Design, Ask.',
    },
    {
      icon: Workflow,
      title: 'Automation Engine',
      description:
        'Natural language automation: "Every Monday at 9am, send me a summary of GitHub issues".',
    },
    {
      icon: MessageSquare,
      title: '250+ Integrations',
      description:
        'GitHub, Gmail, Slack, Notion, Stripe, and 250+ more via MCP protocol.',
    },
  ]

  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Everything You Need to Build with AI
          </h2>
          <p className="text-lg text-muted-foreground">
            All the features of OpenClaw, plus 50+ more that actually matter.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group bg-card border rounded-lg p-6 hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <a
            href="/features"
            className="inline-flex items-center text-primary hover:underline"
          >
            View all features
            <span className="ml-2">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
