import type { Message, ComplexityScore } from "@agentik-os/shared";

const COMPLEXITY_KEYWORDS = {
  high: ["code", "implement", "refactor", "debug", "optimize", "architecture"],
  medium: ["explain", "analyze", "compare", "design", "plan"],
  simple: ["hello", "hi", "thanks", "yes", "no", "ok"],
};

export function calculateComplexity(message: Message): ComplexityScore {
  const factors = {
    length: calculateLengthScore(message.content),
    hasCode: detectCodeBlocks(message.content),
    hasAttachments: Boolean(message.attachments && message.attachments.length > 0),
    keywords: detectKeywords(message.content),
  };

  const score = aggregateScore(factors);

  return { score, factors };
}

function calculateLengthScore(content: string): number {
  const length = content.length;

  if (length < 50) return 10;
  if (length < 200) return 30;
  if (length < 500) return 50;
  if (length < 1000) return 70;
  return 100;
}

function detectCodeBlocks(content: string): boolean {
  // Detect markdown code blocks or code-like patterns
  return (
    content.includes("```") ||
    content.includes("function") ||
    content.includes("class ") ||
    /import .* from/.test(content) ||
    /const|let|var /.test(content)
  );
}

function detectKeywords(content: string): string[] {
  const lowerContent = content.toLowerCase();
  const found: string[] = [];

  for (const [, keywords] of Object.entries(COMPLEXITY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        found.push(keyword);
      }
    }
  }

  return found;
}

function aggregateScore(factors: ComplexityScore["factors"]): number {
  let score = factors.length;

  // Code presence adds significant complexity
  if (factors.hasCode) {
    score = Math.min(100, score + 40);
  }

  // Attachments add complexity
  if (factors.hasAttachments) {
    score = Math.min(100, score + 20);
  }

  // Keyword complexity
  const hasHighKeywords = factors.keywords.some((kw) =>
    COMPLEXITY_KEYWORDS.high.includes(kw)
  );
  const hasMediumKeywords = factors.keywords.some((kw) =>
    COMPLEXITY_KEYWORDS.medium.includes(kw)
  );

  if (hasHighKeywords) {
    score = Math.min(100, score + 30);
  } else if (hasMediumKeywords) {
    score = Math.min(100, score + 15);
  }

  return Math.max(0, Math.min(100, score));
}
