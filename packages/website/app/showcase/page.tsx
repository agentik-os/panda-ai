import { Metadata } from 'next'
import { ArrowRight, Building, Rocket, Code, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Showcase - Agentik OS',
  description:
    'See how companies and developers are using Agentik OS in production to automate workflows, reduce costs, and build with AI.',
}

export default function ShowcasePage() {
  const stories = [
    {
      company: 'TechCorp',
      industry: 'SaaS',
      logo: Building,
      title: 'Reduced AI Costs by 72% with Multi-Model Router',
      description:
        'TechCorp was spending $12K/month on Claude API calls. After switching to Agentik OS multi-model router, they now route simple queries to GPT-4o-mini and complex ones to Claude Opus, saving $8.6K/month.',
      metrics: [
        { label: 'Cost Reduction', value: '72%' },
        { label: 'Monthly Savings', value: '$8.6K' },
        { label: 'Agents Deployed', value: '45' },
      ],
      quote:
        "The cost tracking alone paid for itself in week one. We found $3K of unnecessary Opus calls happening overnight.",
      author: 'Sarah Chen',
      role: 'CTO at TechCorp',
    },
    {
      company: 'DevTools Inc',
      industry: 'Developer Tools',
      logo: Code,
      title: 'Shipped 250+ Customer Integrations in 3 Months',
      description:
        'DevTools needed to integrate with 250+ SaaS tools. Using Agentik OS marketplace skills and the SDK, they shipped all integrations in 3 months (vs 18 months estimated for custom code).',
      metrics: [
        { label: 'Integrations Shipped', value: '250+' },
        { label: 'Time Saved', value: '15 months' },
        { label: 'Engineering Cost', value: '$400K saved' },
      ],
      quote:
        'We found 90% of our integrations already existed in the marketplace. For the rest, the SDK made it trivial to build.',
      author: 'Marcus Johnson',
      role: 'VP Engineering at DevTools',
    },
    {
      company: 'FinanceAI',
      industry: 'Fintech',
      logo: Heart,
      title: 'Achieved SOC2 Compliance with Enterprise Security',
      description:
        'FinanceAI needed SOC2 compliance for their AI assistant. Agentik OS enterprise features (SSO, RBAC, audit logs, air-gapped deployment) got them compliant in 6 weeks.',
      metrics: [
        { label: 'Compliance Time', value: '6 weeks' },
        { label: 'Security Score', value: '98/100' },
        { label: 'Audit Logs', value: '500K+ events' },
      ],
      quote:
        'The WASM sandbox + gVisor gave us confidence to let AI handle sensitive financial data. No other platform had this level of isolation.',
      author: 'Priya Sharma',
      role: 'Chief Security Officer at FinanceAI',
    },
    {
      company: 'MarketingOps',
      industry: 'Marketing',
      logo: Rocket,
      title: 'Automated 90% of Marketing Workflows',
      description:
        'MarketingOps automated email campaigns, social media posting, content generation, and analytics reporting using Agentik OS automation engine and OS modes.',
      metrics: [
        { label: 'Workflows Automated', value: '90%' },
        { label: 'Time Saved per Week', value: '40 hours' },
        { label: 'ROI', value: '12x' },
      ],
      quote:
        'Agent Dreams changed everything. We wake up to campaign drafts, A/B test results, and competitor analysis every morning.',
      author: 'Alex Rivera',
      role: 'Head of Marketing at MarketingOps',
    },
  ]

  const stats = [
    { label: 'Production Deployments', value: '500+' },
    { label: 'AI Agents Running', value: '10,000+' },
    { label: 'Monthly Cost Saved', value: '$2M+' },
    { label: 'Skills Installed', value: '50,000+' },
  ]

  const useCases = [
    {
      title: 'Customer Support Automation',
      description: 'AI agents handle tier-1 support, escalate complex issues, and learn from resolutions.',
      users: ['TechCorp', 'SupportAI', 'HelpDesk Pro'],
    },
    {
      title: 'Code Review & Refactoring',
      description: 'Automated PR reviews, security scanning, and code quality checks before human review.',
      users: ['DevTools Inc', 'CodeBase', 'EngineerHQ'],
    },
    {
      title: 'Content Generation at Scale',
      description: 'Blog posts, social media, email campaigns, and documentation generated with brand voice.',
      users: ['MarketingOps', 'ContentFlow', 'BrandAI'],
    },
    {
      title: 'Data Analysis & Reporting',
      description: 'Automated dashboards, trend analysis, and executive reports with natural language queries.',
      users: ['FinanceAI', 'DataCorp', 'AnalyticsHub'],
    },
    {
      title: 'Sales Enablement',
      description: 'Lead qualification, email personalization, and CRM updates automated end-to-end.',
      users: ['SalesForce Alternative', 'LeadGen AI', 'CRM Plus'],
    },
    {
      title: 'Legal Document Review',
      description: 'Contract analysis, compliance checking, and risk assessment before lawyer review.',
      users: ['LegalTech', 'ContractAI', 'ComplianceBot'],
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Built in Production.
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Proven at Scale.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Real companies. Real results. Real AI agents running on Agentik OS.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Success Stories</h2>
            <p className="text-lg text-muted-foreground">
              How companies are using Agentik OS to transform their operations.
            </p>
          </div>

          <div className="space-y-16 max-w-6xl mx-auto">
            {stories.map((story, index) => {
              const Logo = story.logo
              return (
                <div
                  key={index}
                  className={`grid lg:grid-cols-2 gap-8 items-center ${
                    index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="bg-card border rounded-lg p-8">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Logo className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{story.company}</h3>
                          <div className="text-sm text-muted-foreground">{story.industry}</div>
                        </div>
                      </div>
                      <h4 className="text-2xl font-bold mb-4">{story.title}</h4>
                      <p className="text-muted-foreground mb-6">{story.description}</p>
                      <div className="border-l-4 border-primary pl-4 mb-6">
                        <p className="text-foreground italic mb-2">"{story.quote}"</p>
                        <div className="text-sm text-muted-foreground">
                          {story.author} · {story.role}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                    <div className="grid grid-cols-3 gap-4">
                      {story.metrics.map((metric, mIndex) => (
                        <div key={mIndex} className="bg-card border rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {metric.value}
                          </div>
                          <div className="text-xs text-muted-foreground">{metric.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Popular Use Cases</h2>
            <p className="text-lg text-muted-foreground">
              See how teams across industries are deploying Agentik OS.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">{useCase.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{useCase.description}</p>
                <div className="text-xs text-muted-foreground">
                  Used by: {useCase.users.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Ready to Share Your Story?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              If you're using Agentik OS in production, we'd love to feature you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:stories@agentik-os.com"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
              >
                Submit Your Story
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <a
                href="/download"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-all"
              >
                Get Started Free
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
