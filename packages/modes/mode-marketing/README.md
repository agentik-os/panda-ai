# Marketing Mode

**Marketing strategy, campaigns, and growth assistant**

## Overview

Marketing Mode provides specialized assistance for marketing strategy, campaign planning, and growth initiatives. It includes agents optimized for campaign management, SEO, and content marketing.

## Features

- **Campaign Planning**: Multi-channel campaigns, launch strategies, A/B testing
- **SEO Strategy**: Keyword research, on-page optimization, link building
- **Content Marketing**: Blog strategy, social media, email campaigns
- **Analytics**: Attribution modeling, conversion tracking, ROI analysis
- **Growth Hacking**: Viral loops, referral programs, acquisition funnels

## Agents

### Campaign Manager
- **Role**: Plans and executes marketing campaigns
- **Model**: Claude Sonnet 4.5
- **Skills**: web-search, analytics-tracking, social-content, email-sequence

### SEO Specialist
- **Role**: Optimizes for search engine visibility
- **Model**: Claude Sonnet 4.5
- **Skills**: web-search, seo-audit, schema-markup, programmatic-seo

### Content Marketer
- **Role**: Creates content strategy and execution plans
- **Model**: Claude Haiku 4.5
- **Skills**: web-search, social-content, email-sequence

## Recommended Skills

- `web-search` - Market research and competitive analysis
- `analytics-tracking` - Set up tracking and measure performance
- `social-content` - Create and schedule social media content
- `email-sequence` - Build automated email campaigns
- `seo-audit` - Technical SEO analysis
- `ads` - Paid advertising optimization

## Example Workflows

### Product Launch Campaign (2-3 weeks)
1. **Research**: Market analysis, competitor research
2. **Positioning**: Messaging, value props, target audience
3. **Channel Strategy**: Owned, earned, paid mix
4. **Content Calendar**: Blog posts, social, email sequence
5. **Launch Plan**: Timing, coordination, metrics
6. **Measurement**: Analytics setup, attribution, dashboards

### SEO Content Strategy (4-6 weeks)
1. **Keyword Research**: Search volume, difficulty, intent
2. **Content Audit**: Existing content analysis
3. **Content Gaps**: Opportunities, topic clusters
4. **Content Plan**: Editorial calendar, writers
5. **Optimization**: On-page SEO, internal linking
6. **Tracking**: Rankings, traffic, conversions

### Lead Generation Funnel (3-4 weeks)
1. **Audience Research**: ICP, personas, pain points
2. **Lead Magnet**: Ebook, template, webinar
3. **Landing Pages**: Copy, design, forms
4. **Email Nurture**: Drip campaign, automation
5. **Conversion Optimization**: A/B testing, CRO
6. **Measurement**: Conversion rates, cost per lead

## Configuration

- **Temperature**: 0.6 (balanced creativity and strategy)
- **Max Tokens**: 4096

## Usage

```typescript
import { marketingModeConfig, MARKETING_MODE_SYSTEM_PROMPT, MARKETING_MODE_AGENTS } from '@agentik-os/mode-marketing';

// Use in your agent runtime
const agent = new Agent({
  mode: marketingModeConfig,
  systemPrompt: MARKETING_MODE_SYSTEM_PROMPT,
});
```
