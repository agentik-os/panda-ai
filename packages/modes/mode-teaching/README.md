# Teaching Mode

**Educational content and instruction assistant**

## Overview

Teaching Mode provides specialized assistance for curriculum design, lesson planning, and educational content creation. It includes agents optimized for course design and one-on-one tutoring.

## Features

- **Lesson Planning**: Learning objectives, activities, assessments
- **Curriculum Design**: Structured learning paths, course modules
- **Explanatory Content**: Clear explanations with examples
- **Assessment Design**: Quizzes, tests, rubrics, formative assessment
- **Learning Path Recommendations**: Personalized learning journeys
- **Adaptive Teaching**: Different learning styles, scaffolding

## Agents

### Curriculum Designer
- **Role**: Creates structured learning paths and courses
- **Model**: Claude Sonnet 4.5
- **Skills**: web-search, file-operations

### Tutor
- **Role**: One-on-one instruction, explains concepts clearly
- **Model**: Claude Sonnet 4.5
- **Skills**: web-search, file-operations

## Recommended Skills

- `web-search` - Research topics and pedagogical best practices
- `file-operations` - Create lesson materials and assessments

## Example Workflows

### Course Design (2-4 weeks)
1. **Learning Objectives**: What students will be able to do
2. **Prerequisites**: Required prior knowledge
3. **Module Outline**: 4-8 modules with clear progression
4. **Lesson Plans**: Activities, examples, practice exercises
5. **Assessments**: Quizzes, projects, final exam
6. **Resources**: Readings, videos, tools

### Lesson Plan (2-4 hours)
1. **Hook**: Engage students, activate prior knowledge
2. **Learning Objective**: Clear, measurable goal
3. **Direct Instruction**: Explanation with examples
4. **Guided Practice**: Students try with support
5. **Independent Practice**: Students work alone
6. **Assessment**: Check understanding, provide feedback

### Tutoring Session (30-60 min)
1. **Assess Understanding**: Where is the student stuck?
2. **Explain Concept**: Use analogies, examples, visuals
3. **Practice Together**: Walk through problems step-by-step
4. **Student Practice**: Monitor, provide hints
5. **Check Understanding**: Ask questions, identify gaps
6. **Next Steps**: Homework, resources, follow-up

## Teaching Principles

1. **Start with prior knowledge** - Build on what students know
2. **Clear learning objectives** - Students know what they'll learn
3. **Active learning** - Examples, exercises, not just lecture
4. **Immediate feedback** - Correct misconceptions quickly
5. **Spaced repetition** - Review key concepts over time

## Bloom's Taxonomy

- Remember → Understand → Apply → Analyze → Evaluate → Create

## Configuration

- **Temperature**: 0.5 (balance clarity and creativity)
- **Max Tokens**: 4096

## Usage

```typescript
import { teachingModeConfig, TEACHING_MODE_SYSTEM_PROMPT, TEACHING_MODE_AGENTS } from '@agentik-os/mode-teaching';

// Use in your agent runtime
const agent = new Agent({
  mode: teachingModeConfig,
  systemPrompt: TEACHING_MODE_SYSTEM_PROMPT,
});
```
