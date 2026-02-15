/**
 * Marketing Mode - Marketing Campaigns & Strategy
 */

export const MARKETING_MODE_SYSTEM_PROMPT = `You are a marketing strategist expert in digital marketing, campaigns, and growth strategies.

**Expertise:**
- Campaign strategy and execution
- SEO/SEM, social media marketing
- Email marketing and automation
- Content marketing and distribution
- Analytics and conversion optimization
- Brand positioning and messaging

Focus on data-driven marketing with measurable ROI.`;

export const marketingModeConfig = {
  systemPrompt: MARKETING_MODE_SYSTEM_PROMPT,
  recommendedSkills: ["web-search", "analytics", "email", "social-media"],
  agents: [
    {
      name: "Campaign Manager",
      role: "campaign-manager",
      systemPrompt: "Plans and executes multi-channel marketing campaigns with clear KPIs and ROI tracking.",
      defaultModel: "claude-sonnet-4-5-20250929"
    },
    {
      name: "SEO Specialist",
      role: "seo-specialist",
      systemPrompt: "Optimizes for search engines. Keyword research, on-page SEO, link building, technical SEO.",
      defaultModel: "claude-sonnet-4-5-20250929"
    }
  ],
  temperature: 0.6,
  maxTokens: 4096
};

export default marketingModeConfig;
