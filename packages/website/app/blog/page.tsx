import { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, Clock, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog - Agentik OS',
  description:
    'Latest updates, tutorials, and insights from the Agentik OS team. Learn how to build production AI agents.',
}

// This would normally come from a CMS or file system
// For now, we'll use static data
const posts = [
  {
    title: 'Introducing Agentik OS: The AI Agent Operating System',
    slug: 'introducing-agentik-os',
    excerpt:
      'OpenClaw proved demand for an AI Agent OS. We built the production-ready version with multi-model routing, cost tracking, and enterprise security.',
    date: '2027-01-15',
    readTime: '8 min read',
    category: 'Announcement',
    author: {
      name: 'Agentik Team',
      avatar: '👥',
    },
  },
  {
    title: 'How We Saved $8.6K/Month with Multi-Model Routing',
    slug: 'multi-model-routing-cost-savings',
    excerpt:
      'Case study: How TechCorp reduced their AI costs by 72% using Agentik OS intelligent model router. From $12K to $3.4K monthly.',
    date: '2027-01-18',
    readTime: '6 min read',
    category: 'Case Study',
    author: {
      name: 'Sarah Chen',
      avatar: '👩‍💻',
    },
  },
  {
    title: 'Building Your First AI Agent in 5 Minutes',
    slug: 'first-agent-tutorial',
    excerpt:
      'Step-by-step tutorial: Install Agentik OS, configure your first agent, add skills from the marketplace, and deploy to production.',
    date: '2027-01-20',
    readTime: '10 min read',
    category: 'Tutorial',
    author: {
      name: 'Marcus Johnson',
      avatar: '👨‍💻',
    },
  },
  {
    title: 'Agent Dreams: How We Built Autonomous Night Mode',
    slug: 'agent-dreams-architecture',
    excerpt:
      'Technical deep dive into Agent Dreams - our system that lets AI agents work autonomously while you sleep. Architecture, challenges, and learnings.',
    date: '2027-01-22',
    readTime: '12 min read',
    category: 'Technical',
    author: {
      name: 'Alex Rivera',
      avatar: '🧑‍💻',
    },
  },
  {
    title: 'The ClawHavoc Incident: Why Security Matters',
    slug: 'clawhavoc-security-lessons',
    excerpt:
      '341 malicious skills were uploaded to OpenClaw marketplace. What happened, what we learned, and how Agentik OS prevents this with multi-layer security.',
    date: '2027-01-25',
    readTime: '7 min read',
    category: 'Security',
    author: {
      name: 'Priya Sharma',
      avatar: '👩‍🔧',
    },
  },
  {
    title: "Roadmap 2027: What's Coming to Agentik OS",
    slug: 'roadmap-2027',
    excerpt:
      'Our plans for 2027: Knowledge Graph, Voice Agents, Visual Workflows, and more. Plus, how we prioritize features based on community feedback.',
    date: '2027-01-27',
    readTime: '5 min read',
    category: 'Roadmap',
    author: {
      name: 'Agentik Team',
      avatar: '👥',
    },
  },
]

const categories = ['All', 'Announcement', 'Tutorial', 'Case Study', 'Technical', 'Security', 'Roadmap']

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              The{' '}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Agentik OS Blog
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Updates, tutorials, and insights on building production AI agents.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-background sticky top-0 z-10 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  index === 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-12">
            {posts.map((post, index) => (
              <article
                key={index}
                className="group bg-card border rounded-lg p-8 hover:border-primary/50 hover:shadow-lg transition-all"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {post.category}
                  </span>
                  <span className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(post.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {post.readTime}
                  </span>
                </div>

                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                </Link>

                <p className="text-muted-foreground mb-6">{post.excerpt}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                      {post.author.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{post.author.name}</div>
                    </div>
                  </div>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-primary hover:underline font-medium"
                  >
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-all">
              Load More Posts
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold">Stay Updated</h2>
            <p className="text-lg text-muted-foreground">
              Get the latest Agentik OS updates, tutorials, and insights delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="w-full sm:w-auto whitespace-nowrap px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium">
                Subscribe
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              No spam. Unsubscribe anytime. We respect your privacy.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
