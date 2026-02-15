# Support Mode

**Customer support excellence and troubleshooting assistant**

## Overview

Support Mode provides specialized assistance for customer support operations, technical troubleshooting, and customer satisfaction. It includes agents optimized for ticket handling and complex issue resolution.

## Features

- **Ticket Triaging**: Prioritization, categorization, routing
- **Technical Troubleshooting**: Debug, root cause analysis, resolution
- **Knowledge Base**: Article writing, FAQ management, search optimization
- **Escalation Handling**: When and how to escalate, handoff notes
- **Customer Satisfaction**: CSAT measurement, feedback analysis, improvements

## Agents

### Support Agent
- **Role**: Handles customer inquiries with empathy and efficiency
- **Model**: Claude Haiku 4.5 (fast responses)
- **Skills**: web-search, file-operations

### Troubleshooter
- **Role**: Technical expert for complex issue resolution
- **Model**: Claude Sonnet 4.5
- **Skills**: web-search, file-operations, systematic-debugging

## Recommended Skills

- `web-search` - Research solutions and documentation
- `file-operations` - Access logs and configuration
- `systematic-debugging` - Root cause analysis
- `debugging-wizard` - Advanced troubleshooting

## Example Workflows

### Ticket Resolution (30 min - 2 hours)
1. **Acknowledge**: Quick first response, empathy
2. **Understand**: Clarifying questions, reproduce issue
3. **Research**: Knowledge base, documentation, similar tickets
4. **Resolve**: Solution, workaround, or escalation
5. **Follow-up**: Verify resolution, customer satisfaction
6. **Document**: Update knowledge base

### Technical Investigation (2-4 hours)
1. **Gather Context**: Logs, environment, steps to reproduce
2. **Hypothesis**: What could cause this?
3. **Test**: Isolate variables, try solutions
4. **Root Cause**: Why did it happen?
5. **Fix**: Permanent solution or workaround
6. **Prevention**: How to prevent in future

### Knowledge Base Article (1-2 hours)
1. **Identify**: Common question, frequent issue
2. **Research**: All related information
3. **Write**: Clear steps, screenshots, examples
4. **Review**: Accuracy, clarity, completeness
5. **Optimize**: SEO, keywords, searchability
6. **Maintain**: Regular updates, feedback incorporation

## Support Principles

1. **Empathy first** - Acknowledge frustration
2. **Clear communication** - No jargon
3. **Fast resolution** - Aim for first-contact fix
4. **Proactive** - Prevent future issues
5. **Follow-up** - Ensure resolution

## Configuration

- **Temperature**: 0.5 (balance empathy and precision)
- **Max Tokens**: 4096

## Usage

```typescript
import { supportModeConfig, SUPPORT_MODE_SYSTEM_PROMPT, SUPPORT_MODE_AGENTS } from '@agentik-os/mode-support';

// Use in your agent runtime
const agent = new Agent({
  mode: supportModeConfig,
  systemPrompt: SUPPORT_MODE_SYSTEM_PROMPT,
});
```
