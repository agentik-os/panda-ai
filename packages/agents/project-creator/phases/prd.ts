/**
 * Phase 3: PRD (Product Requirements Document) Generation
 *
 * Takes discovery and branding inputs and generates a comprehensive PRD covering:
 * - User personas (2-3 detailed personas)
 * - Feature specifications with acceptance criteria
 * - User stories (10-20 stories)
 * - Technical architecture recommendations
 * - Design system (using selected branding)
 * - Success metrics (AARRR framework)
 * - Go-to-market strategy
 * - Risk analysis & mitigation
 * - Timeline & milestones
 * - Budget breakdown
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import type { DiscoveryOutput } from './discovery.js';
import type { BrandingOutput } from './branding.js';

// Re-export as ProjectDiscovery for compatibility
export type ProjectDiscovery = DiscoveryOutput;

// ============================================================================
// TYPES
// ============================================================================

export interface UserPersona {
  name: string;
  age: string;
  occupation: string;
  techLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  goals: string[];
  painPoints: string[];
  userStory: string;
}

export interface Feature {
  id: string;
  name: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  userStory: string;
  description: string;
  acceptanceCriteria: string[];
  technicalNotes: string;
}

export interface UserFlow {
  name: string;
  steps: Array<{ action: string; outcome: string }>;
  happyPath: string;
  errorCases: Array<{ trigger: string; handling: string }>;
}

export interface Competitor {
  name: string;
  strengths: string;
  weaknesses: string;
  ourAdvantage: string;
}

export interface SuccessMetrics {
  acquisition: {
    target: string;
    channels: string[];
    cpa: string;
  };
  activation: {
    target: string;
    definition: string;
    ttv: string;
  };
  retention: {
    target: string;
    dauMau: string;
    churn: string;
  };
  revenue: {
    mrrGoal: string;
    arpu: string;
    ltv: string;
  };
  referral: {
    target: string;
    viralCoeff: string;
    incentives: string;
  };
}

export interface PRDOutput {
  projectName: string;
  tagline: string;
  date: string;
  status: 'Draft' | 'Review' | 'Approved' | 'Final';

  // Executive Summary
  problemStatement: string;
  solutionStatement: string;
  targetUsers: string[];
  businessModel: string;
  acquisitionMetric: string;
  activationMetric: string;
  retentionMetric: string;
  revenueMetric: string;
  referralMetric: string;

  // Product Vision
  missionStatement: string;
  productPositioning: string;
  competitors: Competitor[];

  // Users & Features
  personas: UserPersona[];
  mvpFeatures: Feature[];
  futureFeatures: Array<{ name: string; phase: number; description: string }>;
  userFlows: UserFlow[];

  // Technical
  stack: {
    frontend: string;
    frontendReason: string;
    backend: string;
    backendReason: string;
    database: string;
    databaseReason: string;
    auth: string;
    authReason: string;
    payments: string;
    paymentsReason: string;
    deployment: string;
    deploymentReason: string;
  };
  dataModels: Array<{
    name: string;
    schema: string;
    relationships: string[];
  }>;
  apiEndpoints: Array<{
    method: string;
    path: string;
    description: string;
    requestExample: string;
    responseExample: string;
    authRequired: string;
  }>;
  integrations: Array<{
    name: string;
    purpose: string;
    apiUrl: string;
    docsUrl: string;
    cost: string;
  }>;

  // Design
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  typography: {
    heading: string;
    body: string;
    mono: string;
    scale: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      xxl: string;
    };
  };
  components: Array<{ name: string; variants: string }>;

  // Metrics & GTM
  metrics: SuccessMetrics;
  launchPlan: {
    softLaunch: string[];
    publicLaunch: string[];
    scale: string[];
  };
  marketingChannels: Array<{ name: string; budget: string; strategy: string }>;
  pricingTiers: Array<{
    name: string;
    price: string;
    interval: string;
    description: string;
    features: string[];
    targetSegment: string;
  }>;

  // Risks & Planning
  risks: Array<{
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    name: string;
    description: string;
    probability: string;
    impact: string;
    mitigation: string;
    contingency: string;
  }>;
  milestones: Array<{
    name: string;
    date: string;
    deliverables: string;
    status: 'Not Started' | 'In Progress' | 'Completed';
  }>;
  budget: {
    development: Array<{ item: string; cost: string; notes: string }>;
    total: string;
  };
  team: Array<{ role: string; commitment: string; responsibilities: string }>;

  // Appendix
  glossary: Array<{ term: string; definition: string }>;
  references: Array<{ title: string; url: string }>;
  nextReviewDate: string;
}

// ============================================================================
// PRD GENERATION
// ============================================================================

export async function generatePRD(
  discovery: ProjectDiscovery,
  branding: BrandingOutput,
  aiClient: { generateText(prompt: string): Promise<string> }
): Promise<PRDOutput> {
  console.log('\n🔥 PHASE 3: PRD GENERATION');
  console.log('━'.repeat(80));

  // Step 1: Generate personas
  console.log('\n👥 Generating user personas...');
  const personas = await generatePersonas(discovery, aiClient);

  // Step 2: Generate features
  console.log('\n📝 Generating feature specifications...');
  const { mvpFeatures, futureFeatures } = await generateFeatures(discovery, personas, aiClient);

  // Step 3: Generate user flows
  console.log('\n🔄 Mapping user flows...');
  const userFlows = await generateUserFlows(mvpFeatures, aiClient);

  // Step 4: Define tech stack (placeholder - will be enhanced in Phase 4)
  console.log('\n🛠️  Defining technical architecture...');
  const stack = defineStack(discovery);

  // Step 5: Define data models & API
  console.log('\n💾 Designing data models and API...');
  const { dataModels, apiEndpoints } = await generateDataArchitecture(mvpFeatures, aiClient);

  // Step 6: Define integrations
  console.log('\n🔌 Identifying third-party integrations...');
  const integrations = await generateIntegrations(discovery, aiClient);

  // Step 7: Define success metrics
  console.log('\n📊 Defining success metrics (AARRR)...');
  const metrics = await generateSuccessMetrics(discovery, aiClient);

  // Step 8: Create GTM strategy
  console.log('\n🚀 Creating go-to-market strategy...');
  const { launchPlan, marketingChannels, pricingTiers } = await generateGTMStrategy(discovery, metrics, aiClient);

  // Step 9: Risk analysis
  console.log('\n⚠️  Conducting risk analysis...');
  const risks = await generateRiskAnalysis(discovery, aiClient);

  // Step 10: Timeline & budget
  console.log('\n📅 Creating timeline and budget...');
  const { milestones, budget, team } = await generateTimelineAndBudget(discovery, mvpFeatures, aiClient);

  // Step 11: Competitive analysis
  console.log('\n🏆 Analyzing competitive landscape...');
  const competitors = await generateCompetitiveAnalysis(discovery, aiClient);

  console.log('\n✅ PRD generation complete!');

  return {
    projectName: discovery.projectName,
    tagline: branding.tagline,
    date: new Date().toISOString().split('T')[0],
    status: 'Draft',

    // Executive Summary
    problemStatement: discovery.problem,
    solutionStatement: `${discovery.projectName} solves this by ${discovery.coreFeatures.join(', ')}`,
    targetUsers: discovery.targetUsers,
    businessModel: discovery.businessModel,
    acquisitionMetric: metrics.acquisition.target,
    activationMetric: metrics.activation.target,
    retentionMetric: metrics.retention.target,
    revenueMetric: metrics.revenue.mrrGoal,
    referralMetric: metrics.referral.target,

    // Product Vision
    missionStatement: branding.positioning.statement,
    productPositioning: branding.positioning.elevatorPitch,
    competitors,

    // Users & Features
    personas,
    mvpFeatures,
    futureFeatures,
    userFlows,

    // Technical
    stack,
    dataModels,
    apiEndpoints,
    integrations,

    // Design
    colors: {
      primary: branding.colorPalettes[0].colors.primary.oklch,
      secondary: branding.colorPalettes[0].colors.secondary.oklch,
      accent: branding.colorPalettes[0].colors.accent.oklch,
      background: branding.colorPalettes[0].colors.background.oklch,
      surface: 'oklch(0.98 0.01 250)', // Light surface color
      text: branding.colorPalettes[0].colors.text.oklch,
      textMuted: 'oklch(0.55 0.05 250)', // Muted text color
      success: 'oklch(0.55 0.15 145)', // Green
      warning: 'oklch(0.65 0.15 75)', // Orange
      error: 'oklch(0.55 0.20 25)', // Red
      info: 'oklch(0.55 0.15 250)', // Blue
    },
    typography: {
      heading: branding.typography.heading,
      body: branding.typography.body,
      mono: branding.typography.mono,
      scale: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        xxl: '1.5rem',
      },
    },
    components: [
      { name: 'Button', variants: 'primary, secondary, outline, ghost, link' },
      { name: 'Card', variants: 'default, elevated, outlined' },
      { name: 'Input', variants: 'text, email, password, search' },
      { name: 'Modal', variants: 'center, side, fullscreen' },
    ],

    // Metrics & GTM
    metrics,
    launchPlan,
    marketingChannels,
    pricingTiers,

    // Risks & Planning
    risks,
    milestones,
    budget,
    team,

    // Appendix
    glossary: [],
    references: [],
    nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function generatePersonas(
  discovery: ProjectDiscovery,
  aiClient: { generateText(prompt: string): Promise<string> }
): Promise<UserPersona[]> {
  const prompt = `Generate 2-3 detailed user personas for: ${discovery.projectName}

Context:
- Problem: ${discovery.problem}
- Target Users: ${discovery.targetUsers.join(', ')}
- Core Features: ${discovery.coreFeatures.join(', ')}

For each persona, provide:
1. Name (realistic, represents demographic)
2. Age range
3. Occupation
4. Tech savviness level
5. Goals (3-4 specific goals)
6. Pain points (3-4 specific frustrations)
7. User story (one sentence: "As a [persona], I want to [goal] so that [benefit]")

Format as JSON array.`;

  const response = await aiClient.generateText(prompt);
  return JSON.parse(extractJSON(response));
}

async function generateFeatures(
  discovery: ProjectDiscovery,
  personas: UserPersona[],
  aiClient: { generateText(prompt: string): Promise<string> }
): Promise<{ mvpFeatures: Feature[]; futureFeatures: Array<{ name: string; phase: number; description: string }> }> {
  const prompt = `Generate detailed feature specifications for MVP and future phases.

Project: ${discovery.projectName}
Core MVP Features: ${discovery.coreFeatures.join(', ')}
Personas: ${personas.map(p => p.name).join(', ')}

For each MVP feature:
1. ID (e.g., "F001")
2. Name
3. Priority (CRITICAL, HIGH, MEDIUM, LOW)
4. User story
5. Description (2-3 sentences)
6. Acceptance criteria (3-5 testable criteria)
7. Technical notes

Also suggest 5-10 post-MVP features for future phases.

Format as JSON.`;

  const response = await aiClient.generateText(prompt);
  return JSON.parse(extractJSON(response));
}

async function generateUserFlows(
  features: Feature[],
  aiClient: { generateText(prompt: string): Promise<string> }
): Promise<UserFlow[]> {
  const prompt = `Create detailed user flows for the top 3-5 features.

Features: ${features.slice(0, 5).map(f => f.name).join(', ')}

For each flow:
1. Name of the flow
2. Steps (action → outcome pairs, 5-10 steps)
3. Happy path description
4. Error cases (2-3 common errors and how to handle)

Format as JSON array.`;

  const response = await aiClient.generateText(prompt);
  return JSON.parse(extractJSON(response));
}

function defineStack(discovery: ProjectDiscovery): PRDOutput['stack'] {
  // Placeholder - will be enhanced by Phase 4 (Stack Selection)
  return {
    frontend: 'Next.js 16 (App Router)',
    frontendReason: 'Modern React framework with excellent DX, SEO, and performance',
    backend: 'Convex',
    backendReason: 'Real-time backend with built-in auth, database, and hosting',
    database: 'Convex (built-in)',
    databaseReason: 'Integrated with Convex, real-time subscriptions, TypeScript-native',
    auth: 'Clerk',
    authReason: 'Production-ready auth with social login, MFA, and user management',
    payments: 'Stripe',
    paymentsReason: 'Industry standard with excellent docs and developer experience',
    deployment: 'Vercel',
    deploymentReason: 'Zero-config deploys, edge network, built for Next.js',
  };
}

async function generateDataArchitecture(
  features: Feature[],
  aiClient: { generateText(prompt: string): Promise<string> }
): Promise<{ dataModels: PRDOutput['dataModels']; apiEndpoints: PRDOutput['apiEndpoints'] }> {
  const prompt = `Design data models and API endpoints based on these features:

${features.map(f => `- ${f.name}: ${f.description}`).join('\n')}

Provide:
1. Data models (3-5 core models with TypeScript schemas)
2. Relationships between models
3. API endpoints (5-10 key endpoints with method, path, description, example request/response)

Format as JSON.`;

  const response = await aiClient.generateText(prompt);
  return JSON.parse(extractJSON(response));
}

async function generateIntegrations(
  discovery: ProjectDiscovery,
  aiClient: { generateText(prompt: string): Promise<string> }
): Promise<PRDOutput['integrations']> {
  const prompt = `Identify necessary third-party integrations for: ${discovery.projectName}

Industry: ${discovery.industry}
Features: ${discovery.coreFeatures.join(', ')}

List 3-7 integrations with:
- Name
- Purpose
- API URL
- Docs URL
- Estimated cost

Format as JSON array.`;

  const response = await aiClient.generateText(prompt);
  return JSON.parse(extractJSON(response));
}

async function generateSuccessMetrics(
  discovery: ProjectDiscovery,
  aiClient: { generateText(prompt: string): Promise<string> }
): Promise<SuccessMetrics> {
  const prompt = `Define AARRR metrics for: ${discovery.projectName}

Business Model: ${discovery.businessModel}
Target Users: ${discovery.targetUsers.join(', ')}

For each stage (Acquisition, Activation, Retention, Revenue, Referral):
- Target metric
- Relevant channels/strategies
- Specific numbers (realistic for MVP stage)

Format as JSON matching SuccessMetrics interface.`;

  const response = await aiClient.generateText(prompt);
  return JSON.parse(extractJSON(response));
}

async function generateGTMStrategy(
  discovery: ProjectDiscovery,
  metrics: SuccessMetrics,
  aiClient: { generateText(prompt: string): Promise<string> }
): Promise<{
  launchPlan: PRDOutput['launchPlan'];
  marketingChannels: PRDOutput['marketingChannels'];
  pricingTiers: PRDOutput['pricingTiers'];
}> {
  const prompt = `Create go-to-market strategy for: ${discovery.projectName}

Business Model: ${discovery.businessModel}
Target Acquisition: ${metrics.acquisition.target}

Provide:
1. Launch plan (soft launch → public launch → scale phases)
2. Marketing channels (3-5 channels with budget and strategy)
3. Pricing tiers (2-3 tiers with features and target segments)

Format as JSON.`;

  const response = await aiClient.generateText(prompt);
  return JSON.parse(extractJSON(response));
}

async function generateRiskAnalysis(
  discovery: ProjectDiscovery,
  aiClient: { generateText(prompt: string): Promise<string> }
): Promise<PRDOutput['risks']> {
  const prompt = `Conduct risk analysis for: ${discovery.projectName}

Context: ${discovery.problem}

Identify 5-7 risks across categories:
- Technical (implementation complexity, performance, security)
- Market (competition, product-market fit)
- Business (funding, team, timeline)

For each risk:
- Severity (CRITICAL, HIGH, MEDIUM, LOW)
- Name
- Description
- Probability (Low/Medium/High)
- Impact (Low/Medium/High)
- Mitigation strategy
- Contingency plan

Format as JSON array.`;

  const response = await aiClient.generateText(prompt);
  return JSON.parse(extractJSON(response));
}

async function generateTimelineAndBudget(
  discovery: ProjectDiscovery,
  features: Feature[],
  aiClient: { generateText(prompt: string): Promise<string> }
): Promise<{
  milestones: PRDOutput['milestones'];
  budget: PRDOutput['budget'];
  team: PRDOutput['team'];
}> {
  const prompt = `Create timeline and budget for: ${discovery.projectName}

MVP Features: ${features.length} features
Timeline Constraint: ${discovery.constraints?.deadline || '3 months'}
Budget Constraint: ${discovery.constraints?.budget || '$50k'}

Provide:
1. Milestones (5-7 key milestones from kickoff to launch)
2. Budget breakdown (development, tools, marketing, etc.)
3. Team requirements (roles, commitment level, responsibilities)

Format as JSON.`;

  const response = await aiClient.generateText(prompt);
  return JSON.parse(extractJSON(response));
}

async function generateCompetitiveAnalysis(
  discovery: ProjectDiscovery,
  aiClient: { generateText(prompt: string): Promise<string> }
): Promise<Competitor[]> {
  const prompt = `Analyze competitive landscape for: ${discovery.projectName}

Problem: ${discovery.problem}
Industry: ${discovery.industry}
Known Competitors: ${discovery.competitors?.join(', ') || 'Unknown'}

Identify 3-5 main competitors with:
- Name
- Strengths
- Weaknesses
- Our competitive advantage

Format as JSON array.`;

  const response = await aiClient.generateText(prompt);
  return JSON.parse(extractJSON(response));
}

// ============================================================================
// UTILITIES
// ============================================================================

function extractJSON(text: string): string {
  // Extract JSON from markdown code blocks or raw text
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*```/);
  if (jsonMatch) {
    return jsonMatch[1];
  }

  // Try to find JSON object/array in the text
  const objectMatch = text.match(/\{[\s\S]*\}/);
  const arrayMatch = text.match(/\[[\s\S]*\]/);

  return objectMatch?.[0] || arrayMatch?.[0] || text;
}
