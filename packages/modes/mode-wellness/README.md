# Wellness Mode

**Health and wellness coaching assistant**

## Overview

Wellness Mode provides specialized assistance for holistic health, fitness, and personal development. It includes agents optimized for health coaching and habit formation.

## Features

- **Health & Fitness Coaching**: Exercise programs, nutrition guidance
- **Nutrition Guidance**: Meal planning, macros, healthy eating habits
- **Sleep Optimization**: Sleep hygiene, schedule, environment
- **Stress Management**: Mindfulness, breathing, coping strategies
- **Habit Formation**: Atomic Habits, Tiny Habits frameworks
- **Mental Wellness**: Self-care, therapy support, emotional health

## Agents

### Health Coach
- **Role**: Provides personalized health advice
- **Model**: Claude Sonnet 4.5
- **Skills**: web-search, file-operations

### Habit Coach
- **Role**: Helps build sustainable habits
- **Model**: Claude Haiku 4.5 (quick habit check-ins)
- **Skills**: web-search

## Recommended Skills

- `web-search` - Research health topics and best practices
- `file-operations` - Track progress and plans

## Example Workflows

### Personalized Fitness Plan (2-3 hours)
1. **Assessment**: Current fitness, goals, constraints, injuries
2. **Goal Setting**: SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)
3. **Program Design**: Exercise selection, sets/reps, progression
4. **Schedule**: Weekly plan with rest days
5. **Nutrition**: Calorie target, macros, meal ideas
6. **Tracking**: Progress metrics, adjustments

### Habit Formation Program (4-6 weeks)
1. **Identify Habit**: What do you want to build?
2. **Make it Obvious**: Cues, environment design
3. **Make it Attractive**: Temptation bundling, motivation
4. **Make it Easy**: Start tiny, reduce friction
5. **Make it Satisfying**: Immediate rewards, tracking
6. **Review**: Weekly check-ins, adjust strategy

### Sleep Optimization Plan (1-2 weeks)
1. **Sleep Audit**: Current patterns, quality, issues
2. **Sleep Hygiene**: Environment, temperature, light
3. **Bedtime Routine**: Wind-down activities, consistency
4. **Lifestyle Factors**: Caffeine, alcohol, exercise timing
5. **Tracking**: Sleep log, identify patterns
6. **Adjustment**: Iterate based on results

## Wellness Pillars

1. **Physical**: Exercise, nutrition, sleep
2. **Mental**: Mindfulness, stress management, therapy
3. **Social**: Relationships, community, support
4. **Purpose**: Goals, values, meaning

## Configuration

- **Temperature**: 0.5 (balance empathy and evidence-based advice)
- **Max Tokens**: 4096

## Important Note

This mode provides general wellness guidance only. Always recommend professional help (doctors, therapists, nutritionists) when needed.

## Usage

```typescript
import { wellnessModeConfig, WELLNESS_MODE_SYSTEM_PROMPT, WELLNESS_MODE_AGENTS } from '@agentik-os/mode-wellness';

// Use in your agent runtime
const agent = new Agent({
  mode: wellnessModeConfig,
  systemPrompt: WELLNESS_MODE_SYSTEM_PROMPT,
});
```
