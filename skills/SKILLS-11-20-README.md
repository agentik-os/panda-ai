# Official Marketplace Skills 11-20

This directory contains the second batch of 10 official Agentik OS marketplace skills (skills 11-20).

## Skills Overview

### Communication Skills

#### 11. Twitter/X API (`skills/twitter/`)
- **Description**: Post tweets, read timeline, manage DMs, interact with Twitter API v2
- **Dependencies**: `twitter-api-v2@^1.17.2`
- **Rate Limit**: 100 requests per 15 minutes
- **Key Features**:
  - Post tweets with media/replies
  - Read home timeline
  - Send direct messages
  - Search tweets
  - Get user profiles

#### 12. LinkedIn API (`skills/linkedin/`)
- **Description**: Professional networking, post updates, manage connections
- **Dependencies**: `axios@^1.6.0`
- **Rate Limit**: 100 requests per 24 hours
- **Key Features**:
  - Create posts
  - Share content
  - Get profile information

#### 13. Slack Integration (`skills/slack/`)
- **Description**: Send messages, manage channels, create threads
- **Dependencies**: `@slack/web-api@^7.0.0`
- **Rate Limit**: 50 requests per minute
- **Key Features**:
  - Send messages to channels
  - Create channels
  - List channels
  - Thread support

#### 14. Discord Bot (`skills/discord/`)
- **Description**: Manage Discord servers, send messages, create channels
- **Dependencies**: `discord.js@^14.16.0`
- **Rate Limit**: 50 requests per second
- **Key Features**:
  - Send messages to channels
  - Get guild information
  - Channel management

#### 17. SendGrid Email (`skills/sendgrid/`)
- **Description**: Send transactional emails, manage templates
- **Dependencies**: `@sendgrid/mail@^8.1.3`
- **Rate Limit**: 100 requests per second
- **Key Features**:
  - Send single emails
  - Send bulk emails
  - Use templates with dynamic data

### Development & Automation

#### 15. GitHub Actions (`skills/github-actions/`)
- **Description**: Trigger workflows, manage CI/CD pipelines
- **Dependencies**: `@octokit/rest@^21.0.0`
- **Rate Limit**: 5000 requests per hour
- **Key Features**:
  - Trigger workflow runs
  - List workflows
  - Get workflow run status

### Payments

#### 16. Stripe Payments (`skills/stripe/`)
- **Description**: Process payments, manage subscriptions, create invoices
- **Dependencies**: `stripe@^17.6.0`
- **Rate Limit**: 100 requests per second
- **Key Features**:
  - Create customers
  - Create payment intents
  - Manage subscriptions
  - List customers

### Messaging

#### 18. Twilio SMS (`skills/twilio/`)
- **Description**: Send SMS messages, make calls
- **Dependencies**: `twilio@^5.3.0`
- **Rate Limit**: 60 requests per minute
- **Key Features**:
  - Send SMS messages
  - Make phone calls
  - List message history

### Data & Information

#### 19. Weather API (`skills/weather/`)
- **Description**: Get weather forecasts, current conditions, alerts
- **Dependencies**: `axios@^1.6.0`
- **API Provider**: OpenWeatherMap
- **Rate Limit**: 60 requests per minute
- **Key Features**:
  - Current weather by city/coordinates
  - Weather forecasts (5-day)
  - Support for metric/imperial units

#### 20. News Aggregator (`skills/news/`)
- **Description**: Fetch news articles, headlines, sources
- **Dependencies**: `axios@^1.6.0`
- **API Provider**: NewsAPI
- **Rate Limit**: 100 requests per day
- **Key Features**:
  - Top headlines by country/category
  - Search news articles
  - Get news sources
  - Filter by language/date

## Skill Structure

Each skill follows the standard Agentik OS skill structure:

```
skills/{skill-name}/
├── skill.json           # Manifest with metadata, permissions, config
├── package.json         # NPM package configuration
├── tsconfig.json        # TypeScript configuration
├── vitest.config.ts     # Testing configuration
├── src/
│   ├── index.ts        # Main skill implementation (extends SkillBase)
│   └── types.ts        # TypeScript type definitions (if needed)
└── tests/
    └── index.test.ts   # Unit tests
```

## Implementation Details

All skills:
- Extend `SkillBase<InputType, OutputType>` from `@agentik-os/sdk`
- Implement required methods: `execute()` and `validate()`
- Include rate limiting where appropriate
- Define proper permissions in skill.json
- Support configuration via environment variables
- Include error handling and proper error types

## Installation

Skills can be installed via the Agentik OS marketplace:

```bash
panda skill install {skill-name}
```

Or programmatically:

```typescript
import { createTwitterSkill } from '@agentik-os/skill-twitter';

const twitter = createTwitterSkill({
  apiKey: process.env.TWITTER_API_KEY!,
  apiSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
});

await twitter.postTweet({ text: 'Hello from Agentik OS!' });
```

## Testing

Run tests for all skills:

```bash
pnpm test
```

Run tests for a specific skill:

```bash
cd skills/{skill-name}
pnpm test
```

Type check:

```bash
pnpm type-check
```

## Requirements

- Node.js >=18
- TypeScript >=5.7
- Appropriate API keys/credentials for each service

## License

MIT

---

**Built by**: Skills Builder #2
**Build Date**: 2026-02-14
**Status**: ✅ Complete
