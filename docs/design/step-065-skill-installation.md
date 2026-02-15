# Step-065: Skill Installation Flow - Design Document

**Status:** Design Phase (waiting for dependencies: steps 060-064)
**Owner:** cli-sdk
**Created:** 2026-02-14

---

## Overview

Implement the skill installation flow across CLI, dashboard, and runtime to allow users to discover, install, and manage skills for their AI agents.

## Dependencies

- ✅ Step-059: MCP Protocol Integration (completed)
- ✅ Step-060: WASM Sandbox with Extism (completed - #40)
- 🔄 Step-061: Permission System for Skills (in progress - runtime-backend-2, ETA ~14h)
- 🔄 Step-062: Built-in Skill: Web Search (in progress - channels-integrations-3)
- ⏳ Step-063: Built-in Skill: File Operations (pending)
- ⏳ Step-064: Built-in Skill: Calendar (pending)

---

## User Stories

### US-1: Install a Skill via CLI
```bash
# Interactive mode
$ panda skill install
? Which skill would you like to install?
  > web-search
    file-ops
    calendar
    [Browse marketplace...]

? web-search - Search the web using Brave or Serper API
  Install this skill? (Y/n) y

✅ Installed web-search v1.0.0
   Permissions: network:http, api:brave

? Add to which agents?
  [x] My Assistant
  [ ] Code Helper
  [ ] Sales Agent

✅ Added web-search to 1 agent(s)

# Direct mode
$ panda skill install web-search
$ panda skill install web-search --agent "My Assistant"
$ panda skill install web-search --all-agents
```

### US-2: List Installed Skills
```bash
$ panda skill list

Installed Skills (3):

  web-search (v1.0.0)
    Description: Search the web using Brave API
    Permissions: network:http, api:brave
    Used by: 2 agents

  file-ops (v1.0.0)
    Description: Read, write, and list files
    Permissions: fs:read, fs:write, fs:list
    Used by: 1 agent

  calendar (v1.0.0)
    Description: Manage Google Calendar
    Permissions: network:http, api:google
    Used by: 0 agents
```

### US-3: Uninstall a Skill
```bash
$ panda skill uninstall web-search
? This skill is used by 2 agents. Remove from all? (Y/n) y
✅ Uninstalled web-search
```

### US-4: Browse Skills in Dashboard
- Navigate to `/dashboard/skills`
- See grid of available skills (built-in + marketplace when Phase 2)
- Click "Install" button
- Select which agents to add skill to
- Confirm installation

---

## Architecture

### 1. CLI Commands

**File:** `packages/cli/src/commands/skill/install.ts`
```typescript
export async function installSkillCommand(
  skillName?: string,
  options?: {
    agent?: string;
    allAgents?: boolean;
    yes?: boolean;
  }
): Promise<void>;
```

**File:** `packages/cli/src/commands/skill/list.ts`
```typescript
export async function listSkillsCommand(options?: {
  detailed?: boolean;
  unused?: boolean;
}): Promise<void>;
```

**File:** `packages/cli/src/commands/skill/uninstall.ts`
```typescript
export async function uninstallSkillCommand(
  skillName: string,
  options?: {
    force?: boolean;
  }
): Promise<void>;
```

**File:** `packages/cli/src/commands/skill/index.ts`
```typescript
export { installSkillCommand } from "./install.js";
export { listSkillsCommand } from "./list.js";
export { uninstallSkillCommand } from "./uninstall.js";
```

### 2. Runtime Skill Installer

**File:** `packages/runtime/src/skills/installer.ts`

```typescript
import { Skill, SkillType } from "@agentik-os/shared";

// Note: Skill type is defined in packages/shared/src/types/skill.ts
// Includes: id, name, version, description, author, permissions, type, path, mcpServer, installedAt, etc.

export class SkillInstaller {
  /**
   * Get list of all available skills
   */
  async listAvailable(): Promise<Skill[]>;

  /**
   * Get list of installed skills
   */
  async listInstalled(): Promise<Skill[]>;

  /**
   * Install a skill
   */
  async install(skillId: string): Promise<void>;

  /**
   * Uninstall a skill
   */
  async uninstall(skillId: string): Promise<void>;

  /**
   * Add skill to agent
   */
  async addToAgent(skillId: string, agentId: string): Promise<void>;

  /**
   * Remove skill from agent
   */
  async removeFromAgent(skillId: string, agentId: string): Promise<void>;

  /**
   * Get agents using a skill
   */
  async getAgentsUsingSkill(skillId: string): Promise<string[]>;
}
```

**Implementation Notes:**
- Built-in skills are pre-installed (web-search, file-ops, calendar)
- Skills are registered in `~/.agentik-os/data/skills.json`
- Agent skill assignments stored in `~/.agentik-os/data/agents.json` (existing)
- WASM plugins loaded from `~/.agentik-os/skills/` directory
- MCP-based skills discovered via MCP registry (Step-059)

### 3. Dashboard Skills Page

**File:** `packages/dashboard/app/dashboard/skills/page.tsx`

UI Components:
- **SkillsGrid**: Grid of available skills with install buttons
- **SkillCard**: Individual skill card (icon, name, description, permissions, install button)
- **SkillDetailModal**: Detailed view with full description, permissions breakdown, reviews (Phase 2)
- **InstalledSkillsList**: List of installed skills with uninstall/configure buttons

Convex Integration:
```typescript
// Query available skills
const availableSkills = useQuery(api.skills.listAvailable);

// Query installed skills
const installedSkills = useQuery(api.skills.listInstalled);

// Install skill mutation
const installSkill = useMutation(api.skills.install);
```

---

## Data Schema

### Skills Data File
**Location:** `~/.agentik-os/data/skills.json`

```json
{
  "installed": [
    {
      "id": "web-search",
      "name": "Web Search",
      "version": "1.0.0",
      "description": "Search the web using Brave Search API",
      "author": "Agentik OS",
      "permissions": ["network:http", "api:brave"],
      "type": "builtin",
      "installedAt": 1707868800000
    },
    {
      "id": "file-ops",
      "name": "File Operations",
      "version": "1.0.0",
      "description": "Read, write, and list files with sandboxed access",
      "author": "Agentik OS",
      "permissions": ["fs:read:/tmp/*", "fs:write:/tmp/*", "fs:list:/tmp/*"],
      "type": "builtin",
      "installedAt": 1707868900000
    }
  ]
}
```

### Built-in Skills Registry
**Location:** `packages/runtime/src/skills/builtin-registry.ts`

```typescript
export const BUILTIN_SKILLS: Skill[] = [
  {
    id: "web-search",
    name: "Web Search",
    version: "1.0.0",
    description: "Search the web using Brave Search API or Serper",
    author: "Agentik OS",
    permissions: ["network:http", "api:brave"],
    type: "builtin",
    path: "../../../skills/web-search",
  },
  {
    id: "file-ops",
    name: "File Operations",
    version: "1.0.0",
    description: "Read, write, and list files with sandboxed access",
    author: "Agentik OS",
    permissions: ["fs:read", "fs:write", "fs:list"],
    type: "builtin",
    path: "../../../skills/file-ops",
  },
  {
    id: "calendar",
    name: "Google Calendar",
    version: "1.0.0",
    description: "Manage Google Calendar events",
    author: "Agentik OS",
    permissions: ["network:http", "api:google"],
    type: "builtin",
    path: "../../../skills/calendar",
  },
];
```

---

## CLI Workflow

### 1. Install Skill (Interactive)
```typescript
// packages/cli/src/commands/skill/install.ts

export async function installSkillCommand(skillName?: string, options = {}) {
  const installer = new SkillInstaller();

  // Step 1: Get skill to install
  let skill: Skill;

  if (skillName) {
    skill = await installer.getSkill(skillName);
  } else {
    // Interactive: show list of available skills
    const available = await installer.listAvailable();
    const { selectedSkill } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedSkill",
        message: "Which skill would you like to install?",
        choices: available.map(s => ({
          name: `${s.name} - ${s.description}`,
          value: s.id
        }))
      }
    ]);
    skill = await installer.getSkill(selectedSkill);
  }

  // Step 2: Show permissions and confirm
  console.log(chalk.cyan(`\n📦 ${skill.name} v${skill.version}`));
  console.log(`   ${skill.description}`);
  console.log(chalk.bold("\n   Permissions Required:"));
  skill.permissions.forEach(perm => {
    console.log(`   - ${perm}`);
  });

  if (!options.yes) {
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Install this skill?",
        default: true
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow("Installation cancelled"));
      return;
    }
  }

  // Step 3: Install skill
  const spinner = ora("Installing skill...").start();
  await installer.install(skill.id);
  spinner.succeed(`Installed ${skill.name} v${skill.version}`);

  // Step 4: Ask to add to agents
  if (!options.agent && !options.allAgents) {
    const agents = await loadAgents();

    if (agents.agents.length > 0) {
      const { selectedAgents } = await inquirer.prompt([
        {
          type: "checkbox",
          name: "selectedAgents",
          message: "Add to which agents?",
          choices: agents.agents.map(a => ({
            name: a.name,
            value: a.id
          }))
        }
      ]);

      for (const agentId of selectedAgents) {
        await installer.addToAgent(skill.id, agentId);
      }

      console.log(chalk.green(`✅ Added ${skill.name} to ${selectedAgents.length} agent(s)`));
    }
  } else if (options.allAgents) {
    // Add to all agents
    const agents = await loadAgents();
    for (const agent of agents.agents) {
      await installer.addToAgent(skill.id, agent.id);
    }
    console.log(chalk.green(`✅ Added ${skill.name} to all agents`));
  } else if (options.agent) {
    // Add to specific agent
    await installer.addToAgent(skill.id, options.agent);
    console.log(chalk.green(`✅ Added ${skill.name} to agent`));
  }
}
```

---

## Dashboard Workflow

### Skills Page UI
```tsx
// packages/dashboard/app/dashboard/skills/page.tsx

export default function SkillsPage() {
  const availableSkills = useQuery(api.skills.listAvailable);
  const installedSkills = useQuery(api.skills.listInstalled);
  const installSkill = useMutation(api.skills.install);

  const installedIds = new Set(installedSkills?.map(s => s.id) || []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Skills</h1>
      </div>

      <Tabs defaultValue="available">
        <TabsList>
          <TabsTrigger value="available">Available ({availableSkills?.length || 0})</TabsTrigger>
          <TabsTrigger value="installed">Installed ({installedSkills?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableSkills?.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                installed={installedIds.has(skill.id)}
                onInstall={() => installSkill({ skillId: skill.id })}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="installed">
          <InstalledSkillsList skills={installedSkills} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Testing Plan

### Unit Tests
- `packages/runtime/src/skills/installer.test.ts`
  - Test install()
  - Test uninstall()
  - Test listAvailable()
  - Test listInstalled()
  - Test addToAgent()
  - Test removeFromAgent()

### Integration Tests
- `tests/e2e/skills.test.ts`
  - Test `panda skill install web-search`
  - Test `panda skill list`
  - Test `panda skill uninstall web-search`
  - Test skill installation via dashboard

---

## Timeline

**Estimated Hours:** 12 hours

**Breakdown:**
- CLI commands (install, list, uninstall): 4 hours
- Runtime SkillInstaller: 4 hours
- Dashboard Skills page: 3 hours
- Tests: 1 hour

**Blockers:**
- Waiting for steps 060-064 (WASM sandbox + built-in skills)

---

## Notes

- MCP skills are auto-discovered via Step-059's MCP registry
- WASM skills require Step-060's sandbox
- Marketplace skills (Phase 2) will extend this with remote installation
- Consider skill update mechanism in future phases
- Skill dependencies (skill A requires skill B) deferred to Phase 2

---

**Next Actions (when dependencies ready):**
1. Create `packages/cli/src/commands/skill/` directory
2. Implement install/list/uninstall commands
3. Implement `SkillInstaller` class
4. Create dashboard Skills page
5. Wire up CLI skill subcommands in `src/index.ts`
6. Write tests
7. Update PROGRESS.md
