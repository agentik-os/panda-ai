# 🐼 Panda AI

**Multi-Model AI Platform with TypeScript**

A modular AI agent system built with modern TypeScript, supporting multiple AI providers and featuring a beautiful web dashboard.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.3-blue)](https://turbo.build/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

---

## ✨ Features

- 🧠 **Multi-Model Support** - Claude, GPT, Gemini, Ollama
- 🎨 **Web Dashboard** - Next.js 16 + shadcn/ui
- 💻 **CLI Tool** - `panda` command for power users
- 🔧 **Modular Architecture** - Turborepo monorepo with pnpm
- 🎯 **30+ Skills** - Pre-built integrations (Slack, GitHub, Stripe, etc.)
- 📊 **Cost Tracking** - Monitor AI usage and costs
- 🔒 **Security** - WASM sandboxing, RBAC, audit logs
- 🚀 **Enterprise Ready** - SSO, multi-tenancy, monitoring

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org/))
- **pnpm** 9+ (install: `npm install -g pnpm`)
- **API Keys** - At least one AI provider (Claude/OpenAI/Gemini)

### Installation

```bash
# Clone the repository
git clone https://github.com/agentik-os/panda-ai.git
cd panda-ai

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Verify everything works
pnpm type-check
pnpm test
```

That's it! 🎉

---

## 📦 Project Structure

```
panda-ai/
├── packages/
│   ├── runtime/          # Core AI agent runtime
│   ├── dashboard/        # Web UI (Next.js 16)
│   ├── cli/              # CLI tool (panda commands)
│   ├── sdk/              # Skill builder SDK
│   ├── shared/           # Shared types & utilities
│   └── modes/            # OS modes (Research, Code, etc.)
│
├── skills/               # 30+ pre-built skills
├── docs/                 # Documentation
├── tests/                # E2E tests
└── scripts/              # Build scripts
```

---

## 🎯 Usage

### CLI

```bash
# Initialize configuration
pnpm --filter @agentik-os/cli exec panda init

# Add your API key
pnpm --filter @agentik-os/cli exec panda config set anthropic.apiKey "sk-ant-..."

# Create an agent
pnpm --filter @agentik-os/cli exec panda agent create MyAgent \
  --model claude-sonnet-4-5 \
  --channels cli

# Start chatting
pnpm --filter @agentik-os/cli exec panda chat MyAgent
```

### Web Dashboard

```bash
# Terminal 1: Start Convex backend
cd packages/dashboard
npx convex dev

# Terminal 2: Start Next.js frontend
cd packages/dashboard
pnpm dev

# Open http://localhost:3000
```

---

## 🧪 Testing

```bash
# Type check (must pass with 0 errors)
pnpm type-check

# Run all tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Build everything
pnpm build
```

**Current Status:**
- ✅ TypeScript: 0 errors
- ✅ Build: All 33 packages compile
- ✅ Tests: Available

---

## 📚 Available Skills

Pre-built integrations for popular services:

**Communication:**
- Slack, Discord, Email, Twilio

**Development:**
- GitHub, Linear, Jira, E2B

**Productivity:**
- Notion, Airtable, Google Drive, Google Calendar

**Business:**
- Stripe, HubSpot, Salesforce

**Other:**
- Weather, News, Twitter, YouTube, Browserbase

And 20+ more!

---

## 🏗️ Architecture

Built with:

- **Frontend:** Next.js 16, React 19, shadcn/ui, Tailwind CSS
- **Backend:** Convex (real-time database + serverless)
- **Runtime:** TypeScript + Bun
- **Monorepo:** Turborepo + pnpm
- **Testing:** Vitest + Playwright
- **Monitoring:** Sentry + Prometheus

### Multi-Model Router

Automatically selects the optimal AI model based on task complexity:

```typescript
Simple tasks    → claude-haiku-4-5    (fast & cheap)
Medium tasks    → claude-sonnet-4-5   (balanced)
Complex tasks   → claude-opus-4-6     (powerful)
```

### 9-Stage Message Pipeline

Every message flows through:

1. **Normalize** - Validate input
2. **Route** - Determine agent
3. **Load Memory** - Retrieve context
4. **Model Select** - Choose AI model
5. **Tool Resolve** - Load required skills
6. **Execute** - Call AI with tools
7. **Save Memory** - Store conversation
8. **Track Cost** - Log usage
9. **Send Response** - Deliver to user

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Make changes (ensure `pnpm type-check` passes)
4. Run tests (`pnpm test`)
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing`)
7. Open a Pull Request

### Development Guidelines

- ✅ TypeScript strict mode (0 errors required)
- ✅ All tests must pass
- ✅ Follow existing code style (Prettier)
- ✅ Add tests for new features
- ✅ Update documentation

---

## 📜 License

Apache License 2.0 - See [LICENSE](LICENSE) for details.

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/agentik-os/panda-ai/issues)
- **Discussions:** [GitHub Discussions](https://github.com/agentik-os/panda-ai/discussions)

---

## 🙏 Acknowledgments

Built with modern tools:
- [Anthropic Claude](https://anthropic.com/)
- [OpenAI](https://openai.com/)
- [Next.js](https://nextjs.org/)
- [Convex](https://convex.dev/)
- [Turborepo](https://turbo.build/)
- [shadcn/ui](https://ui.shadcn.com/)

---

<div align="center">

**🐼 Built with TypeScript • Made for Developers**

⭐ Star us on GitHub!

</div>
