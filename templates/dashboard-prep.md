# Dashboard Development - Preparation Plan

**Agent:** dashboard-frontend
**Phase:** Waiting for Phase 1 (Task #2) to unlock
**Status:** Preparing architecture and component planning

---

## Dashboard Architecture (from docs/ARCHITECTURE.md)

### Package Structure
```
packages/dashboard/
├── app/                        # Next.js 16 App Router
│   ├── (auth)/                 # Auth pages (login, signup)
│   ├── agents/                 # Agent management
│   ├── channels/               # Channel configuration
│   ├── skills/                 # Skill marketplace
│   ├── mcp/                    # MCP hub
│   ├── memory/                 # Memory explorer
│   ├── costs/                  # Cost X-Ray
│   ├── scheduler/              # Cron jobs
│   ├── logs/                   # Activity logs
│   └── settings/               # System settings
├── components/                 # Shared UI components
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Layout components
│   ├── agents/                 # Agent-specific components
│   ├── chat/                   # Chat interface components
│   └── charts/                 # Data visualization
├── lib/                        # Utilities
│   ├── convex.ts               # Convex client setup
│   ├── utils.ts                # Helper functions
│   └── api-client.ts           # API wrapper
└── public/                     # Static assets
```

---

## 8 Main Sections (from CLAUDE.md)

### 1. Overview Dashboard
**Route:** `/`
**Purpose:** Live activity feed, agent status, cost summary
**Key Features:**
- Active agents grid with status badges
- Real-time cost breakdown (hourly, daily, monthly)
- Activity feed (latest messages, tasks, errors)
- Quick stats (total agents, messages today, cost today)

**Components to build:**
- `ActiveAgentCard` - Agent status with live indicator
- `CostSummaryWidget` - Chart.js cost visualization
- `ActivityFeed` - Real-time message stream
- `QuickStatsBar` - Metric cards

### 2. Agents Management
**Route:** `/agents`
**Purpose:** Create, configure, manage agents
**Key Features:**
- Agent list with search/filter
- Create new agent wizard
- Edit agent personality/skills/channels
- View agent conversation history
- Agent health monitoring

**Components to build:**
- `AgentListTable` - Data table with actions
- `CreateAgentDialog` - Multi-step form
- `AgentConfigPanel` - Settings form
- `AgentHealthIndicator` - Status visualization

### 3. Cost X-Ray
**Route:** `/costs`
**Purpose:** Per-message cost tracking, trends, budgets
**Key Features:**
- Cost per agent breakdown
- Model usage analysis (Opus vs Sonnet vs Haiku)
- Budget alerts and limits
- Cost trends chart (7d, 30d, 90d)
- Export cost reports

**Components to build:**
- `CostBreakdownChart` - Stacked bar chart
- `ModelUsagePie` - Pie chart for model distribution
- `BudgetAlertCard` - Warning banner
- `CostTrendLine` - Line chart with date range picker

### 4. Skills Marketplace
**Route:** `/skills`
**Purpose:** Browse, install, manage skills
**Key Features:**
- Skill catalog with categories
- Search and filter skills
- Skill detail pages with README
- Install/uninstall skills
- Skill permissions management

**Components to build:**
- `SkillCatalogGrid` - Card grid with lazy loading
- `SkillDetailModal` - Full skill info
- `SkillInstallButton` - Install flow
- `SkillPermissionsTable` - Permission matrix

### 5. Automations
**Route:** `/scheduler`
**Purpose:** Scheduled tasks, triggers, workflows
**Key Features:**
- Create cron jobs
- Event-based triggers
- Workflow builder (visual?)
- Automation logs
- Enable/disable automations

**Components to build:**
- `AutomationListTable` - Sortable table
- `CronJobForm` - Cron expression builder
- `TriggerConfigPanel` - Event trigger setup
- `AutomationLogsViewer` - Log stream

### 6. Settings
**Route:** `/settings`
**Purpose:** API keys, preferences, team management
**Key Features:**
- API key management (Anthropic, OpenAI, Google)
- Model preferences (default models per complexity)
- Notification settings
- Team members (if multi-user)
- Data export/backup

**Components to build:**
- `ApiKeyInput` - Masked input with reveal
- `ModelPreferenceForm` - Dropdown selectors
- `NotificationToggle` - Switch components
- `TeamMemberTable` - User management

### 7. Channels
**Route:** `/channels`
**Purpose:** Configure Telegram, Discord, Slack, etc.
**Key Features:**
- Channel connection wizard
- Test connection
- Channel-specific settings
- Message routing rules
- Webhook configuration

**Components to build:**
- `ChannelCard` - Status card per channel
- `ChannelWizard` - Step-by-step setup
- `WebhookConfigPanel` - URL + secret management
- `MessageRoutingRules` - Rule builder

### 8. Memory Explorer
**Route:** `/memory`
**Purpose:** Browse and manage agent memories
**Key Features:**
- Search conversations
- Vector similarity search
- Memory categories (short-term, session, long-term)
- Memory insights (topics, entities)
- Delete/export memories

**Components to build:**
- `MemorySearchBar` - Full-text + vector search
- `MemoryListItem` - Conversation snippet
- `MemoryDetailPanel` - Full conversation view
- `MemoryInsightsChart` - Topic clustering visualization

---

## Technical Stack

### Core Technologies
- **Next.js 16**: App Router with React Server Components
- **shadcn/ui**: Component library (Radix UI + Tailwind)
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Strict mode enabled
- **Convex**: Real-time backend (queries, mutations, subscriptions)

### Key Libraries to Install (Phase 1, step-042)
```bash
# shadcn/ui init
pnpm dlx shadcn-ui@latest init

# Core components
pnpm dlx shadcn-ui@latest add button card table badge dialog input select textarea switch tabs

# Forms
pnpm dlx shadcn-ui@latest add form label checkbox radio-group

# Data display
pnpm dlx shadcn-ui@latest add avatar separator skeleton

# Feedback
pnpm dlx shadcn-ui@latest add toast alert progress

# Charts (for Cost X-Ray)
pnpm add recharts

# Convex real-time
pnpm add convex

# Forms & validation
pnpm add react-hook-form zod @hookform/resolvers

# Date handling
pnpm add date-fns

# Icons
# (lucide-react comes with shadcn/ui)
```

---

## Real-Time Integration with Convex

### Example: Live Agent Status
```typescript
// app/agents/page.tsx
'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function AgentsPage() {
  // This updates automatically when data changes!
  const agents = useQuery(api.agents.list);

  if (!agents) return <LoadingSkeleton />;

  return (
    <div className="grid grid-cols-3 gap-4">
      {agents.map(agent => (
        <AgentCard key={agent._id} agent={agent} />
      ))}
    </div>
  );
}
```

### Example: Send Message to Agent
```typescript
// components/chat/ChatInput.tsx
'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function ChatInput({ agentId }: { agentId: string }) {
  const sendMessage = useMutation(api.conversations.saveMessage);

  const handleSend = async (content: string) => {
    await sendMessage({
      agentId,
      content,
      userId: 'current-user', // from auth
    });

    // UI updates automatically via subscription!
  };

  return <form onSubmit={...} />
}
```

---

## Design Patterns

### Responsive Breakpoints
```typescript
// Follow project standards from rules
const breakpoints = {
  mobile: '375px',   // iPhone
  tablet: '768px',   // iPad
  desktop: '1440px', // Standard desktop
};
```

### Color Palette
Will use shadcn/ui default theme:
- Primary: Slate
- Accent: Blue
- Destructive: Red
- Success: Green

Custom palette can be configured in `tailwind.config.js` if needed.

### Layout Structure
```
+------------------+
| TopNav           | <- Logo, breadcrumbs, user menu
+------+-----------+
| Side |           |
| bar  | Content   | <- Main content area
|      |           |
+------+-----------+
```

**Sidebar Navigation:**
- Overview (home icon)
- Agents (users icon)
- Cost X-Ray (chart icon)
- Skills (puzzle icon)
- Automations (clock icon)
- Channels (wifi icon)
- Memory (brain icon)
- Settings (cog icon)

---

## Quality Bar (from CLAUDE.md)

✅ **Must achieve:**
- 0 TypeScript errors
- 0 console errors in browser
- Responsive: 375px, 768px, 1440px
- shadcn/ui properly styled
- Tailwind CSS for all styling
- Real-time updates via Convex
- <2s page load time

---

## Component Library Strategy

### Use shadcn/ui for:
- Buttons, inputs, forms (core interactions)
- Dialogs, sheets, popovers (modals)
- Tables, cards (data display)
- Badges, avatars (status indicators)

### Custom components for:
- Complex domain logic (agent config, cost charts)
- Real-time features (activity feed, chat)
- Dashboard-specific layouts

### Reusable patterns:
- `<DataTable />` - Generic table with sorting/filtering
- `<PageHeader />` - Consistent page titles
- `<EmptyState />` - No data placeholder
- `<LoadingSkeleton />` - Loading states

---

## Testing Strategy (Step-035 ready!)

Vitest configs are ready in `templates/vitest/dashboard.vitest.config.ts`

### Test Coverage Goals:
- **Components:** 80%+ (unit tests with Vitest + Testing Library)
- **Pages:** E2E tests with Playwright
- **API integration:** Mock Convex queries

---

## Next Steps (When Phase 1 Unlocks)

### Step-041: Create dashboard package
```bash
cd packages
pnpm create next-app@latest dashboard \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### Step-042: Install shadcn/ui
```bash
cd packages/dashboard
pnpm dlx shadcn-ui@latest init
# Select: Default style, Slate color, CSS variables
```

### Step-043+: Build iteratively
1. Create layout structure (sidebar, topnav)
2. Build Overview page (simplest)
3. Add Convex integration
4. Build Agent list page
5. Add chat interface
6. Continue with remaining sections...

---

**Status:** ✅ Prepared and ready for Phase 1!
**Agent:** dashboard-frontend
**Last Updated:** 2026-02-14
