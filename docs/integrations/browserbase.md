# Browserbase Integration

> Cloud browser automation via the Browserbase MCP protocol.

## Overview

The Browserbase skill enables AI agents to interact with web pages programmatically. Agents can navigate URLs, take screenshots, extract content, fill forms, click elements, and execute JavaScript - all in cloud-hosted browser sessions.

## Installation

```bash
panda skill install @agentik-os/skill-browserbase
```

## Configuration

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `apiKey` | string | Yes | - | Browserbase API key |
| `projectId` | string | Yes | - | Browserbase project ID |
| `timeout` | number | No | 30000 | Page load timeout (ms) |

```yaml
# agent.yaml
skills:
  - id: browserbase
    config:
      apiKey: ${BROWSERBASE_API_KEY}
      projectId: ${BROWSERBASE_PROJECT_ID}
      timeout: 30000
```

## Actions

### `createSession`

Create a new browser session.

```typescript
const result = await agent.skill('browserbase', {
  action: 'createSession',
  params: {
    viewport: { width: 1280, height: 720 }
  }
});
// result.sessionId => "sess_abc123"
```

### `navigate`

Navigate to a URL.

```typescript
await agent.skill('browserbase', {
  action: 'navigate',
  params: { sessionId: 'sess_abc123', url: 'https://example.com' }
});
```

### `screenshot`

Capture a screenshot of the current page.

```typescript
const screenshot = await agent.skill('browserbase', {
  action: 'screenshot',
  params: {
    sessionId: 'sess_abc123',
    fullPage: true,
    format: 'png'
  }
});
```

### `extractContent`

Extract text content from the page.

```typescript
const content = await agent.skill('browserbase', {
  action: 'extractContent',
  params: { sessionId: 'sess_abc123', selector: '.article-body' }
});
```

### `click`

Click an element on the page.

```typescript
await agent.skill('browserbase', {
  action: 'click',
  params: { sessionId: 'sess_abc123', selector: '#submit-button' }
});
```

### `fillForm`

Fill form fields.

```typescript
await agent.skill('browserbase', {
  action: 'fillForm',
  params: {
    sessionId: 'sess_abc123',
    fields: {
      '#email': 'user@example.com',
      '#password': 'secure123'
    }
  }
});
```

### `evaluate`

Execute JavaScript in the browser context.

```typescript
const result = await agent.skill('browserbase', {
  action: 'evaluate',
  params: {
    sessionId: 'sess_abc123',
    script: 'document.title'
  }
});
```

### `closeSession`

Close a browser session.

```typescript
await agent.skill('browserbase', {
  action: 'closeSession',
  params: { sessionId: 'sess_abc123' }
});
```

## Permissions

| Permission | Description |
|------------|-------------|
| `network:https:api.browserbase.com` | API access |
| `network:wss:connect.browserbase.com` | WebSocket connection |
| `api:browserbase` | Service authorization |
| `kv:read:browserbase:*` | Cache reads |
| `kv:write:browserbase:*` | Cache writes |

## Use Cases

- **Web Research**: Navigate and extract data from multiple sources
- **Form Automation**: Fill and submit forms on behalf of users
- **Visual Verification**: Take screenshots for QA and monitoring
- **Data Extraction**: Scrape structured data from web pages
- **Testing**: Automated browser-based testing flows

## Rate Limits

- 30 requests per minute per agent
- Sessions auto-close after 10 minutes of inactivity
