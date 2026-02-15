export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-black">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐼</span>
            <span className="text-xl font-bold">Panda AI</span>
          </div>
          <a
            href="https://github.com/agentik-os/panda-ai"
            className="px-4 py-2 bg-black text-white hover:bg-gray-900"
            target="_blank"
          >
            GitHub
          </a>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-6 py-20">
          <h1 className="text-5xl font-bold mb-4">Multi-Model AI Platform</h1>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl">
            Beautiful, powerful, and extensible AI agent platform built with TypeScript.
            Claude, GPT, Gemini, Ollama support with a stunning web dashboard.
          </p>
          <div className="flex gap-4">
            <a
              href="https://github.com/agentik-os/panda-ai"
              className="px-6 py-3 bg-black text-white hover:bg-gray-900"
            >
              Get Started
            </a>
            <a
              href="#features"
              className="px-6 py-3 border border-black hover:bg-black hover:text-white"
            >
              Learn More
            </a>
          </div>
        </section>

        <section id="features" className="border-t border-black py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-12">Features</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-2">🧠 Multi-Model Support</h3>
                <p className="text-gray-700">Claude, GPT-5, Gemini, and Ollama with intelligent routing</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">🎨 Beautiful Dashboard</h3>
                <p className="text-gray-700">Modern Next.js 16 interface with real-time updates</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">💻 Powerful CLI</h3>
                <p className="text-gray-700">Full-featured command-line tool for power users</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">🔌 30+ Skills</h3>
                <p className="text-gray-700">Pre-built integrations for Slack, GitHub, Stripe, and more</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-black py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-8">Quick Start</h2>
            <div className="bg-black text-white p-6 rounded font-mono text-sm">
              <div className="text-gray-400"># Clone the repository</div>
              <div>git clone https://github.com/agentik-os/panda-ai.git</div>
              <div>cd panda-ai</div>
              <div className="mt-3 text-gray-400"># Install and build</div>
              <div>pnpm install && pnpm build</div>
              <div className="mt-3 text-gray-400"># Start the dashboard</div>
              <div>cd packages/dashboard && pnpm dev</div>
            </div>
          </div>
        </section>

        <section className="border-t border-black py-20 bg-black text-white">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-gray-400 mb-8">Build your first AI agent in under 15 minutes</p>
            <a
              href="https://github.com/agentik-os/panda-ai"
              className="inline-block px-8 py-3 bg-white text-black hover:bg-gray-200"
            >
              View on GitHub
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-800 bg-black text-white py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div>🐼 Panda AI</div>
          <div className="flex gap-6">
            <a href="https://github.com/agentik-os/panda-ai" className="hover:text-gray-400">GitHub</a>
            <a href="https://github.com/agentik-os/panda-ai/issues" className="hover:text-gray-400">Issues</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
