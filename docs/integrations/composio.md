# Composio Integration

> Connect to 200+ apps via the Composio MCP protocol.

## Overview

The Composio skill enables AI agents to interact with over 200 applications through a unified API. Agents can manage GitHub issues, send Slack messages, update Notion pages, create Jira tickets, send emails, and much more - all without writing app-specific integration code.

## Installation

```bash
panda skill install @agentik-os/skill-composio
```

## Configuration

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `apiKey` | string | Yes | - | Composio API key |
| `entityId` | string | No | `default` | Entity ID for multi-user |

```yaml
# agent.yaml
skills:
  - id: composio
    config:
      apiKey: ${COMPOSIO_API_KEY}
      entityId: user-123
```

## Actions

### `listApps`

List available app integrations.

```typescript
const result = await agent.skill('composio', {
  action: 'listApps',
  params: { category: 'productivity' }
});
// result.data.apps => [{ id: "github", name: "GitHub", ... }, ...]
```

### `connect`

Initiate an OAuth connection to an app.

```typescript
const result = await agent.skill('composio', {
  action: 'connect',
  params: {
    appId: 'github',
    redirectUrl: 'https://myapp.com/callback'
  }
});
// result.data.authUrl => "https://github.com/login/oauth/authorize?..."
```

### `listConnections`

List active connections.

```typescript
const result = await agent.skill('composio', {
  action: 'listConnections',
  params: {}
});
```

### `listActions`

List available actions for an app.

```typescript
const result = await agent.skill('composio', {
  action: 'listActions',
  params: { appId: 'github' }
});
// result.data.actions => [{ id: "create-issue", name: "Create Issue", ... }, ...]
```

### `executeAction`

Execute an action on a connected app.

```typescript
// Create a GitHub issue
const result = await agent.skill('composio', {
  action: 'executeAction',
  params: {
    appId: 'github',
    actionId: 'create-issue',
    input: {
      repo: 'my-org/my-repo',
      title: 'Bug: Login form broken',
      body: 'The login form throws a 500 error when submitting.',
      labels: ['bug', 'priority-high']
    }
  }
});
```

### `getTriggers`

List available triggers (webhooks) for an app.

```typescript
const result = await agent.skill('composio', {
  action: 'getTriggers',
  params: { appId: 'github' }
});
```

### `setupTrigger`

Configure a trigger to react to external events.

```typescript
await agent.skill('composio', {
  action: 'setupTrigger',
  params: {
    appId: 'github',
    triggerId: 'new-issue',
    config: { repo: 'my-org/my-repo', labels: ['needs-triage'] }
  }
});
```

### `disconnect`

Remove a connection.

```typescript
await agent.skill('composio', {
  action: 'disconnect',
  params: { connectionId: 'conn_abc123' }
});
```

## Supported Apps (Partial List)

| Category | Apps |
|----------|------|
| **Developer** | GitHub, GitLab, Bitbucket, Linear, Jira |
| **Communication** | Slack, Discord, Microsoft Teams, Gmail |
| **Productivity** | Notion, Google Docs, Google Sheets, Airtable |
| **Project Management** | Trello, Asana, Monday.com, ClickUp |
| **CRM** | Salesforce, HubSpot, Pipedrive |
| **Marketing** | Mailchimp, SendGrid, Typeform |
| **Storage** | Google Drive, Dropbox, OneDrive |
| **Analytics** | Google Analytics, Mixpanel, Segment |

## Permissions

| Permission | Description |
|------------|-------------|
| `network:https:api.composio.dev` | API access |
| `api:composio` | Service authorization |
| `kv:read:composio:*` | Cache reads |
| `kv:write:composio:*` | Cache writes |
| `external:composio:*` | External app access |

## Use Cases

- **Issue Management**: Auto-create GitHub/Jira tickets from conversations
- **Notifications**: Send Slack/Teams messages based on agent activity
- **Document Management**: Create/update Notion pages, Google Docs
- **Email Automation**: Send personalized emails via Gmail/SendGrid
- **Data Sync**: Keep data synchronized across multiple platforms
- **Workflow Automation**: Chain actions across multiple apps

## Rate Limits

- 60 requests per minute per agent
- OAuth connections require user authorization
- Some apps may have their own rate limits
