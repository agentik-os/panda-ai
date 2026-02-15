/**
 * Discovery Phase - Project Creator Agent
 *
 * Conducts conversational interview to gather project requirements
 * Asks strategic questions to clarify vision, scope, and constraints
 */

// Types
export interface DiscoveryInput {
  initialIdea?: string;
  conversationHistory?: ConversationTurn[];
}

export interface ConversationTurn {
  role: 'agent' | 'user';
  message: string;
  timestamp: number;
}

export interface DiscoveryOutput {
  projectName: string;
  problem: string;
  targetUsers: string[];
  coreFeatures: string[];
  businessModel: string;
  industry: string;
  emotionalTone: string;
  constraints?: {
    mustIntegrateWith?: string[];
    deadline?: string;
    budget?: string;
  };
  competitors?: string[];
  differentiator?: string;
  conversationHistory: ConversationTurn[];
}

/**
 * Strategic questions for discovery
 */
const DISCOVERY_QUESTIONS = [
  {
    id: 'problem',
    question: 'What problem are you solving? Who experiences this problem?',
    followUps: [
      'How do they currently solve this problem?',
      'What pain points does the current solution have?',
      'How much time/money do they waste on this problem?',
    ],
  },
  {
    id: 'users',
    question: 'Who are your target users? Describe them in detail.',
    followUps: [
      'What are their demographics (age, occupation, tech-savviness)?',
      'What are their goals when using this product?',
      'What are their main frustrations with existing solutions?',
    ],
  },
  {
    id: 'features',
    question: 'What are the 3 core features for your MVP? (Must-haves only)',
    followUps: [
      'Why is each feature essential?',
      'What happens if we cut this feature?',
      'Can users accomplish their main goal without it?',
    ],
  },
  {
    id: 'business',
    question: 'What\'s your business model? How will this make money?',
    followUps: [
      'What\'s your pricing strategy?',
      'Who pays? Users directly or B2B2C?',
      'What\'s your customer acquisition cost assumption?',
    ],
  },
  {
    id: 'industry',
    question: 'What industry is this in? (e.g., SaaS, E-commerce, Healthcare, Education)',
    followUps: [
      'Are there specific industry regulations to consider?',
      'What are the industry-specific challenges?',
    ],
  },
  {
    id: 'tone',
    question: 'What emotional tone should the brand have?',
    options: [
      'Professional (trustworthy, corporate)',
      'Playful (fun, lighthearted)',
      'Innovative (cutting-edge, modern)',
      'Friendly (approachable, human)',
      'Luxurious (premium, exclusive)',
    ],
  },
  {
    id: 'constraints',
    question: 'Any technical constraints or requirements?',
    followUps: [
      'Must integrate with existing systems?',
      'Required APIs or third-party services?',
      'Specific compliance requirements (HIPAA, GDPR, etc.)?',
    ],
  },
  {
    id: 'timeline',
    question: 'What are your timeline expectations?',
    followUps: [
      'When do you need the MVP?',
      'What\'s driving this deadline?',
      'Is this flexible or hard deadline?',
    ],
  },
  {
    id: 'budget',
    question: 'What\'s your budget for AI costs during development?',
    followUps: [
      'How much for initial MVP?',
      'Ongoing monthly AI costs acceptable?',
    ],
  },
  {
    id: 'competitors',
    question: 'Who are your main competitors?',
    followUps: [
      'What do they do well?',
      'What do they do poorly?',
      'Why will users choose you over them?',
    ],
  },
  {
    id: 'differentiator',
    question: 'What\'s your key differentiator? What makes this unique?',
    followUps: [
      'Is this a feature, business model, or experience differentiator?',
      'Can competitors easily copy this?',
      'What\'s your moat?',
    ],
  },
];

/**
 * Main discovery phase function
 * Conducts conversational interview to gather requirements
 */
export async function runDiscoveryPhase(
  input: DiscoveryInput,
  aiClient: any
): Promise<DiscoveryOutput> {
  console.log('📋 Starting Discovery Phase...\n');

  const conversationHistory: ConversationTurn[] = input.conversationHistory || [];

  // If initial idea provided, use it to skip some questions
  if (input.initialIdea) {
    console.log(`Initial idea: "${input.initialIdea}"\n`);
    conversationHistory.push({
      role: 'user',
      message: input.initialIdea,
      timestamp: Date.now(),
    });
  }

  // Generate discovery prompt
  const prompt = buildDiscoveryPrompt(input.initialIdea, conversationHistory);

  // Call AI for discovery conversation
  const response = await aiClient.generateText(prompt);

  // Parse structured output
  let discovery: DiscoveryOutput;
  try {
    discovery = JSON.parse(response);
    discovery.conversationHistory = conversationHistory;
  } catch (error) {
    console.error('Failed to parse discovery response:', error);
    throw new Error('Invalid discovery response format');
  }

  // Validate discovery output
  validateDiscovery(discovery);

  console.log('✅ Discovery Phase complete!\n');
  console.log(`   Project: ${discovery.projectName}`);
  console.log(`   Industry: ${discovery.industry}`);
  console.log(`   Target Users: ${discovery.targetUsers.join(', ')}`);
  console.log(`   Core Features: ${discovery.coreFeatures.length}`);

  return discovery;
}

/**
 * Build discovery prompt based on context
 */
function buildDiscoveryPrompt(
  initialIdea?: string,
  conversationHistory: ConversationTurn[] = []
): string {
  const questionsContext = DISCOVERY_QUESTIONS.map((q) => {
    const followUps = q.followUps ? `\n  Follow-ups: ${q.followUps.join(', ')}` : '';
    const options = q.options ? `\n  Options: ${q.options.join(', ')}` : '';
    return `- ${q.question}${followUps}${options}`;
  }).join('\n');

  return `
You are a product discovery expert conducting a strategic interview.

${initialIdea ? `USER'S INITIAL IDEA:\n"${initialIdea}"\n` : ''}

${conversationHistory.length > 0 ? `CONVERSATION HISTORY:\n${conversationHistory.map((turn) => `${turn.role}: ${turn.message}`).join('\n')}\n` : ''}

YOUR TASK:
Ask strategic questions to fully understand the project requirements.
Be conversational and ask follow-up questions to dig deeper.

QUESTIONS TO COVER:
${questionsContext}

DISCOVERY FRAMEWORK:
1. Understand the PROBLEM deeply (not just the solution idea)
2. Identify TARGET USERS and their pain points
3. Define MVP SCOPE (must-haves only, no nice-to-haves)
4. Clarify BUSINESS MODEL and revenue strategy
5. Understand INDUSTRY context and constraints
6. Define EMOTIONAL TONE for brand positioning
7. Identify COMPETITORS and differentiators
8. Set TIMELINE and BUDGET expectations

OUTPUT FORMAT (JSON):
{
  "projectName": "Suggested name based on answers (1-2 words)",
  "problem": "Clear problem statement (1-2 sentences)",
  "targetUsers": ["Specific user group 1", "Specific user group 2"],
  "coreFeatures": ["Feature 1 (must-have)", "Feature 2 (must-have)", "Feature 3 (must-have)"],
  "businessModel": "Freemium / Subscription ($X/mo) / One-time ($X) / Marketplace (% take) / Free + Ads",
  "industry": "Specific industry (SaaS, E-commerce, Healthcare, Education, FinTech, etc.)",
  "emotionalTone": "professional / playful / innovative / friendly / luxurious",
  "constraints": {
    "mustIntegrateWith": ["Service 1", "Service 2"],
    "deadline": "X weeks for MVP",
    "budget": "$X for AI costs"
  },
  "competitors": ["Competitor 1", "Competitor 2", "Competitor 3"],
  "differentiator": "Key unique value proposition (1 sentence)"
}

IMPORTANT:
- Be specific in targetUsers (not "users" but "freelance designers", "small accounting firms")
- Be ruthless about MVP scope (only 3 core features max)
- Focus on WHAT problem is solved, not HOW (technical details come later)
- Validate business model (how will this make money?)

Return ONLY valid JSON, no additional text.
`;
}

/**
 * Validate discovery output has all required fields
 */
function validateDiscovery(discovery: DiscoveryOutput): void {
  const required = [
    'projectName',
    'problem',
    'targetUsers',
    'coreFeatures',
    'businessModel',
    'industry',
    'emotionalTone',
  ];

  for (const field of required) {
    if (!discovery[field as keyof DiscoveryOutput]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate arrays
  if (!Array.isArray(discovery.targetUsers) || discovery.targetUsers.length === 0) {
    throw new Error('targetUsers must be a non-empty array');
  }

  if (!Array.isArray(discovery.coreFeatures) || discovery.coreFeatures.length === 0) {
    throw new Error('coreFeatures must be a non-empty array');
  }

  if (discovery.coreFeatures.length > 5) {
    console.warn('⚠️  Warning: More than 5 core features may be too ambitious for MVP');
  }
}

/**
 * Present discovery summary to user for confirmation
 */
export function presentDiscoverySummary(discovery: DiscoveryOutput): void {
  console.log('\n📋 ===== DISCOVERY SUMMARY ===== 📋\n');

  console.log(`📦 PROJECT: ${discovery.projectName}`);
  console.log(`🎯 PROBLEM: ${discovery.problem}`);

  console.log('\n👥 TARGET USERS:');
  discovery.targetUsers.forEach((user, i) => {
    console.log(`   ${i + 1}. ${user}`);
  });

  console.log('\n⚡ CORE FEATURES (MVP):');
  discovery.coreFeatures.forEach((feature, i) => {
    console.log(`   ${i + 1}. ${feature}`);
  });

  console.log(`\n💰 BUSINESS MODEL: ${discovery.businessModel}`);
  console.log(`🏢 INDUSTRY: ${discovery.industry}`);
  console.log(`🎨 EMOTIONAL TONE: ${discovery.emotionalTone}`);

  if (discovery.competitors && discovery.competitors.length > 0) {
    console.log('\n🥊 COMPETITORS:');
    discovery.competitors.forEach((comp, i) => {
      console.log(`   ${i + 1}. ${comp}`);
    });
  }

  if (discovery.differentiator) {
    console.log(`\n✨ DIFFERENTIATOR: ${discovery.differentiator}`);
  }

  if (discovery.constraints) {
    console.log('\n⚙️  CONSTRAINTS:');
    if (discovery.constraints.mustIntegrateWith) {
      console.log(`   Integrations: ${discovery.constraints.mustIntegrateWith.join(', ')}`);
    }
    if (discovery.constraints.deadline) {
      console.log(`   Deadline: ${discovery.constraints.deadline}`);
    }
    if (discovery.constraints.budget) {
      console.log(`   Budget: ${discovery.constraints.budget}`);
    }
  }

  console.log('\n================================\n');
}

/**
 * Interactive discovery mode (for CLI usage)
 * Allows back-and-forth conversation with user
 */
export async function interactiveDiscovery(aiClient: any): Promise<DiscoveryOutput> {
  console.log('🎯 Welcome to Interactive Discovery Mode!\n');
  console.log('I\'ll ask you some questions to understand your project.\n');

  const conversationHistory: ConversationTurn[] = [];

  // This would use a readline interface in a real CLI
  // For now, this is a placeholder for the structure

  console.log('⚠️  Interactive mode requires CLI integration (not yet implemented)');
  console.log('📝 Using single-turn discovery instead\n');

  // Fallback to single-turn discovery
  const discovery = await runDiscoveryPhase({ initialIdea: undefined }, aiClient);

  return discovery;
}
