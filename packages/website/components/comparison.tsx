import { Check, X } from 'lucide-react'

export function Comparison() {
  const comparisons = [
    {
      feature: 'Supported AI Models',
      openclaw: 'Claude only (Opus, Sonnet, Haiku)',
      agentik: 'Claude, GPT-4o, o1, Gemini, Ollama, custom',
      winner: 'agentik',
    },
    {
      feature: 'Dashboard UI',
      openclaw: 'None (CLI only)',
      agentik: 'Beautiful Next.js 16 dashboard',
      winner: 'agentik',
    },
    {
      feature: 'Cost Tracking',
      openclaw: 'None',
      agentik: 'Per-message breakdown with optimization',
      winner: 'agentik',
    },
    {
      feature: 'Budget Controls',
      openclaw: 'None',
      agentik: 'Daily/monthly caps with alerts',
      winner: 'agentik',
    },
    {
      feature: 'Security',
      openclaw: 'Basic (341 malicious skills uploaded)',
      agentik: 'Multi-layer: WASM + gVisor + Kata',
      winner: 'agentik',
    },
    {
      feature: 'Agent Modes',
      openclaw: 'One-size-fits-all',
      agentik: '9 OS modes (Human, Business, Dev...)',
      winner: 'agentik',
    },
    {
      feature: 'Real-Time Updates',
      openclaw: 'Poll logs manually',
      agentik: 'WebSocket live updates',
      winner: 'agentik',
    },
    {
      feature: 'Time Travel Debug',
      openclaw: 'None',
      agentik: 'Replay with different models',
      winner: 'agentik',
    },
    {
      feature: 'Agent Dreams',
      openclaw: 'None',
      agentik: 'Autonomous night mode with reports',
      winner: 'agentik',
    },
    {
      feature: 'Enterprise Features',
      openclaw: 'None',
      agentik: 'SSO, RBAC, audit logs, air-gapped',
      winner: 'agentik',
    },
    {
      feature: 'GitHub Stars',
      openclaw: '191K+ (first mover)',
      agentik: 'Coming soon (better product)',
      winner: 'openclaw',
    },
    {
      feature: 'License',
      openclaw: 'MIT',
      agentik: 'MIT',
      winner: 'tie',
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Agentik OS vs OpenClaw
          </h2>
          <p className="text-lg text-muted-foreground">
            OpenClaw opened the door. We built the entire house.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-card border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 font-semibold text-sm">
              <div>Feature</div>
              <div className="text-center">OpenClaw</div>
              <div className="text-center text-primary">Agentik OS</div>
            </div>

            {/* Rows */}
            <div className="divide-y">
              {comparisons.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 p-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="font-medium text-sm">{item.feature}</div>
                  <div className="text-center text-sm text-muted-foreground">
                    {item.winner === 'openclaw' ? (
                      <Check className="inline h-4 w-4 text-green-500 mr-1" />
                    ) : item.winner === 'tie' ? (
                      <Check className="inline h-4 w-4 text-muted-foreground mr-1" />
                    ) : (
                      <X className="inline h-4 w-4 text-destructive mr-1" />
                    )}
                    {item.openclaw}
                  </div>
                  <div className="text-center text-sm">
                    {item.winner === 'agentik' ? (
                      <Check className="inline h-4 w-4 text-primary mr-1" />
                    ) : item.winner === 'tie' ? (
                      <Check className="inline h-4 w-4 text-muted-foreground mr-1" />
                    ) : (
                      <X className="inline h-4 w-4 text-destructive mr-1" />
                    )}
                    <span className="font-medium">{item.agentik}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-8">
            <a
              href="/comparison"
              className="inline-flex items-center text-primary hover:underline"
            >
              View detailed comparison
              <span className="ml-2">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
