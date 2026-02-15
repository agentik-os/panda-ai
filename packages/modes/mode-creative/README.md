# Creative Mode

**Creative brainstorming and ideation assistant**

## Overview

Creative Mode provides specialized assistance for brainstorming, ideation, and innovative thinking. It includes agents optimized for creative concept generation and brand strategy.

## Features

- **Brainstorming**: SCAMPER, Six Thinking Hats, mind mapping
- **Design Thinking**: Workshops, prototyping, user testing
- **Creative Problem-Solving**: Lateral thinking, forced connections
- **Brand Naming**: Memorable names, taglines, messaging
- **Campaign Concepts**: Big ideas, creative executions
- **Product Innovation**: New features, pivots, blue ocean strategy

## Agents

### Creative Director
- **Role**: Leads creative ideation sessions
- **Model**: Claude Sonnet 4.5
- **Skills**: web-search, brainstorming

### Brand Strategist
- **Role**: Develops brand identities and positioning
- **Model**: Claude Sonnet 4.5
- **Skills**: web-search, brainstorming, marketing-psychology

## Recommended Skills

- `web-search` - Inspiration and competitive research
- `brainstorming` - Structured ideation techniques
- `marketing-psychology` - Persuasion and influence principles

## Example Workflows

### Brand Naming Sprint (2-3 hours)
1. **Discovery**: Brand values, target audience, positioning
2. **Diverge**: Generate 100+ name ideas (no filtering)
3. **Categorize**: Group by theme, style, approach
4. **Converge**: Shortlist top 10-15 names
5. **Test**: Domain availability, trademark, pronunciation
6. **Finalize**: Choose 3-5 finalists with taglines

### Creative Campaign (1 week)
1. **Brief**: Objectives, audience, constraints
2. **Research**: Market, competitors, cultural trends
3. **Ideation**: Brainstorm big ideas (quantity over quality)
4. **Concepts**: Develop 3-5 campaign concepts
5. **Execution**: Mockups, storyboards, scripts
6. **Pitch**: Present concepts with rationale

### Product Innovation Workshop (1 day)
1. **Challenge**: Define problem to solve
2. **SCAMPER**: Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, Reverse
3. **Crazy 8s**: 8 ideas in 8 minutes (rapid sketching)
4. **Dot Voting**: Team selects best ideas
5. **Prototype**: Quick mockup or MVP
6. **Feedback**: User testing, iteration

## Creative Techniques

- **SCAMPER**: Innovation framework
- **Six Thinking Hats**: Different perspectives (logic, emotion, creativity, caution, optimism, process)
- **Mind Mapping**: Visual thinking
- **Forced Connections**: Combine unrelated concepts
- **Reverse Thinking**: Start with opposite outcome

## Configuration

- **Temperature**: 0.9 (maximum creativity)
- **Max Tokens**: 4096

## Usage

```typescript
import { creativeModeConfig, CREATIVE_MODE_SYSTEM_PROMPT, CREATIVE_MODE_AGENTS } from '@agentik-os/mode-creative';

// Use in your agent runtime
const agent = new Agent({
  mode: creativeModeConfig,
  systemPrompt: CREATIVE_MODE_SYSTEM_PROMPT,
});
```
