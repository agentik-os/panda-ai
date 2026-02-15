# Agentik OS - Code Examples

> **Copy-paste-ready code examples for common use cases**

All examples are production-tested and follow best practices.

---

## Quick Navigation

| Category | Examples | Description |
|----------|----------|-------------|
| **Basics** | 6 examples | Getting started, simple patterns |
| **Advanced** | 5 examples | Complex workflows, optimization |
| **Integrations** | 4 examples | External services, channels |
| **Production** | 4 examples | Deployment, monitoring, scaling |

---

## Basics

Simple, beginner-friendly examples to get started:

| Example | Description | Difficulty |
|---------|-------------|------------|
| [create-agent.ts](./basics/create-agent.ts) | Create and configure an agent | ⭐ Beginner |
| [send-message.ts](./basics/send-message.ts) | Send messages and get responses | ⭐ Beginner |
| [streaming.ts](./basics/streaming.ts) | Stream responses token-by-token | ⭐⭐ Intermediate |
| [skills.ts](./basics/skills.ts) | Use skills with agents | ⭐⭐ Intermediate |
| [os-modes.ts](./basics/os-modes.ts) | Switch between OS modes | ⭐ Beginner |
| [sessions.ts](./basics/sessions.ts) | Manage agent sessions | ⭐⭐ Intermediate |

---

## Advanced

Complex patterns for production applications:

| Example | Description | Difficulty |
|---------|-------------|------------|
| [consensus.ts](./advanced/consensus.ts) | Multi-agent consensus voting | ⭐⭐⭐ Advanced |
| [cost-tracking.ts](./advanced/cost-tracking.ts) | Track costs in real-time | ⭐⭐ Intermediate |
| [time-travel.ts](./advanced/time-travel.ts) | Debug with time-travel replay | ⭐⭐⭐ Advanced |
| [custom-skill.ts](./advanced/custom-skill.ts) | Build a custom skill from scratch | ⭐⭐⭐ Advanced |
| [error-handling.ts](./advanced/error-handling.ts) | Comprehensive error handling | ⭐⭐ Intermediate |

---

## Integrations

Connect Agentik OS to external services:

| Example | Description | Difficulty |
|---------|-------------|------------|
| [telegram-bot.ts](./integrations/telegram-bot.ts) | Full Telegram bot integration | ⭐⭐⭐ Advanced |
| [discord-bot.ts](./integrations/discord-bot.ts) | Discord bot with slash commands | ⭐⭐⭐ Advanced |
| [webhook-server.ts](./integrations/webhook-server.ts) | Webhook receiver for events | ⭐⭐ Intermediate |
| [rest-api.ts](./integrations/rest-api.ts) | Expose agents via REST API | ⭐⭐ Intermediate |

---

## Production

Production-ready patterns for deployment:

| Example | Description | Difficulty |
|---------|-------------|------------|
| [docker-compose.yml](./production/docker-compose.yml) | Docker Compose deployment | ⭐⭐ Intermediate |
| [kubernetes.yaml](./production/kubernetes.yaml) | Kubernetes deployment manifests | ⭐⭐⭐ Advanced |
| [monitoring.ts](./production/monitoring.ts) | Prometheus metrics integration | ⭐⭐⭐ Advanced |
| [rate-limiting.ts](./production/rate-limiting.ts) | Rate limiting and quotas | ⭐⭐ Intermediate |

---

## Running Examples

### Prerequisites

```bash
# Install dependencies
bun install @agentik/sdk

# Set environment variables
export AGENTIK_API_KEY=your_api_key
export CONVEX_URL=your_convex_url
```

### Run an Example

```bash
# TypeScript
bun run docs/examples/basics/create-agent.ts

# JavaScript (transpile first)
npx tsx docs/examples/basics/create-agent.ts
```

---

## Example Template

All examples follow this structure:

```typescript
/**
 * Example: [Name]
 *
 * Description: [What this example demonstrates]
 * Difficulty: [Beginner/Intermediate/Advanced]
 * Prerequisites: [What you need]
 */

import { Agentik } from '@agentik/sdk';

// Configuration
const agentik = new Agentik({
  apiKey: process.env.AGENTIK_API_KEY!,
});

async function main() {
  try {
    // Example code here
    console.log('✅ Example completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
```

---

## Contributing Examples

Want to contribute an example?

1. Follow the template above
2. Add comprehensive comments
3. Include error handling
4. Test thoroughly
5. Submit a PR to `/docs/examples/`

**Guidelines:**
- Keep examples under 200 lines
- Use TypeScript with strict mode
- Include JSDoc comments
- Add example output in comments
- Test with latest SDK version

---

## Need Help?

- 📚 **Documentation:** [docs.agentik-os.com](https://docs.agentik-os.com)
- 💬 **Discord:** [discord.gg/agentik-os](https://discord.gg/agentik-os)
- 🐛 **Issues:** [github.com/agentik-os/agentik-os/issues](https://github.com/agentik-os/agentik-os/issues)

---

*Last updated: February 14, 2026*
*Agentik OS Documentation Team*
