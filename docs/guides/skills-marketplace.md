# Skills Marketplace Guide

Complete guide to browsing, installing, using, and creating skills in the Agentik OS Marketplace - the app store for AI agent capabilities.

---

## Table of Contents

1. [What are Skills?](#what-are-skills)
2. [Browsing the Marketplace](#browsing-the-marketplace)
3. [Installing Skills](#installing-skills)
4. [Using Skills](#using-skills)
5. [Managing Skills](#managing-skills)
6. [Creating Skills](#creating-skills)
7. [Publishing to Marketplace](#publishing-to-marketplace)
8. [Marketplace Categories](#marketplace-categories)
9. [Permissions & Security](#permissions--security)
10. [Best Practices](#best-practices)

---

## What are Skills?

Skills are **reusable capabilities** that give your AI agents superpowers. Think of them as apps in an app store - modular plugins that extend what agents can do.

**Examples:**
- `web-search` - Google search capability
- `google-calendar` - Manage calendar events
- `file-ops` - Read and write files
- `github` - GitHub API integration
- `stripe` - Payment processing
- `email` - Send/receive emails

### Built-in Skills vs. Marketplace Skills

| Type | Description | Examples | Installation |
|------|-------------|----------|--------------|
| **Built-in** | Pre-installed with Agentik OS | web-search, file-ops | None required |
| **Official** | Published by Agentik OS team | google-calendar, github, slack | `panda skill install` |
| **Community** | Created by community developers | custom integrations | `panda skill install` |

### How Skills Work

```
User Message
     ↓
AI Agent detects need for skill
     ↓
Skill executes action (API call, file read, etc.)
     ↓
Result returned to agent
     ↓
Agent incorporates result into response
     ↓
User receives enhanced response
```

**Example conversation:**

```
User: What's on my calendar tomorrow?

Agent: (Detects calendar query)
       (Invokes google-calendar skill)
       (Receives: "2 events: Team standup 9am, Lunch with client 12pm")

Agent: You have 2 events tomorrow:
       - Team standup at 9:00 AM
       - Lunch with client at 12:00 PM
```

---

## Browsing the Marketplace

### Web Dashboard

**Access:** http://localhost:3000/marketplace

1. Navigate to Marketplace tab
2. Browse by category or search
3. Click skill card for details
4. View description, permissions, pricing
5. Install with one click

### CLI

```bash
# List all available skills
panda skill browse

# Search for skills
panda skill search "calendar"
panda skill search "payment"

# View skill details
panda skill info google-calendar

# Browse by category
panda skill browse --category "productivity"
```

### Skill Information

Each skill listing shows:

- **Name** - Unique identifier (e.g., `google-calendar`)
- **Description** - What the skill does
- **Category** - Productivity, Communication, Finance, etc.
- **Version** - Semantic version (e.g., `1.2.0`)
- **Author** - Developer or organization
- **Permissions** - What access the skill needs
- **Pricing** - Free or paid (marketplace fee)
- **Rating** - User reviews (1-5 stars)
- **Downloads** - Installation count
- **Last Updated** - Freshness indicator

**Example:**

```
╔═══════════════════════════════════════════════╗
║          Google Calendar Skill                ║
╚═══════════════════════════════════════════════╝

Description: Manage Google Calendar events - create, read,
            update, and delete calendar entries.

Category:    Productivity
Version:     1.2.0
Author:      Agentik OS Team
Permissions: calendar.read, calendar.write
Pricing:     Free
Rating:      ⭐⭐⭐⭐⭐ (4.9/5 - 2,341 reviews)
Downloads:   15,423
Updated:     2026-02-10

[Install] [View Demo] [Documentation]
```

---

## Installing Skills

### Quick Install

```bash
# Install a skill
panda skill install google-calendar

# Expected output:
# ✅ Installed google-calendar v1.2.0
# 📦 Dependencies: @google/calendar-api
# 🔐 Permissions required: calendar.read, calendar.write
#
# Run `panda skill enable google-calendar` to activate
```

### Install with Permissions

Review permissions before installing:

```bash
# View permissions first
panda skill info google-calendar --permissions

# Expected output:
# Permissions Required:
# - calendar.read: Read calendar events
# - calendar.write: Create/update/delete events
# - user.email: Access user email address
#
# Grant permissions? (y/n):
```

### Enable Skill

```bash
# Enable for all agents
panda skill enable google-calendar

# Enable for specific agent
panda skill enable google-calendar --agent "my-agent"
```

### Install from URL

```bash
# Install from GitHub
panda skill install https://github.com/user/custom-skill

# Install from npm package
panda skill install npm:@myorg/custom-skill

# Install local development skill
panda skill install ./path/to/skill
```

### Batch Install

```bash
# Install multiple skills at once
panda skill install web-search google-calendar slack

# Install from requirements file
panda skill install --from requirements.txt
```

**requirements.txt:**
```
google-calendar@1.2.0
slack@2.1.0
github@3.0.0
web-search@latest
```

---

## Using Skills

### Auto-Invoke (Recommended)

Agent automatically detects when to use skills:

```bash
# Enable auto-invoke
panda agent update my-agent --auto-invoke-skills true
```

**Example:**

```
User: What's the weather in San Francisco?

Agent: (Detects weather query)
       (Auto-invokes web-search skill)
       (Searches: "weather San Francisco")

       The weather in San Francisco is currently 68°F
       with partly cloudy skies.
```

### Manual Invoke

Explicitly tell the agent to use a skill:

```
User: Use web-search to find the latest Next.js documentation.

Agent: (User requested web-search explicitly)
       (Invokes web-search)
       (Searches: "Next.js documentation latest")

       Here's the latest Next.js documentation:
       https://nextjs.org/docs - Next.js 16 introduced...
```

### Skill Chaining

Combine multiple skills in one task:

```
User: Find my next calendar event and create a GitHub issue for it.

Agent: (Detects multi-skill task)

       Step 1: Invoke google-calendar skill
       → Next event: "Team standup" at 9:00 AM

       Step 2: Invoke github skill
       → Create issue: "Prep for team standup at 9 AM"
       → Issue #42 created

       I found your next calendar event (Team standup at 9 AM)
       and created GitHub issue #42 to track preparation.
```

### Skill Configuration

Configure skill behavior:

```bash
# Set skill options
panda skill config google-calendar --timezone "America/Los_Angeles"

# Set API keys
panda skill config github --api-key "ghp_xxxxx"

# View skill config
panda skill config google-calendar
```

---

## Managing Skills

### List Installed Skills

```bash
# List all installed skills
panda skill list

# Expected output:
# Installed Skills:
# ╔════════════════════════════════════════════════╗
# ║ Name              Version    Status   Enabled  ║
# ╠════════════════════════════════════════════════╣
# ║ google-calendar   1.2.0      ✅       Yes      ║
# ║ web-search        2.0.0      ✅       Yes      ║
# ║ github            3.0.0      ⏸️       No       ║
# ║ slack             2.1.0      ✅       Yes      ║
# ╚════════════════════════════════════════════════╝
```

### Update Skills

```bash
# Update a specific skill
panda skill update google-calendar

# Update all skills
panda skill update --all

# Check for updates
panda skill outdated
```

### Disable/Enable Skills

```bash
# Temporarily disable
panda skill disable github

# Re-enable
panda skill enable github
```

### Uninstall Skills

```bash
# Uninstall a skill
panda skill uninstall github

# Confirmation prompt:
# ⚠️  This will remove github skill from all agents.
# Continue? (y/n): y
# ✅ Uninstalled github v3.0.0
```

### Skill Logs

```bash
# View skill usage logs
panda skill logs google-calendar

# Expected output:
# 2026-02-14 09:15 - Created event "Team standup"
# 2026-02-14 10:30 - Listed upcoming events
# 2026-02-14 14:45 - Updated event "Client meeting"
```

### Skill Analytics

```bash
# View usage stats
panda skill stats

# Expected output:
# Skill Usage (Last 30 Days):
# ╔════════════════════════════════════════════════╗
# ║ Skill             Invocations    Errors   Cost ║
# ╠════════════════════════════════════════════════╣
# ║ web-search        152            2        $0.45║
# ║ google-calendar   48             0        $0.12║
# ║ github            23             1        $0.08║
# ╚════════════════════════════════════════════════╝
```

---

## Creating Skills

### Skill Development Kit (SDK)

```bash
# Install SDK
npm install -g @agentik-os/skill-sdk

# Create new skill from template
panda skill create my-custom-skill

# Choose template:
# 1. API Integration (calls external API)
# 2. File Operations (local file system)
# 3. Data Processing (transform data)
# 4. MCP Tool (Model Context Protocol)
```

### Skill Structure

```
my-custom-skill/
├── skill.json              # Skill manifest
├── src/
│   ├── index.ts           # Main entry point
│   ├── handlers/          # Action handlers
│   │   ├── search.ts
│   │   └── create.ts
│   └── types.ts           # TypeScript types
├── tests/
│   └── skill.test.ts      # Unit tests
├── README.md              # Documentation
└── package.json           # npm dependencies
```

### skill.json Manifest

```json
{
  "name": "weather-skill",
  "version": "1.0.0",
  "description": "Get weather forecasts for any city",
  "category": "productivity",
  "author": {
    "name": "John Doe",
    "email": "john@example.com",
    "url": "https://johndoe.com"
  },
  "permissions": {
    "network": {
      "read": ["api.weather.com"]
    }
  },
  "actions": [
    {
      "name": "getCurrentWeather",
      "description": "Get current weather for a city",
      "parameters": {
        "city": {
          "type": "string",
          "description": "City name",
          "required": true
        },
        "units": {
          "type": "string",
          "enum": ["metric", "imperial"],
          "default": "metric"
        }
      }
    }
  ],
  "config": {
    "apiKey": {
      "type": "string",
      "description": "Weather API key",
      "required": true,
      "secret": true
    }
  },
  "pricing": {
    "model": "free",
    "apiCostsUser": false
  }
}
```

### Implementation Example

**src/index.ts:**
```typescript
import { Skill, SkillContext } from '@agentik-os/skill-sdk';

export default class WeatherSkill extends Skill {
  async getCurrentWeather(
    params: { city: string; units?: 'metric' | 'imperial' },
    context: SkillContext
  ) {
    // Validate parameters
    if (!params.city) {
      throw new Error('City parameter required');
    }

    // Get API key from config
    const apiKey = this.getConfig('apiKey');

    // Make API request
    const response = await fetch(
      `https://api.weather.com/v1/current?city=${params.city}&units=${params.units || 'metric'}&apiKey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    // Return formatted result
    return {
      temperature: data.temp,
      condition: data.condition,
      humidity: data.humidity,
      windSpeed: data.wind_speed,
      city: params.city,
      units: params.units || 'metric'
    };
  }
}
```

### Testing

**tests/skill.test.ts:**
```typescript
import { describe, it, expect } from 'vitest';
import WeatherSkill from '../src/index';

describe('WeatherSkill', () => {
  it('should get current weather', async () => {
    const skill = new WeatherSkill({
      apiKey: process.env.WEATHER_API_KEY
    });

    const result = await skill.getCurrentWeather({
      city: 'San Francisco',
      units: 'imperial'
    }, mockContext);

    expect(result.temperature).toBeDefined();
    expect(result.city).toBe('San Francisco');
    expect(result.units).toBe('imperial');
  });
});
```

### Local Testing

```bash
# Run tests
panda skill test ./my-custom-skill

# Run in dev mode
panda skill dev ./my-custom-skill

# Test with live agent
panda chat --agent test-agent --skill ./my-custom-skill
```

---

## Publishing to Marketplace

### Prepare for Publishing

```bash
# Validate skill
panda skill validate ./my-custom-skill

# Run tests
panda skill test ./my-custom-skill

# Build production bundle
panda skill build ./my-custom-skill
```

### Publish

```bash
# Login to marketplace
panda marketplace login

# Publish skill
panda skill publish ./my-custom-skill

# Set pricing
panda skill pricing my-custom-skill --model free

# Or paid
panda skill pricing my-custom-skill --model paid --price 5.00
```

### Marketplace Review Process

1. **Submit** - Upload skill to marketplace
2. **Automated Checks** - Security scan, tests, manifest validation
3. **Manual Review** - Agentik OS team reviews (24-48 hours)
4. **Approval** - Skill goes live on marketplace
5. **Monitoring** - Continuous security & quality monitoring

**Rejection reasons:**
- Security vulnerabilities
- Malicious code
- Poor documentation
- Broken functionality
- Duplicate of existing skill

### Update Published Skill

```bash
# Increment version
# In skill.json: "version": "1.0.0" → "1.1.0"

# Publish update
panda skill publish ./my-custom-skill --version 1.1.0

# Users get notified of update
# Auto-update if enabled
```

---

## Marketplace Categories

| Category | Description | Example Skills |
|----------|-------------|----------------|
| **Productivity** | Task management, calendars, notes | google-calendar, notion, todoist |
| **Communication** | Messaging, email, social media | slack, discord, email, twitter |
| **Development** | Code, CI/CD, repositories | github, gitlab, jenkins, docker |
| **Data** | Databases, analytics, storage | postgres, mongodb, aws-s3, bigquery |
| **Finance** | Payments, accounting, crypto | stripe, paypal, quickbooks, coinbase |
| **Marketing** | Ads, analytics, SEO | google-ads, facebook-ads, ga4, semrush |
| **AI/ML** | Models, training, inference | huggingface, replicate, roboflow |
| **Automation** | Workflows, integrations | zapier, make, n8n, ifttt |
| **Security** | Auth, encryption, scanning | auth0, 1password, snyk, trufflehog |
| **Utilities** | General-purpose tools | web-search, file-ops, pdf, image-gen |

---

## Permissions & Security

### Permission System

Skills request specific permissions in `skill.json`:

```json
{
  "permissions": {
    "network": {
      "read": ["api.example.com"],
      "write": ["api.example.com"]
    },
    "filesystem": {
      "read": ["/home/user/documents"],
      "write": ["/home/user/documents/output"]
    },
    "secrets": {
      "read": ["API_KEY", "DB_PASSWORD"]
    },
    "calendar": {
      "read": true,
      "write": true
    }
  }
}
```

### Permission Levels

| Permission | Scope | Risk | Examples |
|------------|-------|------|----------|
| **read** | Read-only access | Low | View calendar, read files |
| **write** | Create/update | Medium | Create events, write files |
| **delete** | Remove data | High | Delete events, remove files |
| **admin** | Full control | Critical | Manage users, configure system |

### Sandboxing

All skills run in WASM sandboxes (Extism):

- **Isolated** - Cannot access other skills or system resources
- **Restricted** - Only granted permissions work
- **Monitored** - All actions logged
- **Revocable** - Permissions can be removed anytime

### Security Scanning

Before publishing, skills are scanned for:

- **Malicious code** - Known malware patterns
- **Secrets** - Hardcoded API keys
- **Vulnerabilities** - CVEs in dependencies
- **Backdoors** - Suspicious network calls

### User Controls

```bash
# Review skill permissions before install
panda skill info <skill> --permissions

# Revoke specific permission
panda skill permission revoke google-calendar calendar.write

# View permission usage
panda skill permission audit google-calendar
```

---

## Best Practices

### For Users

1. **Review Permissions** - Always check what a skill needs before installing
   ```bash
   panda skill info <skill> --permissions
   ```

2. **Install from Trusted Sources** - Prefer official and verified skills
   - ✅ Official (Agentik OS team)
   - ✅ Verified (reviewed by team)
   - ⚠️ Community (use caution)

3. **Keep Skills Updated** - Security patches and bug fixes
   ```bash
   panda skill update --all
   ```

4. **Monitor Skill Usage** - Check logs for unexpected behavior
   ```bash
   panda skill logs <skill>
   ```

5. **Use Minimal Permissions** - Grant only what's needed
   ```bash
   panda skill permission revoke <skill> <permission>
   ```

### For Developers

1. **Request Minimal Permissions** - Only ask for what you need

2. **Document Permissions** - Explain WHY each permission is needed

3. **Handle Errors Gracefully** - Don't crash, return meaningful errors
   ```typescript
   try {
     const result = await apiCall();
   } catch (error) {
     return { error: 'Failed to fetch data. Please check your API key.' };
   }
   ```

4. **Write Tests** - Unit + integration tests required for marketplace

5. **Validate Inputs** - Never trust user input
   ```typescript
   if (!params.city || typeof params.city !== 'string') {
     throw new Error('Invalid city parameter');
   }
   ```

6. **Secure Secrets** - Never hardcode API keys
   ```typescript
   // ❌ Bad
   const apiKey = 'sk-xxxxx';

   // ✅ Good
   const apiKey = this.getConfig('apiKey');
   ```

7. **Follow Skill Naming Convention**
   - Use kebab-case: `google-calendar` not `GoogleCalendar`
   - Be descriptive: `stripe-payments` not `payments`
   - No special characters: only `a-z`, `0-9`, `-`

8. **Provide Great Documentation**
   - Clear README with examples
   - API reference
   - Troubleshooting section

---

## Summary

**Key Concepts:**
- ✅ Skills extend agent capabilities
- ✅ Browse marketplace via web or CLI
- ✅ Install with one command
- ✅ Auto-invoke or manual invoke
- ✅ Create custom skills with SDK
- ✅ Publish to marketplace
- ✅ Sandboxed for security
- ✅ Granular permission system

**Quick Commands:**
```bash
# Browse
panda skill browse

# Install
panda skill install <skill-name>

# Enable
panda skill enable <skill-name>

# Use (auto-invoke)
panda agent update my-agent --auto-invoke-skills true

# Create
panda skill create my-custom-skill

# Publish
panda skill publish ./my-custom-skill
```

**Next Steps:**
- Try installing your first skill: `panda skill install google-calendar`
- Read [Skills Development Guide](../skills/development-guide.md) for detailed SDK docs
- Browse [Official Skills Catalog](https://marketplace.agentik-os.com)

**Need help?** Check the [Troubleshooting Guide](../troubleshooting.md) or join [Discord](https://discord.gg/agentik-os).

---

**Last Updated:** 2026-02-14
**Version:** 1.0.0
**Next:** [OS Modes Guide](os-modes.md)
