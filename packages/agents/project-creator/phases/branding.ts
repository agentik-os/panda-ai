/**
 * Branding Phase - Project Creator Agent
 *
 * Generates product names, color palettes, and emotional positioning
 * Uses AI to create professional branding in minutes
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

// Types
export interface BrandingInput {
  productDescription: string;
  targetUsers: string[];
  industry: string;
  emotionalTone: string;
  competitors?: string[];
  differentiator?: string;
}

export interface ProductName {
  name: string;
  meaning: string;
  reasoning: string;
  domainAvailable: boolean;
  score: number; // 0-30 (sum of 6 criteria scores 1-5 each)
}

export interface ColorPalette {
  name: string;
  emotionalTone: string;
  colors: {
    primary: { oklch: string; hex: string; rgb: string; usage: string };
    secondary: { oklch: string; hex: string; rgb: string; usage: string };
    accent: { oklch: string; hex: string; rgb: string; usage: string };
    background: { oklch: string; hex: string; rgb: string; usage: string };
    text: { oklch: string; hex: string; rgb: string; usage: string };
  };
  darkMode: {
    primary: { oklch: string; hex: string };
    background: { oklch: string; hex: string };
    text: { oklch: string; hex: string };
  };
  wcagCompliance: {
    primaryOnBackground: string; // e.g., "7.2:1 (AAA)"
    textOnBackground: string;
    accentOnPrimary: string;
  };
  competitorsDifferentiation: string;
}

export interface LogoConcept {
  name: string;
  type: 'Wordmark' | 'Lettermark' | 'Icon+Word' | 'Abstract' | 'Mascot';
  description: string;
  typography: {
    fontStyle: string;
    weight: string;
    case: string;
    specialTreatment?: string;
  };
  symbol?: string;
  colors: string;
  mood: string;
  technicalSpecs: string[];
}

export interface BrandingOutput {
  productNames: ProductName[];
  selectedName: string;
  tagline: string;
  colorPalettes: ColorPalette[];
  selectedPalette: string;
  positioning: {
    statement: string; // For [target] who [need], [Product] is a [category] that [benefit]. Unlike [competitors], we [differentiator].
    elevatorPitch: string; // 30 second pitch
    valuePropositions: string[]; // 3 bullets
    emotionalBenefit: string;
    brandPersonality: string[]; // 3-5 adjectives
  };
  voiceAndTone: {
    attributes: string[]; // 3-5 attributes (e.g., "Professional", "Playful")
    contextExamples: {
      onboarding: string;
      error: string;
      success: string;
      pricing: string;
      support: string;
    };
  };
  logoConcepts: LogoConcept[];
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
}

/**
 * Main branding phase function
 * Uses AI (Claude Opus) to generate comprehensive branding
 */
export async function runBrandingPhase(
  input: BrandingInput,
  aiClient: any // Model client (Claude Opus)
): Promise<BrandingOutput> {
  console.log('🎨 Starting Branding Phase...');

  // Load branding prompts template
  const templatePath = join(__dirname, '../templates/branding-prompts.md');
  const brandingGuide = await readFile(templatePath, 'utf-8');

  // Step 1: Generate product names
  console.log('  📝 Generating product names (10 options)...');
  const productNames = await generateProductNames(input, aiClient);

  // Step 2: Generate color palettes
  console.log('  🎨 Generating color palettes (3 options)...');
  const colorPalettes = await generateColorPalettes(input, aiClient);

  // Step 3: Generate positioning
  console.log('  🎯 Creating emotional positioning...');
  const positioning = await generatePositioning(input, aiClient);

  // Step 4: Generate voice & tone guide
  console.log('  🗣️  Defining voice & tone...');
  const voiceAndTone = await generateVoiceAndTone(input, aiClient);

  // Step 5: Generate logo concepts
  console.log('  ✏️  Creating logo concepts (3 options)...');
  const logoConcepts = await generateLogoConcepts(input, aiClient);

  // Step 6: Define typography system
  console.log('  🔤 Setting up typography...');
  const typography = defineTypography(input);

  // Select defaults (can be changed by user)
  const selectedName = productNames[0].name; // Highest scored name
  const selectedPalette = colorPalettes[0].name; // First palette

  console.log('✅ Branding Phase complete!');

  return {
    productNames,
    selectedName,
    tagline: positioning.statement.split('.')[0], // First sentence as tagline
    colorPalettes,
    selectedPalette,
    positioning,
    voiceAndTone,
    logoConcepts,
    typography,
  };
}

/**
 * Generate 10 product name suggestions
 */
async function generateProductNames(
  input: BrandingInput,
  aiClient: any
): Promise<ProductName[]> {
  const prompt = `
Generate 10 product name suggestions for:

PRODUCT DESCRIPTION:
${input.productDescription}

TARGET USERS:
${input.targetUsers.join(', ')}

KEY DIFFERENTIATOR:
${input.differentiator || 'Not specified'}

EMOTIONAL TONE:
${input.emotionalTone}

REQUIREMENTS:
- Available .com domain (simulate check)
- 2-3 syllables max
- Easy to spell
- Not already trademarked (simulate check)
- Works globally (no cultural issues)

OUTPUT FORMAT (JSON):
[
  {
    "name": "TaskFlow",
    "meaning": "Combines 'task' (work) + 'flow' (smooth movement)",
    "reasoning": "Conveys effortless task management. Easy to spell, memorable, .com available.",
    "domainAvailable": true,
    "scores": {
      "memorability": 5,
      "clarity": 4,
      "uniqueness": 4,
      "domainAvailability": 5,
      "trademarkClear": 5,
      "culturalSensitivity": 5
    }
  },
  ...
]

Return ONLY valid JSON array.
`;

  const response = await aiClient.generateText(prompt);
  const names = JSON.parse(response);

  // Calculate total scores
  return names.map((n: any) => ({
    ...n,
    score: Object.values(n.scores).reduce((sum: number, val: any) => sum + val, 0),
  })).sort((a: any, b: any) => b.score - a.score); // Sort by score descending
}

/**
 * Generate 3 color palette options
 */
async function generateColorPalettes(
  input: BrandingInput,
  aiClient: any
): Promise<ColorPalette[]> {
  const prompt = `
Generate 3 color palette options for:

PRODUCT NAME:
(To be determined)

INDUSTRY:
${input.industry}

TARGET AUDIENCE:
${input.targetUsers.join(', ')}

BRAND PERSONALITY:
${input.emotionalTone}

COMPETITORS:
${input.competitors?.join(', ') || 'Not specified'}

REQUIREMENTS:
- Use oklch color space
- WCAG AA contrast compliance (4.5:1 for text)
- 5-color palette: Primary, Secondary, Accent, Background, Text
- Works in both light and dark mode
- Unique vs competitors

OUTPUT FORMAT (JSON):
[
  {
    "name": "Professional Blue",
    "emotionalTone": "Trustworthy, professional, calm",
    "colors": {
      "primary": {
        "oklch": "oklch(0.55 0.15 250)",
        "hex": "#3b82f6",
        "rgb": "rgb(59, 130, 246)",
        "usage": "CTAs, links, interactive elements"
      },
      "secondary": {
        "oklch": "oklch(0.45 0.12 245)",
        "hex": "#1e40af",
        "rgb": "rgb(30, 64, 175)",
        "usage": "Headers, highlights, secondary actions"
      },
      "accent": {
        "oklch": "oklch(0.65 0.18 180)",
        "hex": "#10b981",
        "rgb": "rgb(16, 185, 129)",
        "usage": "Success states, badges, notifications"
      },
      "background": {
        "oklch": "oklch(0.98 0.01 250)",
        "hex": "#f8fafc",
        "rgb": "rgb(248, 250, 252)",
        "usage": "Page background, cards"
      },
      "text": {
        "oklch": "oklch(0.25 0.02 250)",
        "hex": "#0f172a",
        "rgb": "rgb(15, 23, 42)",
        "usage": "Body text, headings"
      }
    },
    "darkMode": {
      "primary": {
        "oklch": "oklch(0.60 0.15 250)",
        "hex": "#60a5fa"
      },
      "background": {
        "oklch": "oklch(0.15 0.02 250)",
        "hex": "#0f172a"
      },
      "text": {
        "oklch": "oklch(0.95 0.01 250)",
        "hex": "#f1f5f9"
      }
    },
    "wcagCompliance": {
      "primaryOnBackground": "7.2:1 (AAA)",
      "textOnBackground": "12.5:1 (AAA)",
      "accentOnPrimary": "4.8:1 (AA)"
    },
    "competitorsDifferentiation": "Most competitors use blue/green. We use distinctive purple/pink gradient for modern, creative feel."
  },
  ...
]

Return ONLY valid JSON array with 3 palettes.
`;

  const response = await aiClient.generateText(prompt);
  return JSON.parse(response);
}

/**
 * Generate emotional positioning statement
 */
async function generatePositioning(
  input: BrandingInput,
  aiClient: any
): Promise<BrandingOutput['positioning']> {
  const prompt = `
Create an emotional positioning statement for:

PRODUCT DESCRIPTION:
${input.productDescription}

TARGET AUDIENCE:
${input.targetUsers.join(', ')}

KEY DIFFERENTIATOR:
${input.differentiator || 'Not specified'}

EMOTIONAL TONE:
${input.emotionalTone}

COMPETITORS:
${input.competitors?.join(', ') || 'Not specified'}

OUTPUT FORMAT (JSON):
{
  "statement": "For [target] who [need], [Product] is a [category] that [benefit]. Unlike [competitors], we [differentiator].",
  "elevatorPitch": "30-second pitch version",
  "valuePropositions": [
    "First key benefit",
    "Second key benefit",
    "Third key benefit"
  ],
  "emotionalBenefit": "Peace of mind / Freedom / Confidence / etc.",
  "brandPersonality": ["Professional", "Innovative", "Trustworthy"]
}

Return ONLY valid JSON.
`;

  const response = await aiClient.generateText(prompt);
  return JSON.parse(response);
}

/**
 * Generate voice & tone guide
 */
async function generateVoiceAndTone(
  input: BrandingInput,
  aiClient: any
): Promise<BrandingOutput['voiceAndTone']> {
  const prompt = `
Create voice & tone guide for:

PRODUCT DESCRIPTION:
${input.productDescription}

BRAND PERSONALITY:
${input.emotionalTone}

OUTPUT FORMAT (JSON):
{
  "attributes": ["Professional", "Helpful", "Clear"],
  "contextExamples": {
    "onboarding": "Welcome! Let's get you set up in 2 minutes.",
    "error": "Oops! Something went wrong. Let's fix it together.",
    "success": "🎉 Great work! Your project is live.",
    "pricing": "Simple pricing. No hidden fees. Cancel anytime.",
    "support": "Happy to help! What can we assist you with?"
  }
}

Return ONLY valid JSON.
`;

  const response = await aiClient.generateText(prompt);
  return JSON.parse(response);
}

/**
 * Generate logo concepts (text-based descriptions)
 */
async function generateLogoConcepts(
  input: BrandingInput,
  aiClient: any
): Promise<LogoConcept[]> {
  const prompt = `
Generate 3 text-based logo concepts for:

INDUSTRY:
${input.industry}

BRAND PERSONALITY:
${input.emotionalTone}

TARGET AUDIENCE:
${input.targetUsers.join(', ')}

OUTPUT FORMAT (JSON):
[
  {
    "name": "Modern Wordmark",
    "type": "Wordmark",
    "description": "Clean, sans-serif wordmark with custom ligature on first two letters. Conveys professionalism and innovation.",
    "typography": {
      "fontStyle": "Sans-serif (geometric)",
      "weight": "Bold",
      "case": "Lowercase",
      "specialTreatment": "Custom ligature connecting first two letters"
    },
    "symbol": null,
    "colors": "Primary brand color",
    "mood": "Professional, modern, approachable",
    "technicalSpecs": [
      "Works at 16px (favicon size)",
      "Works in monochrome (black/white)",
      "Scalable (SVG format)",
      "Memorable at small sizes"
    ]
  },
  ...
]

Return ONLY valid JSON array with 3 concepts.
`;

  const response = await aiClient.generateText(prompt);
  return JSON.parse(response);
}

/**
 * Define typography system based on industry and tone
 */
function defineTypography(input: BrandingInput): BrandingOutput['typography'] {
  // Default typography system (can be customized based on industry)
  const isCreative = input.industry.toLowerCase().includes('design') ||
                     input.industry.toLowerCase().includes('creative');
  const isTech = input.industry.toLowerCase().includes('tech') ||
                 input.industry.toLowerCase().includes('saas');

  return {
    heading: isCreative ? 'Playfair Display, Georgia, serif' :
             isTech ? 'Inter, -apple-system, sans-serif' :
             'Inter, -apple-system, sans-serif',
    body: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    mono: 'JetBrains Mono, Consolas, monospace',
    scale: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      xxl: '1.5rem',    // 24px
    },
  };
}

/**
 * Present branding options to user for approval
 */
export async function presentBrandingOptions(
  branding: BrandingOutput
): Promise<void> {
  console.log('\n🎨 ===== BRANDING OPTIONS ===== 🎨\n');

  console.log('📝 PRODUCT NAMES (Top 5):');
  branding.productNames.slice(0, 5).forEach((name, i) => {
    console.log(`  ${i + 1}. ${name.name} (Score: ${name.score}/30)`);
    console.log(`     ${name.reasoning}`);
    console.log(`     Domain: ${name.domainAvailable ? '✅ Available' : '❌ Taken'}\n`);
  });

  console.log('🎨 COLOR PALETTES:');
  branding.colorPalettes.forEach((palette, i) => {
    console.log(`  ${i + 1}. ${palette.name}`);
    console.log(`     Tone: ${palette.emotionalTone}`);
    console.log(`     Primary: ${palette.colors.primary.hex}`);
    console.log(`     WCAG: ${palette.wcagCompliance.primaryOnBackground}\n`);
  });

  console.log('🎯 POSITIONING:');
  console.log(`  ${branding.positioning.statement}\n`);

  console.log('✏️  LOGO CONCEPTS:');
  branding.logoConcepts.forEach((logo, i) => {
    console.log(`  ${i + 1}. ${logo.name} (${logo.type})`);
    console.log(`     ${logo.description}\n`);
  });

  console.log('================================\n');
}
