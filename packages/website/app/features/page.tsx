import { Metadata } from 'next'
import {
  BarChart3,
  Network,
  Lock,
  Brain,
  Users,
  Terminal,
  Boxes,
  Workflow,
  MessageSquare,
  Moon,
  Zap,
  GitBranch,
  DollarSign,
  Shield,
  Sparkles,
  Clock,
  Database,
  FileCode,
  Search,
  Settings,
  Target,
  TrendingUp,
  Layers,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Features - Agentik OS',
  description:
    'Explore the complete feature set of Agentik OS - the most advanced AI Agent Operating System with multi-model routing, cost tracking, security, and more.',
}

export default function FeaturesPage() {
  const featureCategories = [
    {
      category: 'Core Platform',
      icon: Sparkles,
      features: [
        {
          icon: Brain,
          title: 'Multi-Model Router',
          description:
            'Automatically route requests to Claude, GPT-4o, o1, Gemini, or Ollama based on complexity, cost, and performance. Smart fallback on errors.',
          benefits: ['Save 60% on AI costs', 'Best model for each task', 'Zero downtime'],
        },
        {
          icon: Terminal,
          title: 'Powerful CLI - panda',
          description:
            'Complete command-line interface for agent management, chat, logs, deployment, and skill development. Git-like workflow for AI agents.',
          benefits: ['Developer-friendly', 'CI/CD integration', 'Scriptable automation'],
        },
        {
          icon: Boxes,
          title: '9 OS Modes',
          description:
            'Pre-built operating modes: Human, Business, Dev, Marketing, Sales, Finance, Learning, Design, Ask. Optimized prompts and toolsets for each context.',
          benefits: ['Task-optimized', 'No prompt engineering', 'Instant expertise'],
        },
        {
          icon: MessageSquare,
          title: '250+ Integrations',
          description:
            'Connect to GitHub, Gmail, Slack, Notion, Stripe, Google Calendar, and 250+ more via MCP protocol. Universal tool calling.',
          benefits: ['Work anywhere', 'No API wrappers', 'Extensible'],
        },
      ],
    },
    {
      category: 'Cost & Performance',
      icon: DollarSign,
      features: [
        {
          icon: BarChart3,
          title: 'Cost Dashboard',
          description:
            'Real-time cost tracking with breakdown by model, agent, skill, and user. Per-message granularity with optimization suggestions.',
          benefits: ['Save $100+/month', 'Budget alerts', 'Cost forecasting'],
        },
        {
          icon: TrendingUp,
          title: 'Budget Controls',
          description:
            'Set daily, monthly, or per-agent limits. Automatic alerts at 50%, 75%, 90%. Hard caps to prevent overspending.',
          benefits: ['No surprise bills', 'Team limits', 'Auto-shutdown'],
        },
        {
          icon: GitBranch,
          title: 'Time Travel Debug',
          description:
            'Replay any conversation with a different model. Find cheaper alternatives. Debug unexpected responses. Compare quality vs cost.',
          benefits: ['Optimize retroactively', 'Quality comparison', 'Cost-effective debugging'],
        },
        {
          icon: Zap,
          title: 'Performance Monitoring',
          description:
            'Track latency, throughput, error rates, and model performance. Real-time metrics with historical trends and alerts.',
          benefits: ['SLA compliance', 'Proactive fixes', 'Capacity planning'],
        },
      ],
    },
    {
      category: 'Security & Compliance',
      icon: Shield,
      features: [
        {
          icon: Lock,
          title: 'Multi-Layer Sandbox',
          description:
            'WASM + gVisor + Kata Containers. Every skill runs isolated. Security scanning on all marketplace skills. Zero trust architecture.',
          benefits: ['No ClawHavoc disasters', '341 malicious skills blocked', 'Enterprise-grade'],
        },
        {
          icon: Search,
          title: 'Security Scanning',
          description:
            'Automatic scanning for malicious code, secrets, vulnerabilities. CodeQL, Trivy, TruffleHog integration. Reject before execution.',
          benefits: ['Sleep well', 'Compliance ready', 'Audit trail'],
        },
        {
          icon: Users,
          title: 'Multi-Tenancy',
          description:
            'Complete workspace isolation with SSO, RBAC, audit logs. Teams, organizations, and enterprise features built-in.',
          benefits: ['Team collaboration', 'Access control', 'Compliance logs'],
        },
        {
          icon: Database,
          title: 'Air-Gapped Deployment',
          description:
            'Run completely offline with Ollama. No data leaves your infrastructure. Perfect for regulated industries.',
          benefits: ['GDPR compliant', 'SOC2 ready', 'On-premise'],
        },
      ],
    },
    {
      category: 'Developer Experience',
      icon: FileCode,
      features: [
        {
          icon: Settings,
          title: 'Skill SDK',
          description:
            'TypeScript SDK for building custom skills. Hot reload, testing framework, publishing CLI. Marketplace-ready in minutes.',
          benefits: ['Fast development', 'Type safety', 'Auto documentation'],
        },
        {
          icon: Workflow,
          title: 'Automation Engine',
          description:
            'Natural language automation: "Every Monday at 9am, send me a summary of GitHub issues". Cron-like power without the syntax.',
          benefits: ['No coding needed', 'Flexible scheduling', 'Human-readable'],
        },
        {
          icon: Network,
          title: 'WebSocket Real-Time',
          description:
            'Streaming responses, live cost updates, agent status changes. Built on Convex for zero-latency reactivity.',
          benefits: ['Instant feedback', 'Live collaboration', 'Responsive UI'],
        },
        {
          icon: FileCode,
          title: 'Open Source',
          description:
            '100% MIT licensed. Fork, modify, self-host. No vendor lock-in. Active community contributions.',
          benefits: ['Full control', 'No limitations', 'Forever free'],
        },
      ],
    },
    {
      category: 'Unique Features',
      icon: Sparkles,
      features: [
        {
          icon: Moon,
          title: 'Agent Dreams',
          description:
            'While you sleep, agents research, draft, and review autonomously. Wake up to a morning report on Telegram at 7am.',
          benefits: ['24/7 productivity', 'Autonomous research', 'Smart summaries'],
        },
        {
          icon: Layers,
          title: 'Multi-Agent Consensus',
          description:
            'Run the same prompt with 3-5 different models. Automatic voting and quality scoring. Best answer wins.',
          benefits: ['Higher accuracy', 'Bias reduction', 'Confidence scores'],
        },
        {
          icon: Target,
          title: 'OS Mode Switching',
          description:
            'One-click context switching. Go from "Dev Mode" to "Marketing Mode" instantly. Agents adapt their behavior and toolset.',
          benefits: ['No re-prompting', 'Context-aware', 'Seamless workflow'],
        },
        {
          icon: Clock,
          title: 'Memory Graph',
          description:
            'Long-term memory with semantic search. Agents remember conversations, files, and decisions across sessions. Neo4j-powered knowledge graph.',
          benefits: ['Context retention', 'Smart retrieval', 'Learning over time'],
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Everything OpenClaw has,
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                plus 50+ features that matter
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Built for production. Designed for scale. Loved by developers.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">5</div>
              <div className="text-sm text-muted-foreground">AI Models</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">250+</div>
              <div className="text-sm text-muted-foreground">Integrations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">9</div>
              <div className="text-sm text-muted-foreground">OS Modes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Open Source</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Categories */}
      {featureCategories.map((category, catIndex) => {
        const CategoryIcon = category.icon
        return (
          <section
            key={catIndex}
            className={catIndex % 2 === 0 ? 'py-20 lg:py-32' : 'py-20 lg:py-32 bg-muted/30'}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              {/* Category Header */}
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-lg bg-primary/10 mb-4">
                  <CategoryIcon className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">{category.category}</h2>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {category.features.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div
                      key={index}
                      className="group bg-card border rounded-lg p-8 hover:border-primary/50 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                          <p className="text-muted-foreground mb-4">{feature.description}</p>
                          <div className="space-y-2">
                            {feature.benefits.map((benefit, bIndex) => (
                              <div key={bIndex} className="flex items-center space-x-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <span className="text-sm text-primary font-medium">
                                  {benefit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })}

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Ready to experience the difference?
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
