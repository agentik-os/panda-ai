# 🚀 Project Creator Agent

AI Agent that orchestrates end-to-end project creation from idea to working MVP.

## Overview

The Project Creator Agent is a specialized autonomous agent within Agentik OS responsible for:

1. **Discovery** - Understanding your project vision through conversational interview
2. **Branding** - Generating product names, color palettes, and emotional positioning
3. **PRD** - Creating comprehensive Product Requirements Documents
4. **Stack Selection** - Recommending optimal tech stack with reasoning
5. **Team Coordination** - Spawning and managing AI development team
6. **Quality Assurance** - Orchestrating comprehensive testing
7. **Deployment** - Handling production deployment and handoff

## Installation

```bash
# From monorepo root
pnpm install

# Install dependencies for this package
pnpm --filter @agentik/project-creator install
```

## Usage

### CLI

```bash
# Interactive mode (prompts for all details)
pnpm --filter @agentik/project-creator create

# With initial idea
pnpm --filter @agentik/project-creator create --idea "Build a SaaS for managing freelance invoices"

# Custom output directory and budget
pnpm --filter @agentik/project-creator create --output ./my-project --budget 5

# Show help
pnpm --filter @agentik/project-creator create --help
```

### Programmatic API

```typescript
import { ProjectCreatorAgent } from '@agentik/project-creator';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const aiClient = {
  async generateText(prompt: string): Promise<string> {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    return textContent?.type === 'text' ? textContent.text : '';
  },
};

const agent = new ProjectCreatorAgent({
  aiClient,
  outputDir: './my-new-project',
  budget: { aiCosts: 10 },
});

const result = await agent.createProject('Build a time tracking app for freelancers');

console.log('Project created:', result.projectPath);
console.log('Total cost:', result.totalCost);
```

## Output Structure

The agent generates the following files in the output directory:

```
output/
├── PROJECT_DISCOVERY.json    # Requirements and user answers
├── BRANDING.json              # Product name, colors, positioning
├── PRD.md                     # Product Requirements Document (Markdown)
├── PRD.json                   # PRD in structured JSON format
├── STACK_SELECTION.json       # Recommended tech stack with reasoning
├── TEAM_ASSIGNMENTS.json      # AI team composition and task assignments
├── QA_REPORT.json             # Test results and bug findings
└── DEPLOYMENT.json            # Deployment instructions
```

## Phases

### Phase 1: Discovery & Requirements Gathering

**Duration:** ~2-5 minutes

Conducts conversational interview to understand:
- Problem statement
- Target users and their pain points
- Core MVP features (3 max)
- Business model
- Industry and competitors
- Technical constraints
- Timeline and budget

**Output:** `PROJECT_DISCOVERY.json`

Example:
```json
{
  "projectName": "TaskFlow",
  "problem": "Freelancers waste hours on manual invoicing",
  "targetUsers": ["Freelancers", "Small agencies"],
  "coreFeatures": [
    "Time tracking",
    "Automatic invoice generation",
    "Payment tracking"
  ],
  "businessModel": "Freemium + Pro ($19/mo)",
  "constraints": {
    "deadline": "2 weeks for MVP",
    "budget": "$50 for AI costs"
  }
}
```

### Phase 2: Branding & Identity

**Duration:** ~5-10 minutes

Generates professional branding:
- **10 product name suggestions** with scoring (memorability, clarity, domain availability)
- **3 color palettes** (oklch format with WCAG compliance)
- **Emotional positioning statement**
- **3 logo concepts** (text-based descriptions)
- **Voice & tone guidelines** with context examples
- **Typography system** (heading, body, mono fonts)

**Output:** `BRANDING.json`

Example:
```json
{
  "productNames": [
    {
      "name": "TaskFlow",
      "meaning": "Combines task + flow for effortless management",
      "score": 28
    }
  ],
  "selectedName": "TaskFlow",
  "tagline": "The stress-free way to track time and get paid faster",
  "colorPalettes": [
    {
      "name": "Professional Blue",
      "primary": "oklch(0.55 0.15 250)",
      "wcagCompliance": {
        "primaryOnBackground": "7.2:1 (AAA)"
      }
    }
  ]
}
```

### Phase 3: PRD Generation

**Duration:** ~10-15 minutes

Creates comprehensive Product Requirements Document with:
- Executive Summary
- User Personas (2-3 detailed personas)
- Feature Specifications with acceptance criteria
- User Stories (10-20 stories)
- Technical Architecture recommendations
- Design System (using selected branding)
- Success Metrics (AARRR framework)
- Go-to-Market Strategy
- Risk Analysis & Mitigation
- Timeline & Milestones
- Budget Breakdown

**Output:** `PRD.md` + `PRD.json`

### Phase 4: Stack Selection & Justification

**Duration:** ~3-5 minutes

Analyzes requirements and recommends optimal stack:
- Compares Next.js vs other frameworks
- Evaluates backend options (Convex, Supabase, Firebase)
- Recommends auth provider (Clerk, Better Auth)
- Suggests payment integration (Stripe, LemonSqueezy)
- Provides deployment strategy
- Estimates monthly costs
- Lists 2-3 alternatives with trade-offs

**Output:** `STACK_SELECTION.json`

Example:
```json
{
  "recommended": {
    "frontend": "Next.js 16 (App Router)",
    "backend": "Convex",
    "auth": "Clerk",
    "payments": "Stripe",
    "reasoning": "Real-time updates required, rapid development, integrated deployment"
  },
  "estimatedCosts": {
    "monthly": { "min": 0, "max": 100 }
  }
}
```

### Phase 5: Team Spawning & Coordination

**Duration:** ~Variable (depends on project size)

Spawns specialized AI agents:
- **Guardian** (Opus 4.6) - Architecture decisions, code review
- **Frontend Lead** (Sonnet 4.5) - React/Next.js components
- **Backend Lead** (Sonnet 4.5) - API routes, database schema
- **Designer** (Sonnet 4.5) - shadcn/ui components, Tailwind theming
- **QA Engineer** (Sonnet 4.5) - Testing, accessibility

**Output:** `TEAM_ASSIGNMENTS.json`

### Phase 6: Quality Assurance Orchestration

**Duration:** ~30-60 minutes (if enabled)

Triggers comprehensive testing:
- MANIAC agent for deep testing
- Unit tests (>80% coverage target)
- Integration tests
- E2E tests (Playwright)
- Accessibility audit
- Performance testing
- Security scanning

**Output:** `QA_REPORT.json`

### Phase 7: Deployment & Handoff

**Duration:** ~5-10 minutes

Handles production deployment:
- Vercel/Netlify deployment
- Environment variables setup
- Domain configuration
- CI/CD pipeline setup
- Handoff documentation

**Output:** `DEPLOYMENT.json`

## Cost Estimate

Typical project creation costs **$3-10** in AI API calls:

| Phase | Estimated Cost |
|-------|----------------|
| Discovery | $0.10 |
| Branding | $0.50 |
| PRD Generation | $0.80 |
| Stack Selection | $0.30 |
| Team Coordination | $1.00 |
| QA Orchestration | $0.50 |
| Deployment | $0.20 |
| **Total** | **~$3.40** |

Complex projects with extensive PRDs may cost up to $10.

## Templates

This package includes production-ready templates:

### Branding Prompts (`templates/branding-prompts.md`)

Complete branding framework covering:
- Product naming strategies (5 approaches)
- Color palette generation (oklch with WCAG)
- Brand personality archetypes (8 types)
- Logo concept generation (5 types)
- Voice & tone guidelines

### PRD Template (`templates/prd-template.md`)

Handlebars-based PRD template with:
- 12 major sections
- Dynamic variable substitution
- Complete PRD structure
- Examples for each section

### Stack Configurations

Pre-configured stacks in `templates/stack-configs/`:

1. **SaaS Stack** (`saas-nextjs-convex.json`)
   - Next.js 16 + Convex + Clerk + Stripe
   - Real-time capabilities
   - Cost: $0-126/month

2. **Landing Page Stack** (`landing-page-nextjs.json`)
   - Next.js 16 SSG + Resend + Plausible
   - Zero server costs
   - Cost: $9-29/month

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional (for future phases)
VERCEL_TOKEN=...
CLERK_SECRET_KEY=...
STRIPE_SECRET_KEY=...
```

## Development

```bash
# Type-check
pnpm --filter @agentik/project-creator type-check

# Run in dev mode
pnpm --filter @agentik/project-creator dev

# Build
pnpm --filter @agentik/project-creator build
```

## Architecture

```
packages/agents/project-creator/
├── index.ts                      # Main orchestrator
├── cli.ts                        # CLI entry point
├── package.json
├── README.md
├── phases/
│   ├── discovery.ts              # Phase 1: Discovery logic
│   ├── branding.ts               # Phase 2: Branding logic
│   ├── prd.ts                    # Phase 3: PRD generation (TODO)
│   ├── stack.ts                  # Phase 4: Stack selection (TODO)
│   ├── team.ts                   # Phase 5: Team coordination (TODO)
│   ├── qa.ts                     # Phase 6: QA orchestration (TODO)
│   └── deployment.ts             # Phase 7: Deployment (TODO)
└── templates/
    ├── prd-template.md           # PRD Handlebars template
    ├── branding-prompts.md       # Branding guidelines
    └── stack-configs/
        ├── saas-nextjs-convex.json
        └── landing-page-nextjs.json
```

## Roadmap

### ✅ Completed (Phase 1)
- [x] Discovery phase implementation
- [x] Branding phase implementation
- [x] PRD template creation
- [x] Stack config templates
- [x] Main orchestrator structure
- [x] CLI entry point

### 🚧 In Progress (Phase 2)
- [ ] PRD generation implementation
- [ ] Stack selection logic
- [ ] Team coordination system

### 📋 Planned (Phase 3)
- [ ] QA orchestration with MANIAC
- [ ] Deployment automation
- [ ] Interactive approval gates
- [ ] Cost tracking dashboard
- [ ] Multi-project management

## Examples

### Example 1: SaaS Project

```bash
pnpm --filter @agentik/project-creator create \
  --idea "Build a project management tool for remote teams with real-time collaboration"
```

Output:
- Project Name: "TeamSync"
- Stack: Next.js + Convex + Clerk
- Cost: $4.20
- Duration: 18 minutes

### Example 2: Landing Page

```bash
pnpm --filter @agentik/project-creator create \
  --idea "Marketing website for AI consulting agency"
```

Output:
- Project Name: "AI Catalyst"
- Stack: Next.js SSG + Resend
- Cost: $2.80
- Duration: 12 minutes

## Contributing

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../../../LICENSE)

## Support

- Documentation: [docs.agentik-os.com](https://docs.agentik-os.com)
- Issues: [GitHub Issues](https://github.com/agentik-os/agentik-os/issues)
- Discord: [Join our community](https://discord.gg/agentik-os)

---

**Built with ❤️ by the Agentik OS Team**
