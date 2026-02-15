import { Metadata } from 'next'
import Link from 'next/link'
import {
  Terminal,
  Zap,
  Code,
  MessageSquare,
  DollarSign,
  Play,
  ArrowRight,
  Sparkles,
  Brain,
  ShoppingCart,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Interactive Demo - Agentik OS',
  description:
    'Try Agentik OS live! Chat with an AI agent, execute skills, and see real-time cost tracking in action.',
}

export default function DemoPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-lg bg-primary/10 mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Try{' '}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Agentik OS
              </span>{' '}
              Live
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8">
              Experience the AI Agent Operating System in action. Chat with an agent, execute
              skills, and see real-time cost tracking.
            </p>
            <div className="inline-flex items-center bg-background/50 backdrop-blur-sm border rounded-lg px-6 py-3 text-sm text-muted-foreground">
              <Terminal className="h-4 w-4 mr-2" />
              No installation required • Fully interactive • Real-time demo
            </div>
          </div>
        </div>
      </section>

      {/* Demo Selector */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Demo</h2>
            <p className="text-lg text-muted-foreground">
              Select a feature to see it in action
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Chat Demo */}
            <div className="group bg-card border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer hover:border-primary/50">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Agent Chat</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Chat with an AI agent powered by Claude, GPT-4, or Gemini. See intelligent
                routing in action.
              </p>
              <div className="flex items-center text-primary font-medium">
                Try it live
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Skills Demo */}
            <div className="group bg-card border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer hover:border-primary/50">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Skill Execution</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Watch an agent execute skills: web search, file operations, API calls, and more.
              </p>
              <div className="flex items-center text-primary font-medium">
                See skills in action
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Cost Tracking Demo */}
            <div className="group bg-card border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer hover:border-primary/50">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Cost Tracking</h3>
              <p className="text-sm text-muted-foreground mb-4">
                See real-time cost tracking with per-request breakdown and budget alerts.
              </p>
              <div className="flex items-center text-primary font-medium">
                View dashboard
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Demo Preview */}
              <div className="order-2 lg:order-1">
                <div className="bg-card border rounded-lg overflow-hidden shadow-lg">
                  <div className="bg-muted px-4 py-3 flex items-center space-x-2 border-b">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <div className="ml-4 text-sm font-mono text-muted-foreground">
                      agent-chat-demo
                    </div>
                  </div>
                  <div className="p-6 font-mono text-sm space-y-3">
                    <div className="flex items-start space-x-2">
                      <span className="text-primary">$</span>
                      <span className="text-foreground">
                        panda chat --agent web-researcher
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      🤖 Agent: web-researcher (Claude Sonnet 4.5)
                    </div>
                    <div className="text-muted-foreground">Model Router: Auto-selecting...</div>
                    <div className="text-primary">✓ Ready! Ask me anything.</div>
                    <div className="flex items-start space-x-2 mt-4">
                      <span className="text-purple-500">&gt;</span>
                      <span className="text-foreground">
                        What are the latest features in Next.js 16?
                      </span>
                    </div>
                    <div className="bg-muted/50 rounded p-3 text-muted-foreground">
                      🔍 Executing skill: web_search("Next.js 16 features")
                      <br />
                      💰 Cost: $0.0023 | Model: GPT-4o-mini
                      <br />
                      <br />
                      Next.js 16 introduces several powerful features:
                      <br />
                      • Cache Components for instant page loads
                      <br />
                      • Built-in proxy.ts for API protection
                      <br />• React Compiler integration...
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Features */}
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  See It In{' '}
                  <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Action
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  This is a real agent running on Agentik OS. Watch as it executes skills, tracks
                  costs, and delivers intelligent responses.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Multi-Model Routing</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically routes to GPT-4o-mini for simple queries, Claude Opus for
                        complex ones. Save 72% on costs.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Skill Execution</div>
                      <div className="text-sm text-muted-foreground">
                        200+ pre-built skills from the marketplace. Web search, file ops, API
                        calls, and more.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Real-Time Cost Tracking</div>
                      <div className="text-sm text-muted-foreground">
                        See exactly what each request costs. Set budgets, get alerts, export
                        reports.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Start Building in{' '}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Minutes
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started with Agentik OS in 3 simple steps
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Step 1 */}
            <div className="bg-card border rounded-lg p-8">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold">Install Agentik OS</h3>
              </div>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground"># Docker (recommended)</span>
                </div>
                <code className="text-foreground">
                  docker run -p 3000:3000 agentikos/agentik-os
                </code>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-card border rounded-lg p-8">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold">Create Your First Agent</h3>
              </div>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-2">
                <div className="text-muted-foreground"># Initialize project</div>
                <code className="text-foreground block">panda init my-agent</code>
                <div className="text-muted-foreground mt-2"># Create agent</div>
                <code className="text-foreground block">
                  panda agent create web-researcher
                </code>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-card border rounded-lg p-8">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold">Start Chatting</h3>
              </div>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-2">
                <div className="text-muted-foreground"># Chat with your agent</div>
                <code className="text-foreground block">panda chat --agent web-researcher</code>
                <div className="text-muted-foreground mt-2"># Or use the dashboard</div>
                <code className="text-foreground block">open http://localhost:3000</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Explore the{' '}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Skill Marketplace
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              200+ pre-built skills ready to install. Add superpowers to your agents.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: 'Web Search',
                description: 'Search the web and get real-time information',
                installs: '50K+',
                icon: MessageSquare,
              },
              {
                name: 'File Operations',
                description: 'Read, write, and manipulate files',
                installs: '40K+',
                icon: Code,
              },
              {
                name: 'Google Calendar',
                description: 'Schedule events and manage calendars',
                installs: '35K+',
                icon: Terminal,
              },
              {
                name: 'Email Sender',
                description: 'Send emails via Gmail, SendGrid, or SMTP',
                installs: '30K+',
                icon: MessageSquare,
              },
              {
                name: 'Database Query',
                description: 'Query PostgreSQL, MySQL, and MongoDB',
                installs: '28K+',
                icon: Code,
              },
              {
                name: 'Stripe Payments',
                description: 'Process payments and manage subscriptions',
                installs: '25K+',
                icon: ShoppingCart,
              },
            ].map((skill, index) => {
              const Icon = skill.icon
              return (
                <div key={index} className="bg-card border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-xs text-muted-foreground">{skill.installs} installs</div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{skill.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{skill.description}</p>
                  <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-medium">
                    Install Skill
                  </button>
                </div>
              )
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/features"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-all"
            >
              Browse All 200+ Skills
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Ready to Build Your Agent?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Join 10,000+ developers building AI agents with Agentik OS
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/download"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
              >
                <Play className="mr-2 h-5 w-5" />
                Get Started Free
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-all"
              >
                Read Documentation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Self-hosted. Open source. No credit card required.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
