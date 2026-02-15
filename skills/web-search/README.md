# Web Search Skill

Search the web using Brave Search API with automatic fallback to Serper.

## Features

- ✅ Brave Search API integration (primary)
- ✅ Serper API fallback
- ✅ Rate limiting (100 requests/hour)
- ✅ HTML cleaning and result formatting
- ✅ Configurable safe search
- ✅ Country and language support
- ✅ TypeScript with full type safety

## Installation

```bash
# Install dependencies
pnpm add axios cheerio

# Set API keys (choose one or both)
export BRAVE_API_KEY="your_brave_api_key"
export SERPER_API_KEY="your_serper_api_key"
```

## Usage

### Basic Search

```typescript
import { search } from './skills/web-search';

// Simple string query
const results = await search('what is TypeScript');

console.log(results);
// {
//   results: [
//     {
//       title: "TypeScript: JavaScript With Syntax For Types",
//       url: "https://www.typescriptlang.org/",
//       description: "TypeScript extends JavaScript by adding types...",
//     },
//     // ... more results
//   ],
//   query: "what is TypeScript",
//   provider: "brave",
//   executionTime: 342
// }
```

### Advanced Search

```typescript
import { search } from './skills/web-search';

const results = await search({
  query: 'best restaurants in Paris',
  maxResults: 5,
  safeSearch: 'strict',
  country: 'fr',
  language: 'fr',
});
```

### Custom Configuration

```typescript
import { WebSearchSkill } from './skills/web-search';

const skill = new WebSearchSkill({
  braveApiKey: 'your_key',
  maxResults: 20,
  timeout: 10000,
  enableRateLimit: true,
});

const results = await skill.search({ query: 'AI agents' });
```

### Check Rate Limit Quota

```typescript
import { getQuota } from './skills/web-search';

const remaining = getQuota();
console.log(`Remaining requests: ${remaining}/100`);
```

## API Reference

### `search(query: string | SearchQuery): Promise<WebSearchResponse>`

Perform a web search.

**Parameters:**
- `query`: Search query string or SearchQuery object

**Returns:** `WebSearchResponse` with results

### `SearchQuery`

```typescript
interface SearchQuery {
  query: string;           // Required: search query
  maxResults?: number;     // Optional: max results (default: 10)
  safeSearch?: 'strict' | 'moderate' | 'off';
  country?: string;        // Country code (e.g., 'us', 'fr')
  language?: string;       // Language code (e.g., 'en', 'fr')
}
```

### `WebSearchResponse`

```typescript
interface WebSearchResponse {
  results: SearchResult[];
  totalResults?: number;
  query: string;
  provider: 'brave' | 'serper';
  executionTime: number;
}
```

### `SearchResult`

```typescript
interface SearchResult {
  title: string;
  url: string;
  description: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}
```

## API Keys

### Brave Search API

1. Sign up at [https://brave.com/search/api/](https://brave.com/search/api/)
2. Get your API key
3. Set environment variable: `BRAVE_API_KEY="your_key"`

**Pricing:**
- Free tier: 2,000 queries/month
- Pro: $5/month for 10,000 queries

### Serper API (Fallback)

1. Sign up at [https://serper.dev/](https://serper.dev/)
2. Get your API key
3. Set environment variable: `SERPER_API_KEY="your_key"`

**Pricing:**
- Free tier: 1,000 queries/month
- Pro: $50/month for 10,000 queries

## Rate Limiting

The skill enforces rate limiting to prevent API quota exhaustion:

- **Limit:** 100 requests per hour
- **Window:** Rolling 1-hour window
- **Error:** Throws error when limit exceeded
- **Disable:** Set `enableRateLimit: false` in config

```typescript
const skill = new WebSearchSkill({
  enableRateLimit: false, // Disable rate limiting
});
```

## Error Handling

```typescript
import { search } from './skills/web-search';

try {
  const results = await search('test query');
} catch (error) {
  if (error.message.includes('Rate limit exceeded')) {
    console.log('Too many requests, wait before retrying');
  } else if (error.message.includes('No search API keys')) {
    console.log('Configure BRAVE_API_KEY or SERPER_API_KEY');
  } else {
    console.error('Search failed:', error);
  }
}
```

## Testing

```bash
# Run tests
pnpm test skills/web-search

# Run with coverage
pnpm test:coverage skills/web-search
```

## Integration with Agentik OS

This skill is a built-in skill that ships with Agentik OS. It can be:

1. **Used by agents:** Add to agent configuration
2. **Called via CLI:** `panda skill run web-search "query"`
3. **Exposed via MCP:** Available as MCP tool
4. **Dashboard UI:** Accessible from Skills page

## Permissions Required

- `network:http` - Make HTTP requests
- `network:https` - Make HTTPS requests
- `api:brave` - Access Brave Search API
- `api:serper` - Access Serper API

## Roadmap

- [ ] Support for news search
- [ ] Support for image search
- [ ] Search result caching
- [ ] Custom search engines
- [ ] Search history tracking

## License

MIT

## Support

For issues or questions, see [Agentik OS documentation](../../docs/skills-guide.md).
