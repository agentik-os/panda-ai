import {
  DollarSign,
  Brain,
  Shield,
  Moon,
  Zap,
  GitBranch,
} from 'lucide-react'

export function KillerFeatures() {
  const features = [
    {
      icon: DollarSign,
      title: 'Cost X-Ray',
      description:
        'See exactly what each AI message costs. Per-model breakdown, budget alerts, optimization suggestions.',
      highlight: 'Save $100+/month',
    },
    {
      icon: Brain,
      title: 'Multi-Model Router',
      description:
        'Claude, GPT-4o, o1, Gemini, Ollama. Auto-route to cheapest model that works. Fallback on errors.',
      highlight: 'Save 60% on costs',
    },
    {
      icon: Shield,
      title: 'Multi-Layer Sandbox',
      description:
        'WASM + gVisor + Kata Containers. Security scanning on all skills. No more ClawHavoc disasters.',
      highlight: '341 malicious skills blocked',
    },
    {
      icon: Moon,
      title: 'Agent Dreams',
      description:
        'While you sleep, your agents research, draft, review. Morning report on Telegram at 7am.',
      highlight: 'Autonomous night mode',
    },
    {
      icon: Zap,
      title: 'Real-Time Dashboard',
      description:
        'Beautiful Next.js dashboard with live WebSocket updates. Monitor agents, costs, memory graph.',
      highlight: 'OpenClaw has none',
    },
    {
      icon: GitBranch,
      title: 'Time Travel Debug',
      description:
        'Replay any conversation with a different model. Find cheaper options. Optimize costs.',
      highlight: 'Unique to Agentik OS',
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Features That Make People Say{' '}
            <span className="text-primary">"HOLY SHIT"</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Features that don't exist anywhere else. The stuff that makes the
            buzz.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group relative bg-card border rounded-lg p-6 hover:shadow-lg hover:shadow-primary/10 transition-all"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {feature.description}
                    </p>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {feature.highlight}
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
}
