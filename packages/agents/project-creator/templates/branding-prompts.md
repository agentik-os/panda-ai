# Branding Phase - Prompts & Guidelines

> **Purpose:** Generate product names, color palettes, and emotional positioning for new projects

---

## Product Naming Strategy

### Naming Principles

1. **Memorable:** Easy to spell, pronounce, and remember
2. **Meaningful:** Connects to the product's value proposition
3. **Available:** .com domain available (check namecheap.com)
4. **Brandable:** Unique, not generic
5. **Scalable:** Works as product grows beyond initial feature set

### Naming Approaches

| Approach | Description | Examples | When to Use |
|----------|-------------|----------|-------------|
| **Descriptive** | Clearly states what it does | TaskTracker, InvoiceFlow | B2B SaaS, new market categories |
| **Abstract** | Made-up word, evocative | Asana, Notion, Slack | Strong brand identity, funded startups |
| **Metaphor** | Uses imagery/analogy | Buffer, Canva, Hootsuite | Creative products, memorable branding |
| **Compound** | Combines two words | GitHub, LinkedIn, MailChimp | Hybrid concepts, technical+accessible |
| **Modified** | Tweaked spelling | Lyft, Fiverr, Tumblr | Consumer apps, unique .com |

### Name Generation Prompt

```
Generate 10 product name suggestions for:

PRODUCT DESCRIPTION:
{{productDescription}}

TARGET USERS:
{{targetUsers}}

KEY DIFFERENTIATOR:
{{differentiator}}

EMOTIONAL TONE:
{{emotionalTone}} (professional, playful, innovative, trustworthy, etc.)

REQUIREMENTS:
- Available .com domain
- 2-3 syllables max
- Easy to spell
- Not already trademarked
- Works globally (no cultural issues)

OUTPUT FORMAT:
1. [Name] - [Meaning/Origin] - [Why it fits]
2. [Name] - [Meaning/Origin] - [Why it fits]
...
```

### Evaluation Criteria

Score each name (1-5):
- [ ] **Memorability:** Can users recall it after hearing once?
- [ ] **Clarity:** Does it hint at what the product does?
- [ ] **Uniqueness:** Stands out from competitors?
- [ ] **Domain availability:** .com available?
- [ ] **Trademark check:** Not already registered?
- [ ] **Cultural sensitivity:** No negative meanings in other languages?

**Final Selection:** Name with highest total score (>22/30)

---

## Color Palette Generation

### Color Psychology by Industry

| Industry | Primary | Secondary | Accent | Emotion |
|----------|---------|-----------|--------|---------|
| **Finance/Banking** | Blue | Gray | Green | Trust, stability, growth |
| **Healthcare** | Blue | White | Teal | Calm, professional, healing |
| **E-commerce** | Orange | Black | Purple | Energy, luxury, conversion |
| **SaaS/Tech** | Purple | Blue | Pink | Innovation, trust, modern |
| **Education** | Green | Yellow | Blue | Growth, optimism, learning |
| **Creative/Design** | Black | White | Gradient | Sophistication, versatility |

### Palette Generation Prompt

```
Generate 3 color palette options for:

PRODUCT NAME:
{{productName}}

INDUSTRY:
{{industry}}

TARGET AUDIENCE:
{{targetAudience}}

BRAND PERSONALITY:
{{brandPersonality}} (professional, playful, minimal, bold, etc.)

COMPETITORS:
{{competitors}} (list 2-3 competitors to differentiate from)

REQUIREMENTS:
- Use oklch color space for better gradients and dark mode
- WCAG AA contrast compliance (4.5:1 for text)
- 5-color palette: Primary, Secondary, Accent, Background, Text
- Works in both light and dark mode
- Unique vs competitors

OUTPUT FORMAT:
### Palette 1: [Name]

**Emotional Tone:** [Description]

**Colors:**
- Primary: oklch(L C H) → [Hex] → [RGB] → [Usage: CTAs, links]
- Secondary: oklch(L C H) → [Hex] → [RGB] → [Usage: headers, highlights]
- Accent: oklch(L C H) → [Hex] → [RGB] → [Usage: badges, notifications]
- Background: oklch(L C H) → [Hex] → [RGB] → [Usage: page background]
- Text: oklch(L C H) → [Hex] → [RGB] → [Usage: body text]

**Dark Mode Variants:**
- Primary Dark: oklch(...)
- Background Dark: oklch(...)
- Text Dark: oklch(...)

**WCAG Compliance:**
- Primary on Background: 7.2:1 (AAA) ✓
- Text on Background: 12.5:1 (AAA) ✓
- Accent on Primary: 4.8:1 (AA) ✓

**Competitors Differentiation:**
- [Competitor 1] uses blue/green → We use purple/pink (distinct)
- [Competitor 2] uses dark theme → We offer vibrant light theme

**Preview:**
[Color swatch visual representation]
```

### OKLCH Color Space Benefits

1. **Perceptually uniform:** Equal distance in color space = equal visual difference
2. **Better gradients:** Smooth transitions without muddy middle tones
3. **Dark mode friendly:** Easy to generate dark variants by adjusting lightness
4. **Future-proof:** CSS Color Level 4 native support

### Color Accessibility Checklist

- [ ] Primary text (body): 7:1 contrast (WCAG AAA)
- [ ] Secondary text (captions): 4.5:1 contrast (WCAG AA)
- [ ] UI controls (buttons): 3:1 contrast
- [ ] Non-text (icons, graphs): 3:1 contrast
- [ ] Focus indicators: 3:1 contrast
- [ ] Colorblind friendly (use Coblis simulator)

---

## Emotional Positioning

### Positioning Statement Formula

```
For [target audience]
who [need/problem],
[Product Name] is a [category]
that [unique benefit].

Unlike [competitors],
we [key differentiator].
```

### Example

```
For freelancers
who waste hours on manual invoicing,
TaskFlow is a time-tracking and invoicing platform
that automates billing so you get paid 3x faster.

Unlike QuickBooks or FreshBooks,
we focus exclusively on freelancers with built-in client communication.
```

### Positioning Generation Prompt

```
Create an emotional positioning statement for:

PRODUCT:
{{productName}}

TARGET AUDIENCE:
{{targetAudience}}

CORE PROBLEM:
{{problem}}

UNIQUE SOLUTION:
{{solution}}

COMPETITORS:
{{competitors}}

EMOTIONAL BENEFIT:
{{emotionalBenefit}} (peace of mind, freedom, confidence, etc.)

OUTPUT:
1. Positioning Statement (2 sentences max)
2. Tagline (5-7 words)
3. Elevator Pitch (30 seconds)
4. Value Propositions (3 bullets)
5. Emotional Tone (3 adjectives)
```

### Brand Personality Archetypes

| Archetype | Description | Examples | When to Use |
|-----------|-------------|----------|-------------|
| **Hero** | Brave, strong, inspirational | Nike, Red Bull | Aspirational products |
| **Sage** | Wise, knowledgeable, trusted | Google, IBM | Education, information |
| **Explorer** | Adventurous, independent | The North Face, Patagonia | Travel, outdoor |
| **Creator** | Innovative, imaginative | Adobe, Lego | Creative tools |
| **Caregiver** | Compassionate, nurturing | TOMS, Dove | Healthcare, nonprofit |
| **Jester** | Fun, playful, lighthearted | Ben & Jerry's, Old Spice | Consumer, entertainment |
| **Ruler** | Authoritative, prestigious | Mercedes, Rolex | Luxury, high-end |
| **Everyman** | Relatable, down-to-earth | IKEA, Target | Mass market |

---

## Brand Voice & Tone

### Voice Attributes

Choose 3-5 attributes that define your brand's personality:

**Professional ←→ Casual**
- Professional: "Our platform enables", "We facilitate", "Optimize your workflow"
- Casual: "We help you", "Get it done", "Make your life easier"

**Formal ←→ Playful**
- Formal: "Please complete the registration process"
- Playful: "Let's get you set up! Takes 2 minutes ⏱️"

**Serious ←→ Humorous**
- Serious: "Protect your data with enterprise-grade security"
- Humorous: "We guard your data like a dragon guards treasure 🐉"

**Technical ←→ Simple**
- Technical: "Leverage our API to integrate your existing tech stack"
- Simple: "Connect your favorite tools with one click"

### Tone by Context

| Context | Tone | Example |
|---------|------|---------|
| **Onboarding** | Welcoming, supportive | "Welcome! Let's build something amazing together." |
| **Error messages** | Empathetic, helpful | "Oops! Something went wrong. Let's fix it." |
| **Success states** | Celebratory, encouraging | "🎉 You did it! Your first project is live." |
| **Pricing page** | Confident, transparent | "Simple pricing. No hidden fees. Cancel anytime." |
| **FAQ/Support** | Patient, clear | "Great question! Here's how it works..." |

---

## Logo Concepts (Text-Based)

Since this is an AI agent, we provide **text-based logo concepts** that a designer can execute:

### Logo Type Recommendations

| Type | Description | When to Use | Examples |
|------|-------------|-------------|----------|
| **Wordmark** | Stylized company name | Strong brand name | Google, Coca-Cola |
| **Lettermark** | Initials/acronym | Long name | IBM, HBO, NASA |
| **Icon + Wordmark** | Symbol + text | Balanced approach | Twitter, Airbnb |
| **Abstract Symbol** | Geometric shape | Modern, scalable | Pepsi, Mastercard |
| **Mascot** | Character-based | Friendly, consumer | MailChimp, Duolingo |

### Logo Concept Prompt

```
Generate 3 text-based logo concepts for:

PRODUCT NAME:
{{productName}}

BRAND PERSONALITY:
{{brandPersonality}}

INDUSTRY:
{{industry}}

TARGET AUDIENCE:
{{targetAudience}}

OUTPUT FORMAT:
### Concept 1: [Name]

**Type:** Wordmark / Lettermark / Icon+Word / Abstract / Mascot

**Description:**
[Detailed visual description that a designer can execute]

**Typography:**
- Font style: [Sans-serif/Serif/Display/Mono]
- Weight: [Light/Regular/Bold/Black]
- Case: [Uppercase/Lowercase/Mixed]
- Special treatment: [Ligatures, negative space, custom letters]

**Symbol (if applicable):**
[Description of icon/symbol/shape]

**Colors:**
[Primary color from palette]

**Mood:**
[Professional, playful, minimal, bold, etc.]

**Technical specs:**
- Works at 16px (favicon size)
- Works in monochrome (black/white)
- Scalable (SVG format)
- Memorable at small sizes
```

---

## Branding Deliverables Checklist

- [ ] **Product Name** (1 selected from 10 options)
- [ ] **Tagline** (5-7 words)
- [ ] **Color Palette** (1 selected from 3 options)
  - [ ] Light mode (5 colors)
  - [ ] Dark mode (5 colors)
  - [ ] WCAG AA compliant
- [ ] **Positioning Statement** (2 sentences)
- [ ] **Brand Personality** (3-5 adjectives)
- [ ] **Voice & Tone Guide** (examples for 5 contexts)
- [ ] **Logo Concepts** (3 text-based descriptions)
- [ ] **Typography System** (heading font, body font, sizes)

---

*Generated by Agentik OS Project Creator Agent*
