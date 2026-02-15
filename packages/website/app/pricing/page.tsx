import { Metadata } from 'next'
import Link from 'next/link'
import { Check, X, Download, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing - Agentik OS',
  description:
    'Simple, transparent pricing for Agentik OS. Self-host for free, forever. Cloud hosting and enterprise support available.',
}

export default function PricingPage() {
  const plans = [
    {
      name: 'Self-Hosted',
      price: 'Free',
      period: 'forever',
      description: 'Everything you need to run AI agents on your infrastructure',
      cta: 'Download & Install',
      ctaHref: '/download',
      popular: false,
      features: [
        { name: 'Unlimited agents', included: true },
        { name: 'All OS modes (9)', included: true },
        { name: 'All AI models (Claude, GPT, Gemini, Ollama)', included: true },
        { name: 'Marketplace skills (250+)', included: true },
        { name: 'Cost tracking', included: true },
        { name: 'Multi-model router', included: true },
        { name: 'WASM sandbox', included: true },
        { name: 'Real-time dashboard', included: true },
        { name: 'CLI (panda)', included: true },
        { name: 'MIT licensed', included: true },
        { name: 'Community support', included: true },
        { name: 'Cloud hosting', included: false },
        { name: 'SSO / RBAC', included: false },
        { name: 'SLA', included: false },
        { name: 'Priority support', included: false },
      ],
    },
    {
      name: 'Cloud',
      price: '$49',
      period: 'per month',
      description: 'We host it, you use it. Zero DevOps required.',
      cta: 'Start Free Trial',
      ctaHref: 'https://dashboard.agentik-os.com/signup',
      popular: true,
      features: [
        { name: 'Everything in Self-Hosted', included: true },
        { name: 'Managed hosting', included: true },
        { name: 'Auto-scaling', included: true },
        { name: 'Automatic backups', included: true },
        { name: 'Global CDN', included: true },
        { name: 'SSL certificates', included: true },
        { name: 'Monitoring & alerts', included: true },
        { name: '99.9% uptime SLA', included: true },
        { name: 'Email support', included: true },
        { name: 'Unlimited users (up to 10)', included: true },
        { name: 'SSO integration', included: false },
        { name: 'RBAC', included: false },
        { name: 'Audit logs', included: false },
        { name: 'Dedicated support', included: false },
        { name: 'Custom integrations', included: false },
      ],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact sales',
      description: 'For teams that need advanced security, compliance, and support',
      cta: 'Contact Sales',
      ctaHref: 'mailto:sales@agentik-os.com',
      popular: false,
      features: [
        { name: 'Everything in Cloud', included: true },
        { name: 'SSO (SAML, OAuth)', included: true },
        { name: 'RBAC & permissions', included: true },
        { name: 'Audit logs', included: true },
        { name: 'Air-gapped deployment', included: true },
        { name: 'Custom integrations', included: true },
        { name: '99.99% uptime SLA', included: true },
        { name: 'Dedicated support engineer', included: true },
        { name: 'Training & onboarding', included: true },
        { name: 'Unlimited users', included: true },
        { name: 'Priority feature requests', included: true },
        { name: 'Legal review', included: true },
        { name: 'SOC2 / GDPR compliant', included: true },
        { name: 'Dedicated Slack channel', included: true },
        { name: 'Custom contract terms', included: true },
      ],
    },
  ]

  const faqs = [
    {
      question: 'Is the self-hosted version really free?',
      answer:
        'Yes! 100% free, 100% open source, 100% MIT licensed. No feature gates, no time limits, no credit card required. Fork it, modify it, run it anywhere.',
    },
    {
      question: 'What AI costs do I need to pay?',
      answer:
        'You bring your own API keys (Claude, OpenAI, Google). We never mark up AI costs. The multi-model router helps you save 60% by using the cheapest model that works.',
    },
    {
      question: 'Can I try Cloud before paying?',
      answer:
        'Yes! 14-day free trial with no credit card required. Cancel anytime. If you decide to self-host instead, your agents and data export easily.',
    },
    {
      question: 'How does pricing compare to OpenClaw?',
      answer:
        "OpenClaw is 100% free (CLI only). We're also 100% free for self-hosting, but offer managed cloud hosting and enterprise features for teams that want them.",
    },
    {
      question: 'What happens if I exceed Cloud limits?',
      answer:
        'Cloud plan includes 10 users. Need more? Upgrade to Enterprise or add $10/user/month. Unlimited agents, skills, and integrations on all plans.',
    },
    {
      question: 'Can I switch between plans?',
      answer:
        'Absolutely! Upgrade or downgrade anytime. Self-host → Cloud migration is seamless (we provide migration scripts). Cloud → Self-host exports your data in standard formats.',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Self-host for free, forever. Or let us handle the hosting.
              <br />
              No surprises, no hidden fees.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-card border rounded-lg p-8 ${
                  plan.popular
                    ? 'border-primary shadow-lg shadow-primary/20 scale-105'
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground ml-2">/ {plan.period}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <Link
                  href={plan.ctaHref}
                  className={`block w-full text-center px-6 py-3 rounded-lg font-medium transition-all mb-6 ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="inline-block ml-2 h-4 w-4" />
                </Link>

                <div className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-start space-x-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          feature.included ? 'text-foreground' : 'text-muted-foreground'
                        }
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-card border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Start building with AI agents today
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/download"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
              >
                <Download className="mr-2 h-5 w-5" />
                Download & Self-Host
              </Link>
              <Link
                href="https://dashboard.agentik-os.com/signup"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-all"
              >
                Start Cloud Trial
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card required • 100% Open Source • MIT License
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
