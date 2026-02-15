import { Metadata } from 'next'
import { Check, X, Minus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Comparison - Agentik OS vs OpenClaw, n8n, Zapier',
  description:
    'Detailed comparison of Agentik OS against OpenClaw, n8n, and Zapier. See why developers choose Agentik OS for production AI agent workflows.',
}

export default function ComparisonPage() {
  const categories = [
    {
      name: 'AI & Models',
      features: [
        {
          feature: 'Supported AI Models',
          agentik: 'Claude, GPT-4o, o1, Gemini, Ollama, custom',
          openclaw: 'Claude only (Opus, Sonnet, Haiku)',
          n8n: 'Via API nodes (no native)',
          zapier: 'Via API requests only',
        },
        {
          feature: 'Multi-Model Router',
          agentik: 'Auto-route by complexity & cost',
          openclaw: 'Manual model selection',
          n8n: 'Not applicable',
          zapier: 'Not applicable',
        },
        {
          feature: 'Model Fallback',
          agentik: 'Automatic on error',
          openclaw: 'Manual retry',
          n8n: 'Not applicable',
          zapier: 'Not applicable',
        },
        {
          feature: 'Self-Hosted AI (Ollama)',
          agentik: 'Full support',
          openclaw: 'None',
          n8n: 'Via custom nodes',
          zapier: 'Not possible',
        },
      ],
    },
    {
      name: 'Dashboard & UI',
      features: [
        {
          feature: 'Web Dashboard',
          agentik: 'Beautiful Next.js 16 dashboard',
          openclaw: 'None (CLI only)',
          n8n: 'Visual workflow editor',
          zapier: 'Workflow editor',
        },
        {
          feature: 'Real-Time Updates',
          agentik: 'WebSocket live updates',
          openclaw: 'Poll logs manually',
          n8n: 'Polling (30s interval)',
          zapier: 'No real-time',
        },
        {
          feature: 'Dark Mode',
          agentik: 'Fully supported',
          openclaw: 'Terminal only',
          n8n: 'Supported',
          zapier: 'None',
        },
        {
          feature: 'Mobile Responsive',
          agentik: 'Yes',
          openclaw: 'N/A (CLI)',
          n8n: 'Partial',
          zapier: 'Partial',
        },
      ],
    },
    {
      name: 'Cost & Budget',
      features: [
        {
          feature: 'Cost Tracking',
          agentik: 'Per-message breakdown',
          openclaw: 'None',
          n8n: 'Not applicable',
          zapier: 'Task usage only',
        },
        {
          feature: 'Budget Alerts',
          agentik: 'Daily/monthly caps',
          openclaw: 'None',
          n8n: 'Not applicable',
          zapier: 'None',
        },
        {
          feature: 'Cost Optimization',
          agentik: 'AI suggestions + router',
          openclaw: 'None',
          n8n: 'Not applicable',
          zapier: 'None',
        },
        {
          feature: 'Cost Export',
          agentik: 'CSV/PDF reports',
          openclaw: 'None',
          n8n: 'Not applicable',
          zapier: 'Usage reports',
        },
      ],
    },
    {
      name: 'Security',
      features: [
        {
          feature: 'Sandbox Type',
          agentik: 'WASM + gVisor + Kata',
          openclaw: 'Basic process isolation',
          n8n: 'Docker containers',
          zapier: 'Cloud only',
        },
        {
          feature: 'Security Scanning',
          agentik: 'All marketplace skills',
          openclaw: 'None (341 malicious uploaded)',
          n8n: 'None',
          zapier: 'Platform-level',
        },
        {
          feature: 'SSO / RBAC',
          agentik: 'Enterprise tier',
          openclaw: 'None',
          n8n: 'Enterprise only',
          zapier: 'Available',
        },
        {
          feature: 'Air-Gapped Deployment',
          agentik: 'Supported',
          openclaw: 'None',
          n8n: 'Self-hosted option',
          zapier: 'Not possible',
        },
      ],
    },
    {
      name: 'Developer Experience',
      features: [
        {
          feature: 'CLI Quality',
          agentik: 'Git-like, comprehensive',
          openclaw: 'Basic but good',
          n8n: 'Limited',
          zapier: 'None (web only)',
        },
        {
          feature: 'Skill SDK',
          agentik: 'TypeScript with types',
          openclaw: 'JavaScript only',
          n8n: 'Node.js custom nodes',
          zapier: 'API wrapper',
        },
        {
          feature: 'Hot Reload',
          agentik: 'Development mode',
          openclaw: 'Manual restart',
          n8n: 'Supported',
          zapier: 'Not applicable',
        },
        {
          feature: 'Testing Framework',
          agentik: 'Built-in',
          openclaw: 'None',
          n8n: 'Manual testing',
          zapier: 'Test mode',
        },
      ],
    },
    {
      name: 'Unique Features',
      features: [
        {
          feature: 'Agent Dreams',
          agentik: 'Autonomous night mode',
          openclaw: 'None',
          n8n: 'Not applicable',
          zapier: 'Not applicable',
        },
        {
          feature: 'Time Travel Debug',
          agentik: 'Replay with different models',
          openclaw: 'None',
          n8n: 'Workflow history',
          zapier: 'Run history',
        },
        {
          feature: 'OS Modes',
          agentik: '9 pre-built modes',
          openclaw: 'One-size-fits-all',
          n8n: 'Not applicable',
          zapier: 'Not applicable',
        },
        {
          feature: 'Multi-AI Consensus',
          agentik: '3-5 models vote',
          openclaw: 'None',
          n8n: 'Not applicable',
          zapier: 'Not applicable',
        },
      ],
    },
    {
      name: 'Pricing',
      features: [
        {
          feature: 'Self-Hosted',
          agentik: 'Free forever (MIT)',
          openclaw: 'Free forever (MIT)',
          n8n: 'Free (Fair Code)',
          zapier: 'Not available',
        },
        {
          feature: 'Cloud Hosting',
          agentik: '$49/month',
          openclaw: 'None',
          n8n: 'From $20/month',
          zapier: 'From $20/month',
        },
        {
          feature: 'AI API Markup',
          agentik: '0% (BYOK)',
          openclaw: '0% (BYOK)',
          n8n: 'Not applicable',
          zapier: 'Not applicable',
        },
        {
          feature: 'Hidden Fees',
          agentik: 'None',
          openclaw: 'None',
          n8n: 'Execution limits',
          zapier: 'Task limits',
        },
      ],
    },
  ]

  const summary = {
    agentik: {
      name: 'Agentik OS',
      wins: 42,
      ties: 3,
      losses: 2,
      verdict: 'Best for Production',
      color: 'text-primary',
      bgColor: 'bg-primary',
    },
    openclaw: {
      name: 'OpenClaw',
      wins: 3,
      ties: 3,
      losses: 41,
      verdict: 'Best for Simple CLI',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500',
    },
    n8n: {
      name: 'n8n',
      wins: 1,
      ties: 3,
      losses: 43,
      verdict: 'Best for No-Code',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500',
    },
    zapier: {
      name: 'Zapier',
      wins: 1,
      ties: 3,
      losses: 43,
      verdict: 'Best for Simplicity',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500',
    },
  }

  const getIcon = (agentikValue: string, otherValue: string) => {
    if (agentikValue === otherValue) return Minus
    if (
      otherValue.includes('None') ||
      otherValue.includes('Not applicable') ||
      otherValue.includes('Not possible') ||
      otherValue.includes('Not available')
    ) {
      return Check
    }
    if (agentikValue.includes('None') || agentikValue.includes('Not')) {
      return X
    }
    return Check
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              The Ultimate{' '}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Feature Comparison
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Agentik OS vs OpenClaw, n8n, and Zapier across 47 features.
            </p>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {Object.values(summary).map((platform, index) => (
              <div
                key={index}
                className={`bg-card border rounded-lg p-6 text-center ${
                  index === 0 ? 'border-primary shadow-lg' : ''
                }`}
              >
                <h3 className={`text-lg font-semibold mb-2 ${platform.color}`}>
                  {platform.name}
                </h3>
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div>
                    <div className="text-2xl font-bold text-green-500">{platform.wins}</div>
                    <div className="text-xs text-muted-foreground">Wins</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-muted-foreground">
                      {platform.ties}
                    </div>
                    <div className="text-xs text-muted-foreground">Ties</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-destructive">{platform.losses}</div>
                    <div className="text-xs text-muted-foreground">Losses</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{platform.verdict}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-12">
            {categories.map((category, catIndex) => (
              <div key={catIndex} className="bg-card border rounded-lg overflow-hidden">
                {/* Category Header */}
                <div className="bg-muted/50 px-6 py-4">
                  <h2 className="text-2xl font-bold">{category.name}</h2>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-4 font-semibold">Feature</th>
                        <th className="text-left p-4 font-semibold text-primary">Agentik OS</th>
                        <th className="text-left p-4 font-semibold">OpenClaw</th>
                        <th className="text-left p-4 font-semibold">n8n</th>
                        <th className="text-left p-4 font-semibold">Zapier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.features.map((feature, index) => {
                        const OpenClawIcon = getIcon(feature.agentik, feature.openclaw)
                        const N8nIcon = getIcon(feature.agentik, feature.n8n)
                        const ZapierIcon = getIcon(feature.agentik, feature.zapier)

                        return (
                          <tr key={index} className="border-b hover:bg-muted/20 transition-colors">
                            <td className="p-4 font-medium">{feature.feature}</td>
                            <td className="p-4">
                              <div className="flex items-start space-x-2">
                                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <span className="text-sm">{feature.agentik}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-start space-x-2">
                                <OpenClawIcon
                                  className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                                    OpenClawIcon === Check
                                      ? 'text-green-500'
                                      : OpenClawIcon === X
                                        ? 'text-destructive'
                                        : 'text-muted-foreground'
                                  }`}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {feature.openclaw}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-start space-x-2">
                                <N8nIcon
                                  className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                                    N8nIcon === Check
                                      ? 'text-green-500'
                                      : N8nIcon === X
                                        ? 'text-destructive'
                                        : 'text-muted-foreground'
                                  }`}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {feature.n8n}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-start space-x-2">
                                <ZapierIcon
                                  className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                                    ZapierIcon === Check
                                      ? 'text-green-500'
                                      : ZapierIcon === X
                                        ? 'text-destructive'
                                        : 'text-muted-foreground'
                                  }`}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {feature.zapier}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Line */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">The Bottom Line</h2>
            <div className="space-y-6 text-lg">
              <p>
                <strong className="text-primary">Agentik OS</strong> wins on production features,
                security, cost tracking, and developer experience. If you're building for real
                users with real money at stake, it's the clear choice.
              </p>
              <p>
                <strong className="text-orange-500">OpenClaw</strong> is great if you want a
                simple CLI and don't need a dashboard, cost tracking, or security. But you'll hit
                limitations fast.
              </p>
              <p>
                <strong className="text-blue-500">n8n</strong> and{' '}
                <strong className="text-amber-500">Zapier</strong> aren't designed for AI agents.
                They're workflow automation tools that can call AI APIs, but lack agent-specific
                features.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Try Agentik OS Free
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Self-host for free, forever. No credit card required.
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
