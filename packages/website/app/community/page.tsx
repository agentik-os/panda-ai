import { Metadata } from 'next'
import {
  MessageSquare,
  Github,
  Twitter,
  Youtube,
  BookOpen,
  Users,
  Calendar,
  Trophy,
  Star,
  Heart,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Community - Agentik OS',
  description:
    'Join the Agentik OS community. Connect with developers, contribute to open source, and shape the future of AI agents.',
}

export default function CommunityPage() {
  const platforms = [
    {
      icon: MessageSquare,
      name: 'Discord',
      description: 'Join 5,000+ developers building with AI agents',
      members: '5K+ members',
      activity: 'Active 24/7',
      link: 'https://discord.gg/agentik-os',
      cta: 'Join Discord',
      color: 'from-[#5865F2] to-[#7289DA]',
    },
    {
      icon: Github,
      name: 'GitHub',
      description: 'Contribute to the codebase, report issues, and track roadmap',
      members: '191K+ stars',
      activity: '50+ contributors',
      link: 'https://github.com/agentik-os/agentik-os',
      cta: 'Star on GitHub',
      color: 'from-[#24292e] to-[#57606a]',
    },
    {
      icon: Twitter,
      name: 'Twitter/X',
      description: 'Product updates, tips, and community highlights',
      members: '10K+ followers',
      activity: 'Daily updates',
      link: 'https://twitter.com/agentikos',
      cta: 'Follow on Twitter',
      color: 'from-[#1DA1F2] to-[#0077B5]',
    },
    {
      icon: Youtube,
      name: 'YouTube',
      description: 'Tutorials, demos, and deep dives',
      members: '2K+ subscribers',
      activity: 'Weekly videos',
      link: 'https://youtube.com/@agentikos',
      cta: 'Subscribe on YouTube',
      color: 'from-[#FF0000] to-[#CC0000]',
    },
  ]

  const ways = [
    {
      icon: BookOpen,
      title: 'Write Documentation',
      description:
        'Help us improve docs, write tutorials, and create examples. Great first contribution!',
    },
    {
      icon: Github,
      title: 'Contribute Code',
      description:
        'Pick up a "good first issue" or propose a new feature. All PRs are welcome.',
    },
    {
      icon: Users,
      title: 'Help Others',
      description:
        'Answer questions in Discord, share your solutions, and be an active community member.',
    },
    {
      icon: Star,
      title: 'Share Your Work',
      description:
        'Built something cool? Share it in #showcase. We love seeing what you create.',
    },
    {
      icon: Trophy,
      title: 'Join Hackathons',
      description:
        'Monthly hackathons with prizes. Build skills, win swag, and ship features.',
    },
    {
      icon: Heart,
      title: 'Sponsor the Project',
      description:
        'GitHub Sponsors helps us pay maintainers and fund infrastructure. Every dollar helps.',
    },
  ]

  const events = [
    {
      title: 'Weekly Office Hours',
      time: 'Every Friday, 3pm UTC',
      description:
        'Ask the core team anything. Get help debugging, discuss feature ideas, or just hang out.',
    },
    {
      title: 'Monthly Hackathon',
      time: 'First weekend of each month',
      description:
        'Build something with Agentik OS. Top 3 submissions win prizes ($500/$300/$200).',
    },
    {
      title: 'Quarterly Roadmap Review',
      time: 'Every 3 months',
      description:
        'Shape the future of Agentik OS. Vote on features, discuss priorities, and meet the team.',
    },
  ]

  const stats = [
    { label: 'Discord Members', value: '5,000+' },
    { label: 'GitHub Stars', value: '191K+' },
    { label: 'Contributors', value: '50+' },
    { label: 'Countries', value: '80+' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Join the{' '}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Agentik OS Community
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Connect with thousands of developers building the future of AI agents.
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

      {/* Platforms */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Where We Hang Out</h2>
            <p className="text-lg text-muted-foreground">
              Choose your platform. We're active on all of them.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {platforms.map((platform, index) => {
              const Icon = platform.icon
              return (
                <div key={index} className="group bg-card border rounded-lg p-8 hover:shadow-lg transition-all">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1">{platform.name}</h3>
                      <p className="text-sm text-muted-foreground">{platform.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div className="text-sm text-muted-foreground">{platform.members}</div>
                    <div className="text-sm text-muted-foreground">{platform.activity}</div>
                  </div>

                  <a
                    href={platform.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium"
                  >
                    {platform.cta}
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Ways to Contribute */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ways to Contribute</h2>
            <p className="text-lg text-muted-foreground">
              Everyone can contribute. Pick what excites you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {ways.map((way, index) => {
              const Icon = way.icon
              return (
                <div key={index} className="bg-card border rounded-lg p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{way.title}</h3>
                  <p className="text-sm text-muted-foreground">{way.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Community Events</h2>
            <p className="text-lg text-muted-foreground">
              Regular events to connect, learn, and ship together.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {events.map((event, index) => (
              <div key={index} className="bg-card border rounded-lg p-6">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 mb-4">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                <div className="text-sm text-muted-foreground mb-3">{event.time}</div>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code of Conduct */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border rounded-lg p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-6">Code of Conduct</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Be respectful.</strong> We're all here to
                  learn and build. Treat everyone with kindness.
                </p>
                <p>
                  <strong className="text-foreground">Be helpful.</strong> If someone asks a
                  question you know the answer to, share it.
                </p>
                <p>
                  <strong className="text-foreground">Be patient.</strong> Not everyone has the
                  same experience level. We were all beginners once.
                </p>
                <p>
                  <strong className="text-foreground">Be constructive.</strong> Criticism is
                  welcome, but make it actionable and kind.
                </p>
                <p>
                  <strong className="text-foreground">Zero tolerance.</strong> Harassment,
                  hate speech, or spam results in an immediate ban.
                </p>
              </div>
              <div className="mt-8">
                <a
                  href="https://github.com/agentik-os/agentik-os/blob/main/CODE_OF_CONDUCT.md"
                  className="text-primary hover:underline"
                >
                  Read full Code of Conduct →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Ready to Get Involved?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Join Discord to connect with the community, or star us on GitHub to stay updated.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://discord.gg/agentik-os"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Join Discord
              </a>
              <a
                href="https://github.com/agentik-os/agentik-os"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-all"
              >
                <Github className="mr-2 h-5 w-5" />
                Star on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
