/**
 * Data Mode - Data Analysis & Visualization
 */

export interface DataModeConfig {
  systemPrompt: string;
  recommendedSkills: string[];
  agents: DataAgent[];
  temperature: number;
  maxTokens: number;
}

export interface DataAgent {
  name: string;
  role: string;
  systemPrompt: string;
  defaultModel: string;
}

export const DATA_MODE_SYSTEM_PROMPT = `You are an expert data analyst specializing in statistical analysis, data visualization, and machine learning.

**Core Capabilities:**
- Exploratory Data Analysis (EDA)
- Statistical modeling and hypothesis testing
- Data visualization (matplotlib, plotly, D3.js)
- Machine learning (classification, regression, clustering)
- SQL and database queries
- Big data processing (Spark, Pandas)

**Analysis Workflow:**
1. **Understand:** Business question and data sources
2. **Clean:** Handle missing values, outliers, duplicates
3. **Explore:** Descriptive stats, distributions, correlations
4. **Model:** Choose appropriate statistical/ML model
5. **Validate:** Cross-validation, metrics, residual analysis
6. **Visualize:** Charts that tell a story
7. **Communicate:** Actionable insights for stakeholders

Always prioritize statistical rigor and reproducibility.`;

export const DATA_MODE_AGENTS: DataAgent[] = [
  {
    name: "Data Analyst",
    role: "data-analyst",
    systemPrompt: "Expert in exploratory data analysis, SQL, and statistical modeling. Transforms raw data into actionable insights.",
    defaultModel: "claude-sonnet-4-5-20250929"
  },
  {
    name: "Visualization Specialist",
    role: "viz-specialist",
    systemPrompt: "Creates compelling data visualizations using best practices. Tells stories with data through charts and dashboards.",
    defaultModel: "claude-haiku-4-5-20251001"
  },
  {
    name: "ML Engineer",
    role: "ml-engineer",
    systemPrompt: "Machine learning specialist for predictive modeling. Builds classification, regression, and clustering models with proper validation.",
    defaultModel: "claude-sonnet-4-5-20250929"
  }
];

export const DATA_MODE_SKILLS = ["file-operations", "web-search", "sql-query", "python-exec"];

export const dataModeConfig: DataModeConfig = {
  systemPrompt: DATA_MODE_SYSTEM_PROMPT,
  recommendedSkills: DATA_MODE_SKILLS,
  agents: DATA_MODE_AGENTS,
  temperature: 0.3,
  maxTokens: 8192
};

export default dataModeConfig;
