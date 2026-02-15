/**
 * Smart Stack Selection Phase
 *
 * Analyzes project requirements from PRD and recommends optimal tech stack:
 * - Evaluates project type (SaaS, landing page, mobile, API)
 * - Considers required features (real-time, auth, payments, etc.)
 * - Analyzes technical constraints
 * - Recommends stack with detailed reasoning
 * - Provides 2-3 alternatives with tradeoffs
 * - Estimates monthly costs
 */

import { PRDOutput } from './prd.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface StackComponent {
  name: string;
  version?: string;
  reasoning: string;
}

export interface StackRecommendation {
  frontend: StackComponent;
  backend: StackComponent;
  database: StackComponent;
  auth: StackComponent;
  payments?: StackComponent;
  deployment: StackComponent;
  monitoring?: StackComponent;
  ai?: StackComponent;
}

export interface Alternative {
  name: string;
  whenToChoose: string;
  tradeoffs: string;
  costDelta?: string;
}

export interface CostEstimate {
  monthly: {
    min: number;
    max: number;
    breakdown: Array<{
      service: string;
      cost: string;
      notes?: string;
    }>;
  };
  annual: {
    min: number;
    max: number;
  };
}

export interface StackSelection {
  // Recommended stack
  recommended: StackRecommendation;
  reasoning: string;

  // Alternatives
  alternatives: Alternative[];

  // Cost estimates
  estimatedCosts: CostEstimate;

  // Implementation details
  packages: string[];
  envVars: string[];
  devCommands: Record<string, string>;
  estimatedSetupTime: string;
  estimatedBuildTime: string;

  // Pros/cons
  pros: string[];
  cons: string[];

  // Template metadata
  templateUsed?: string;
  customizations?: string[];
}

// Template structure (from JSON files)
interface StackTemplate {
  name: string;
  description: string;
  useCase: string;
  stack: any;
  packages: string[];
  envVars: string[];
  devCommands: Record<string, string>;
  estimatedSetupTime: string;
  estimatedBuildTime: string;
  monthlyCost: Record<string, string>;
  pros: string[];
  cons: string[];
  whenToUse: string[];
  alternatives: Array<{
    name: string;
    whenToChoose: string;
    tradeoffs: string;
  }>;
}

// ============================================================================
// TEMPLATE LOADING
// ============================================================================

async function loadStackTemplate(templateName: string): Promise<StackTemplate> {
  const templatePath = join(
    __dirname,
    '../templates/stack-configs',
    `${templateName}.json`
  );

  const content = await readFile(templatePath, 'utf-8');
  return JSON.parse(content);
}

async function loadAllTemplates(): Promise<StackTemplate[]> {
  return Promise.all([
    loadStackTemplate('saas-nextjs-convex'),
    loadStackTemplate('landing-page-nextjs'),
  ]);
}

// ============================================================================
// PROJECT ANALYSIS
// ============================================================================

interface ProjectRequirements {
  type: 'saas' | 'landing-page' | 'mobile' | 'api' | 'hybrid';
  needsRealtime: boolean;
  needsAuth: boolean;
  needsPayments: boolean;
  needsDatabase: boolean;
  needsAI: boolean;
  complexity: 'simple' | 'medium' | 'complex';
  timeline: 'fast' | 'medium' | 'long';
  budgetConstraint: 'low' | 'medium' | 'high';
}

function analyzeProjectRequirements(prd: PRDOutput): ProjectRequirements {
  // Determine project type
  let type: ProjectRequirements['type'] = 'saas';

  const problemLower = prd.problemStatement.toLowerCase();
  const featuresText = prd.mvpFeatures
    .map((f) => f.name + ' ' + f.description)
    .join(' ')
    .toLowerCase();

  if (
    problemLower.includes('landing') ||
    problemLower.includes('marketing') ||
    prd.mvpFeatures.length <= 3
  ) {
    type = 'landing-page';
  } else if (
    featuresText.includes('subscription') ||
    featuresText.includes('dashboard') ||
    featuresText.includes('user')
  ) {
    type = 'saas';
  }

  // Analyze feature requirements
  const needsRealtime =
    featuresText.includes('real-time') ||
    featuresText.includes('realtime') ||
    featuresText.includes('live') ||
    featuresText.includes('collaboration') ||
    featuresText.includes('chat');

  const needsAuth =
    featuresText.includes('login') ||
    featuresText.includes('auth') ||
    featuresText.includes('user') ||
    featuresText.includes('account') ||
    type === 'saas';

  const needsPayments =
    featuresText.includes('payment') ||
    featuresText.includes('subscription') ||
    featuresText.includes('billing') ||
    featuresText.includes('stripe') ||
    prd.pricingTiers.length > 1;

  const needsDatabase =
    type === 'saas' ||
    prd.mvpFeatures.length > 5 ||
    featuresText.includes('database') ||
    featuresText.includes('store') ||
    featuresText.includes('save');

  const needsAI =
    featuresText.includes('ai') ||
    featuresText.includes('llm') ||
    featuresText.includes('gpt') ||
    featuresText.includes('chatbot') ||
    featuresText.includes('intelligent');

  // Determine complexity
  const featureCount = prd.mvpFeatures.length;
  let complexity: ProjectRequirements['complexity'] = 'medium';

  if (featureCount <= 3 && !needsRealtime && !needsAI) {
    complexity = 'simple';
  } else if (featureCount > 8 || needsRealtime || needsAI) {
    complexity = 'complex';
  }

  // Timeline analysis (from milestones)
  const timeline: ProjectRequirements['timeline'] =
    prd.milestones.length <= 3 ? 'fast' : prd.milestones.length <= 6 ? 'medium' : 'long';

  // Budget constraint
  const budgetText = prd.budget.total.toLowerCase();
  let budgetConstraint: ProjectRequirements['budgetConstraint'] = 'medium';

  if (budgetText.includes('low') || budgetText.includes('minimal')) {
    budgetConstraint = 'low';
  } else if (budgetText.includes('high') || budgetText.includes('unlimited')) {
    budgetConstraint = 'high';
  }

  return {
    type,
    needsRealtime,
    needsAuth,
    needsPayments,
    needsDatabase,
    needsAI,
    complexity,
    timeline,
    budgetConstraint,
  };
}

// ============================================================================
// AI-POWERED STACK EVALUATION
// ============================================================================

async function evaluateStackWithAI(
  prd: PRDOutput,
  requirements: ProjectRequirements,
  templates: StackTemplate[],
  aiClient: { generateText(prompt: string): Promise<string> }
): Promise<{ templateIndex: number; reasoning: string; customizations: string[] }> {
  const prompt = `You are a senior technical architect. Analyze this project and recommend the best tech stack.

**Project:** ${prd.projectName}
**Problem:** ${prd.problemStatement}
**Solution:** ${prd.solutionStatement}

**MVP Features:**
${prd.mvpFeatures.map((f, i) => `${i + 1}. ${f.name}: ${f.description}`).join('\n')}

**User Personas:**
${prd.personas.map((p) => `- ${p.name} (${p.occupation}): ${p.userStory}`).join('\n')}

**Requirements Analysis:**
- Type: ${requirements.type}
- Needs Real-time: ${requirements.needsRealtime}
- Needs Auth: ${requirements.needsAuth}
- Needs Payments: ${requirements.needsPayments}
- Needs Database: ${requirements.needsDatabase}
- Needs AI: ${requirements.needsAI}
- Complexity: ${requirements.complexity}
- Timeline: ${requirements.timeline}
- Budget: ${requirements.budgetConstraint}

**Available Stack Templates:**
${templates.map((t, i) => `${i + 1}. ${t.name}
   Use Case: ${t.useCase}
   When to Use: ${t.whenToUse.join(', ')}
   Monthly Cost: ${t.monthlyCost.total}
`).join('\n')}

**Task:**
1. Choose the best template (respond with just the number 1 or 2)
2. Explain your reasoning in 2-3 sentences
3. List any customizations needed (one per line, starting with "- ")

Format your response EXACTLY like this:
TEMPLATE: [1 or 2]
REASONING: [your reasoning here]
CUSTOMIZATIONS:
- [customization 1]
- [customization 2]`;

  const response = await aiClient.generateText(prompt);

  // Parse AI response
  const templateMatch = response.match(/TEMPLATE:\s*(\d+)/);
  const reasoningMatch = response.match(/REASONING:\s*(.+?)(?=CUSTOMIZATIONS:|$)/s);
  const customizationsMatch = response.match(/CUSTOMIZATIONS:\s*([\s\S]+)/);

  const templateIndex = templateMatch ? parseInt(templateMatch[1]) - 1 : 0;
  const reasoning =
    reasoningMatch?.[1]?.trim() || 'Recommended based on project requirements.';

  const customizations: string[] = [];
  if (customizationsMatch) {
    const lines = customizationsMatch[1].split('\n');
    for (const line of lines) {
      const clean = line.trim();
      if (clean.startsWith('- ')) {
        customizations.push(clean.substring(2));
      }
    }
  }

  return {
    templateIndex: Math.min(Math.max(templateIndex, 0), templates.length - 1),
    reasoning,
    customizations,
  };
}

// ============================================================================
// STACK GENERATION
// ============================================================================

function buildStackRecommendation(
  template: StackTemplate,
  requirements: ProjectRequirements
): StackRecommendation {
  const stack = template.stack;

  return {
    frontend: {
      name: stack.frontend.framework,
      version: 'latest',
      reasoning: stack.frontend.reasoning,
    },
    backend: {
      name: stack.backend?.platform || 'None',
      reasoning: stack.backend?.reasoning || 'Static site - no backend required',
    },
    database: {
      name: stack.backend?.database || 'None',
      reasoning:
        stack.backend?.reasoning || 'Static site - content managed via MDX/CMS',
    },
    auth: requirements.needsAuth
      ? {
          name: stack.auth?.provider || 'Clerk',
          reasoning: stack.auth?.reasoning || 'Production-ready auth provider',
        }
      : {
          name: 'None',
          reasoning: 'Public site - no authentication required',
        },
    payments: requirements.needsPayments
      ? {
          name: stack.payments?.provider || 'Stripe',
          reasoning: stack.payments?.reasoning || 'Industry-standard payment processing',
        }
      : undefined,
    deployment: {
      name: stack.deployment.platform,
      reasoning: stack.deployment.reasoning,
    },
    monitoring: stack.monitoring
      ? {
          name: `${stack.monitoring.errors}, ${stack.monitoring.analytics}`,
          reasoning: stack.monitoring.reasoning,
        }
      : undefined,
    ai: requirements.needsAI && stack.ai
      ? {
          name: stack.ai.provider,
          reasoning: stack.ai.reasoning,
        }
      : undefined,
  };
}

function buildCostEstimate(template: StackTemplate): CostEstimate {
  // Parse monthly cost from template
  const totalCost = template.monthlyCost.total;

  // Extract min-max from "$X-Y/month" or "$X/month" format
  const match = totalCost.match(/\$(\d+)(?:-(\d+))?/);
  const min = match ? parseInt(match[1]) : 0;
  const max = match?.[2] ? parseInt(match[2]) : min;

  // Build breakdown
  const breakdown: CostEstimate['monthly']['breakdown'] = [];
  for (const [service, cost] of Object.entries(template.monthlyCost)) {
    if (service !== 'total') {
      breakdown.push({
        service: service.charAt(0).toUpperCase() + service.slice(1),
        cost: cost as string,
      });
    }
  }

  return {
    monthly: {
      min,
      max,
      breakdown,
    },
    annual: {
      min: min * 12,
      max: max * 12,
    },
  };
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function selectStack(
  prd: PRDOutput,
  aiClient: { generateText(prompt: string): Promise<string> }
): Promise<StackSelection> {
  console.log('  📊 Analyzing project requirements...');

  // Load templates
  const templates = await loadAllTemplates();

  // Analyze project
  const requirements = analyzeProjectRequirements(prd);

  console.log(`  🔍 Project Type: ${requirements.type}`);
  console.log(`  ⚡ Real-time: ${requirements.needsRealtime}`);
  console.log(`  🔐 Auth: ${requirements.needsAuth}`);
  console.log(`  💳 Payments: ${requirements.needsPayments}`);
  console.log(`  🧠 AI: ${requirements.needsAI}`);
  console.log(`  📈 Complexity: ${requirements.complexity}`);

  // Use AI to evaluate and choose best template
  console.log('  🤖 Evaluating stack options with AI...');
  const evaluation = await evaluateStackWithAI(prd, requirements, templates, aiClient);

  const selectedTemplate = templates[evaluation.templateIndex];

  console.log(`  ✅ Selected: ${selectedTemplate.name}`);

  // Build stack recommendation
  const recommended = buildStackRecommendation(selectedTemplate, requirements);

  // Build alternatives (exclude selected template)
  const alternatives: Alternative[] = selectedTemplate.alternatives.map((alt) => ({
    name: alt.name,
    whenToChoose: alt.whenToChoose,
    tradeoffs: alt.tradeoffs,
  }));

  // Add other templates as alternatives
  for (let i = 0; i < templates.length; i++) {
    if (i !== evaluation.templateIndex) {
      const template = templates[i];
      alternatives.push({
        name: template.name,
        whenToChoose: template.useCase,
        tradeoffs: `Different use case: ${template.whenToUse.join(', ')}`,
        costDelta: template.monthlyCost.total,
      });
    }
  }

  // Build cost estimate
  const estimatedCosts = buildCostEstimate(selectedTemplate);

  // Build final result
  const result: StackSelection = {
    recommended,
    reasoning: evaluation.reasoning,
    alternatives,
    estimatedCosts,
    packages: selectedTemplate.packages,
    envVars: selectedTemplate.envVars,
    devCommands: selectedTemplate.devCommands,
    estimatedSetupTime: selectedTemplate.estimatedSetupTime,
    estimatedBuildTime: selectedTemplate.estimatedBuildTime,
    pros: selectedTemplate.pros,
    cons: selectedTemplate.cons,
    templateUsed: selectedTemplate.name,
    customizations: evaluation.customizations,
  };

  return result;
}
