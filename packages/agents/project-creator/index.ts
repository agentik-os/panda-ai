/**
 * Project Creator Agent - Main Orchestrator
 *
 * Coordinates the 7-phase project creation workflow:
 * 1. Discovery & Requirements Gathering
 * 2. Branding & Identity
 * 3. PRD Generation
 * 4. Stack Selection & Justification
 * 5. Team Spawning & Coordination
 * 6. Quality Assurance Orchestration
 * 7. Deployment & Handoff
 */

import { runBrandingPhase, presentBrandingOptions, BrandingInput, BrandingOutput } from './phases/branding.js';
import { runDiscoveryPhase, presentDiscoverySummary, DiscoveryInput, DiscoveryOutput } from './phases/discovery.js';
import { generatePRD, PRDOutput } from './phases/prd.js';
import { selectStack, StackSelection } from './phases/stack.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// ============================================================================
// TYPES
// ============================================================================

// Re-export DiscoveryOutput as ProjectDiscovery for compatibility
export type ProjectDiscovery = DiscoveryOutput;

export interface PRD {
  projectName: string;
  tagline: string;
  positioning: string;
  userPersonas: UserPersona[];
  features: Feature[];
  userStories: UserStory[];
  technicalArchitecture: TechnicalArchitecture;
  designSystem: DesignSystem;
  successMetrics: SuccessMetrics;
  gtmStrategy: GTMStrategy;
  risks: Risk[];
  timeline: Milestone[];
  budget: Budget;
}

export interface UserPersona {
  name: string;
  age: string;
  occupation: string;
  techLevel: string;
  goals: string[];
  painPoints: string[];
  userStory: string;
}

export interface Feature {
  id: string;
  name: string;
  priority: 'P0' | 'P1' | 'P2';
  userStory: string;
  description: string;
  acceptanceCriteria: string[];
  technicalNotes: string;
}

export interface UserStory {
  id: string;
  as: string;
  iWant: string;
  soThat: string;
  acceptanceCriteria: string[];
  priority: 'P0' | 'P1' | 'P2';
}

export interface TechnicalArchitecture {
  frontend: { framework: string; reasoning: string };
  backend: { platform: string; reasoning: string };
  database: { system: string; reasoning: string };
  auth: { provider: string; reasoning: string };
  payments?: { provider: string; reasoning: string };
  deployment: { platform: string; reasoning: string };
}

export interface DesignSystem {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    heading: string;
    body: string;
    mono: string;
  };
  components: string[];
}

export interface SuccessMetrics {
  acquisition: { target: string; channels: string[]; cpa: string };
  activation: { target: string; definition: string; ttv: string };
  retention: { target: string; dauMau: string; churn: string };
  revenue: { mrrGoal: string; arpu: string; ltv: string };
  referral: { target: string; viralCoeff: string; incentives: string };
}

export interface GTMStrategy {
  softLaunch: string[];
  publicLaunch: string[];
  scale: string[];
  marketingChannels: Array<{ name: string; budget: string; strategy: string }>;
  pricingTiers: PricingTier[];
}

export interface PricingTier {
  name: string;
  price: number;
  interval: 'month' | 'year';
  description: string;
  features: string[];
  targetSegment: string;
}

export interface Risk {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  name: string;
  description: string;
  probability: string;
  impact: string;
  mitigation: string;
  contingency: string;
}

export interface Milestone {
  name: string;
  date: string;
  deliverables: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface Budget {
  development: Array<{ item: string; cost: number; notes: string }>;
  total: number;
}

export interface TeamAssignment {
  agent: string;
  model: string;
  role: string;
  tasks: string[];
  parallel: boolean;
}

export interface ProjectCreatorOptions {
  aiClient: any; // Model client (Claude Opus for main orchestration)
  outputDir: string; // Where to save project files
  userId?: string; // For tracking/cost attribution
  budget?: {
    aiCosts?: number; // Max AI cost for project creation
    development?: number; // Estimated dev budget
  };
}

export interface ProjectCreatorResult {
  success: boolean;
  projectPath: string;
  discovery: ProjectDiscovery;
  branding: BrandingOutput;
  prd: PRDOutput;
  stack: StackSelection;
  team: TeamAssignment[];
  qaReport?: any;
  deploymentInfo?: any;
  totalCost: number;
  duration: number; // milliseconds
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

export class ProjectCreatorAgent {
  private aiClient: any;
  private outputDir: string;
  private userId?: string;
  private budget?: { aiCosts?: number; development?: number };
  private startTime: number = 0;
  private totalCost: number = 0;

  constructor(options: ProjectCreatorOptions) {
    this.aiClient = options.aiClient;
    this.outputDir = options.outputDir;
    this.userId = options.userId;
    this.budget = options.budget;
  }

  /**
   * Main entry point - orchestrates entire project creation workflow
   */
  async createProject(initialIdea?: string): Promise<ProjectCreatorResult> {
    this.startTime = Date.now();
    console.log('🚀 Starting Project Creator Agent...\n');

    try {
      // Phase 1: Discovery
      console.log('📋 Phase 1/7: Discovery & Requirements Gathering');
      const discovery = await this.runDiscoveryPhase(initialIdea);
      await this.saveJSON('PROJECT_DISCOVERY.json', discovery);

      // Phase 2: Branding
      console.log('\n🎨 Phase 2/7: Branding & Identity');
      const branding = await this.runBrandingPhaseWrapper(discovery);
      await this.saveJSON('BRANDING.json', branding);

      // Phase 3: PRD Generation
      console.log('\n📝 Phase 3/7: PRD Generation');
      const prd = await this.runPRDPhase(discovery, branding);
      // PRD is already saved in runPRDPhase (JSON + Markdown)

      // Phase 4: Stack Selection
      console.log('\n🛠️  Phase 4/7: Stack Selection & Justification');
      const stack = await this.runStackSelectionPhase(discovery, prd);
      await this.saveJSON('STACK_SELECTION.json', stack);

      // Phase 5: Team Spawning & Coordination
      console.log('\n👥 Phase 5/7: Team Spawning & Coordination');
      const team = await this.runTeamCoordinationPhase(prd, stack);
      await this.saveJSON('TEAM_ASSIGNMENTS.json', team);

      // Phase 6: QA Orchestration
      console.log('\n🧪 Phase 6/7: Quality Assurance');
      const qaReport = await this.runQAPhase();
      await this.saveJSON('QA_REPORT.json', qaReport);

      // Phase 7: Deployment & Handoff
      console.log('\n🚀 Phase 7/7: Deployment & Handoff');
      const deploymentInfo = await this.runDeploymentPhase(stack);
      await this.saveJSON('DEPLOYMENT.json', deploymentInfo);

      const duration = Date.now() - this.startTime;

      console.log('\n✅ Project creation complete!');
      console.log(`   📁 Project saved to: ${this.outputDir}`);
      console.log(`   💰 Total AI cost: $${this.totalCost.toFixed(2)}`);
      console.log(`   ⏱️  Duration: ${(duration / 1000 / 60).toFixed(1)} minutes`);

      return {
        success: true,
        projectPath: this.outputDir,
        discovery,
        branding,
        prd,
        stack,
        team,
        qaReport,
        deploymentInfo,
        totalCost: this.totalCost,
        duration,
      };
    } catch (error) {
      console.error('❌ Project creation failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // PHASE 1: DISCOVERY
  // ============================================================================

  private async runDiscoveryPhase(initialIdea?: string): Promise<ProjectDiscovery> {
    const discovery = await runDiscoveryPhase({ initialIdea }, this.aiClient);
    presentDiscoverySummary(discovery);
    this.trackCost(0.1); // Estimate
    return discovery;
  }

  // ============================================================================
  // PHASE 2: BRANDING (Using existing implementation)
  // ============================================================================

  private async runBrandingPhaseWrapper(discovery: ProjectDiscovery): Promise<BrandingOutput> {
    const brandingInput: BrandingInput = {
      productDescription: `${discovery.problem}. Core features: ${discovery.coreFeatures.join(', ')}`,
      targetUsers: discovery.targetUsers,
      industry: discovery.industry,
      emotionalTone: discovery.emotionalTone,
      competitors: discovery.competitors,
      differentiator: discovery.differentiator,
    };

    const branding = await runBrandingPhase(brandingInput, this.aiClient);

    // Present options to user for approval
    await presentBrandingOptions(branding);

    // TODO: Implement user approval mechanism
    // For now, use top-scored name and first palette

    this.trackCost(0.5); // Branding typically uses ~$0.50 in API calls
    return branding;
  }

  // ============================================================================
  // PHASE 3: PRD GENERATION
  // ============================================================================

  private async runPRDPhase(discovery: ProjectDiscovery, branding: BrandingOutput): Promise<PRDOutput> {
    console.log('\n📋 Starting PRD Generation Phase...');

    // Generate PRD using the dedicated module
    const prd = await generatePRD(discovery, branding, this.aiClient);
    this.trackCost(0.8); // PRD generation is extensive

    // Save PRD as JSON
    const prdJsonPath = join(this.outputDir, 'PRD.json');
    await writeFile(prdJsonPath, JSON.stringify(prd, null, 2));
    console.log(`✅ PRD saved as JSON: ${prdJsonPath}`);

    // Compile PRD as Markdown
    const prdMarkdown = await this.compilePRDTemplate(prd);
    const prdMdPath = join(this.outputDir, 'PRD.md');
    await writeFile(prdMdPath, prdMarkdown);
    console.log(`✅ PRD saved as Markdown: ${prdMdPath}`);

    return prd;
  }

  private async compilePRDTemplate(prd: PRDOutput): Promise<string> {
    const templatePath = join(__dirname, 'templates/prd-template.md');
    const template = await readFile(templatePath, 'utf-8');

    // Simple template replacement (can be enhanced with Handlebars later)
    let compiled = template;

    // Replace all variables
    const vars: Record<string, any> = prd;
    for (const [key, value] of Object.entries(vars)) {
      if (typeof value === 'string') {
        compiled = compiled.replaceAll(`{{${key}}}`, value);
      } else if (Array.isArray(value)) {
        // Handle arrays (simple replacement for now)
        compiled = compiled.replaceAll(`{{${key}}}`, JSON.stringify(value, null, 2));
      } else if (typeof value === 'object') {
        // Handle nested objects
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          if (typeof nestedValue === 'string') {
            compiled = compiled.replaceAll(`{{${key}.${nestedKey}}}`, nestedValue);
          }
        }
      }
    }

    // Handle Handlebars-style loops (basic implementation)
    compiled = compiled.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
      const array = (vars as any)[arrayName];
      if (!Array.isArray(array)) return '';

      return array
        .map((item, index) => {
          let itemContent = content;
          // Replace {{this}} with the item if it's a string
          if (typeof item === 'string') {
            itemContent = itemContent.replaceAll('{{this}}', item);
          } else {
            // Replace object properties
            for (const [key, value] of Object.entries(item)) {
              itemContent = itemContent.replaceAll(`{{${key}}}`, String(value));
            }
            itemContent = itemContent.replaceAll('{{@index}}', String(index + 1));
          }
          return itemContent;
        })
        .join('\n');
    });

    return compiled;
  }

  // ============================================================================
  // PHASE 4: STACK SELECTION
  // ============================================================================

  private async runStackSelectionPhase(discovery: ProjectDiscovery, prd: PRDOutput): Promise<StackSelection> {
    console.log('\n📚 Starting Stack Selection Phase...');

    // Use the dedicated stack selection module
    const stack = await selectStack(prd, this.aiClient);

    // Track cost (AI-powered analysis)
    this.trackCost(0.3);

    // Save stack selection as JSON
    const stackPath = join(this.outputDir, 'STACK_SELECTION.json');
    await writeFile(stackPath, JSON.stringify(stack, null, 2));

    console.log(`✅ Stack selection complete: ${stack.recommended.frontend.name} + ${stack.recommended.backend.name}`);
    console.log(`   Estimated monthly cost: $${stack.estimatedCosts.monthly.min}-${stack.estimatedCosts.monthly.max}`);
    console.log(`   Estimated build time: ${stack.estimatedBuildTime}`);

    return stack;
  }

  // ============================================================================
  // PHASE 5: TEAM COORDINATION (Placeholder)
  // ============================================================================

  private async runTeamCoordinationPhase(prd: PRDOutput, stack: StackSelection): Promise<TeamAssignment[]> {
    console.log('  ⚠️  Team coordination not yet implemented');
    console.log('  📝 This will spawn AI agents and coordinate parallel development');

    // Placeholder team assignments
    const team: TeamAssignment[] = [
      {
        agent: 'guardian',
        model: 'claude-opus-4-6',
        role: 'Code review, architecture decisions',
        tasks: ['Review all code', 'Make architectural decisions'],
        parallel: false,
      },
      {
        agent: 'frontend-lead',
        model: 'claude-sonnet-4-5',
        role: 'React/Next.js components, routing',
        tasks: ['Build UI components', 'Implement routing'],
        parallel: true,
      },
      {
        agent: 'backend-lead',
        model: 'claude-sonnet-4-5',
        role: 'API routes, database schema',
        tasks: ['Create API endpoints', 'Design database schema'],
        parallel: true,
      },
    ];

    return team;
  }

  // ============================================================================
  // PHASE 6: QA ORCHESTRATION (Placeholder)
  // ============================================================================

  private async runQAPhase(): Promise<any> {
    console.log('  ⚠️  QA orchestration not yet implemented');
    console.log('  📝 This will trigger MANIAC agent for comprehensive testing');

    return {
      status: 'SKIPPED',
      message: 'QA phase not yet implemented',
    };
  }

  // ============================================================================
  // PHASE 7: DEPLOYMENT (Placeholder)
  // ============================================================================

  private async runDeploymentPhase(stack: StackSelection): Promise<any> {
    console.log('  ⚠️  Deployment not yet implemented');
    console.log('  📝 This will deploy to Vercel/Netlify and provide handoff docs');

    return {
      status: 'MANUAL',
      message: 'Deploy manually using: vercel --prod',
      stack: stack.recommended,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async saveJSON(filename: string, data: any): Promise<void> {
    await mkdir(this.outputDir, { recursive: true });
    const path = join(this.outputDir, filename);
    await writeFile(path, JSON.stringify(data, null, 2));
    console.log(`  ✅ Saved: ${filename}`);
  }

  private async savePRD(prd: PRD): Promise<void> {
    await mkdir(this.outputDir, { recursive: true });

    // Save as JSON for machine processing
    await this.saveJSON('PRD.json', prd);

    // TODO: Also save as formatted Markdown using template
    console.log('  ⚠️  PRD Markdown generation not yet implemented');
  }

  private trackCost(amount: number): void {
    this.totalCost += amount;

    if (this.budget?.aiCosts && this.totalCost > this.budget.aiCosts) {
      console.warn(`⚠️  AI cost ($${this.totalCost.toFixed(2)}) exceeded budget ($${this.budget.aiCosts})`);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Discovery phase
  runDiscoveryPhase,
  presentDiscoverySummary,
  DiscoveryInput,
  DiscoveryOutput,
  // Branding phase
  runBrandingPhase,
  presentBrandingOptions,
  BrandingInput,
  BrandingOutput,
};
