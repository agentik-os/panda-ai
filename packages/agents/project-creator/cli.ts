#!/usr/bin/env node

/**
 * Project Creator Agent - CLI Entry Point
 *
 * Usage:
 *   pnpm --filter @agentik/project-creator create
 *   pnpm --filter @agentik/project-creator create --idea "Build a time tracking app for freelancers"
 *   pnpm --filter @agentik/project-creator create --output ./my-new-project
 */

import { ProjectCreatorAgent } from './index.js';
import Anthropic from '@anthropic-ai/sdk';
import { mkdir } from 'fs/promises';
import { join } from 'path';

// ============================================================================
// CLI ARGUMENTS PARSING
// ============================================================================

interface CLIArgs {
  idea?: string;
  output?: string;
  budget?: number;
  help?: boolean;
}

function parseArgs(): CLIArgs {
  const args: CLIArgs = {};

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--idea' && process.argv[i + 1]) {
      args.idea = process.argv[i + 1];
      i++;
    } else if (arg === '--output' && process.argv[i + 1]) {
      args.output = process.argv[i + 1];
      i++;
    } else if (arg === '--budget' && process.argv[i + 1]) {
      args.budget = parseFloat(process.argv[i + 1]);
      i++;
    }
  }

  return args;
}

function printHelp(): void {
  console.log(`
🚀 Project Creator Agent - CLI

DESCRIPTION:
  AI Agent that orchestrates end-to-end project creation from idea to MVP.
  Generates branding, PRD, stack selection, and coordinates team development.

USAGE:
  pnpm --filter @agentik/project-creator create [OPTIONS]

OPTIONS:
  --idea <text>       Initial project idea (optional, will prompt if not provided)
  --output <dir>      Output directory for project files (default: ./output)
  --budget <number>   Max AI cost budget in dollars (default: $10)
  -h, --help          Show this help message

EXAMPLES:
  # Interactive mode (no idea provided)
  pnpm --filter @agentik/project-creator create

  # With initial idea
  pnpm --filter @agentik/project-creator create --idea "Build a SaaS for managing freelance invoices"

  # Custom output directory and budget
  pnpm --filter @agentik/project-creator create --output ./my-project --budget 5

PHASES:
  1. Discovery & Requirements Gathering
  2. Branding & Identity
  3. PRD Generation
  4. Stack Selection & Justification
  5. Team Spawning & Coordination
  6. Quality Assurance Orchestration
  7. Deployment & Handoff

OUTPUT:
  - PROJECT_DISCOVERY.json    (Requirements and user answers)
  - BRANDING.json              (Product name, colors, positioning)
  - PRD.md / PRD.json          (Complete Product Requirements Document)
  - STACK_SELECTION.json       (Recommended tech stack with reasoning)
  - TEAM_ASSIGNMENTS.json      (AI team composition and tasks)
  - QA_REPORT.json             (Test results and bug findings)
  - DEPLOYMENT.json            (Deployment instructions and credentials)

COST:
  Typical project creation costs $3-10 in AI API calls.
  Most of the cost comes from PRD generation and branding phases.

ENVIRONMENT:
  ANTHROPIC_API_KEY must be set in environment or .env file
`);
}

// ============================================================================
// MAIN CLI FUNCTION
// ============================================================================

async function main() {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  console.log('🚀 Project Creator Agent - Starting...\n');

  // Validate API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
    console.error('   Set it in .env or export it in your shell');
    process.exit(1);
  }

  // Initialize AI client
  const anthropic = new Anthropic({ apiKey });

  // Simple AI client wrapper for compatibility
  const aiClient = {
    async generateText(prompt: string): Promise<string> {
      const message = await anthropic.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const textContent = message.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response');
      }

      return textContent.text;
    },
  };

  // Determine output directory
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const defaultOutput = join(process.cwd(), 'output', `project-${timestamp}`);
  const outputDir = args.output || defaultOutput;

  // Create output directory
  await mkdir(outputDir, { recursive: true });

  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`💰 Budget: $${args.budget || 10}\n`);

  // Initialize Project Creator Agent
  const agent = new ProjectCreatorAgent({
    aiClient,
    outputDir,
    budget: {
      aiCosts: args.budget || 10,
    },
  });

  try {
    // Run project creation workflow
    const result = await agent.createProject(args.idea);

    // Print summary
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║           PROJECT CREATION COMPLETE! 🎉               ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📦 Project Name:     ${result.branding.selectedName}`);
    console.log(`🎯 Positioning:      ${result.branding.tagline}`);
    console.log(`📁 Location:         ${result.projectPath}`);
    console.log(`💰 Total AI Cost:    $${result.totalCost.toFixed(2)}`);
    console.log(`⏱️  Duration:         ${(result.duration / 1000 / 60).toFixed(1)} minutes`);
    console.log('');
    console.log('📄 Generated Files:');
    console.log('   ✓ PROJECT_DISCOVERY.json');
    console.log('   ✓ BRANDING.json');
    console.log('   ✓ PRD.md / PRD.json');
    console.log('   ✓ STACK_SELECTION.json');
    console.log('   ✓ TEAM_ASSIGNMENTS.json');
    console.log('   ✓ QA_REPORT.json');
    console.log('   ✓ DEPLOYMENT.json');
    console.log('');
    console.log('🎨 Branding:');
    console.log(`   Product Name:     ${result.branding.selectedName}`);
    console.log(`   Tagline:          ${result.branding.tagline}`);
    console.log(`   Color Palette:    ${result.branding.selectedPalette}`);
    console.log(`   Primary Color:    ${result.branding.colorPalettes[0].colors.primary.hex}`);
    console.log('');
    console.log('🛠️  Tech Stack:');
    console.log(`   Frontend:         ${result.stack.recommended.frontend}`);
    console.log(`   Backend:          ${result.stack.recommended.backend}`);
    console.log(`   Database:         ${result.stack.recommended.database}`);
    console.log(`   Auth:             ${result.stack.recommended.auth}`);
    console.log(`   Deployment:       ${result.stack.recommended.deployment}`);
    console.log('');
    console.log('👥 Team Assignments:');
    result.team.forEach((agent) => {
      console.log(`   ${agent.agent.padEnd(15)} (${agent.model})`);
      console.log(`      Role: ${agent.role}`);
    });
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Review the generated PRD and branding');
    console.log('   2. Make any adjustments to the stack selection');
    console.log('   3. Spawn the AI team to build the project');
    console.log('   4. Run QA tests before deployment');
    console.log('   5. Deploy to production');
    console.log('');
    console.log(`📂 All files saved to: ${outputDir}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during project creation:');
    console.error(error);
    process.exit(1);
  }
}

// Run CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
