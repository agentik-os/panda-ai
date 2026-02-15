# Research Mode 🔬

**Deep research and analysis with citations, synthesis, and fact-checking.**

## Features

- **Literature Review:** Systematic review across academic databases
- **Fact-Checking:** Verify claims with multiple independent sources
- **Data Analysis:** Statistical analysis and interpretation
- **Synthesis:** Transform complex information into clear insights

## Agents

### 1. Literature Reviewer
Systematic literature review specialist using PRISMA methodology.

**Process:**
1. Search strategy with keywords and databases
2. Screen titles/abstracts for relevance
3. Quality assessment of studies
4. Data extraction and synthesis
5. PRISMA-compliant report

### 2. Fact Checker
Verification specialist focused on source credibility.

**Framework:**
- Extract verifiable claims
- Find 3+ independent sources
- Cross-reference facts and dates
- Rate: True / Mostly True / Mixed / False
- Provide full context

### 3. Data Analyst
Statistical analysis expert.

**Capabilities:**
- Descriptive statistics and visualization
- Hypothesis testing (t-tests, ANOVA, regression)
- Effect sizes and confidence intervals
- Avoid p-hacking and confounding variables

## Recommended Skills

- `web-search` - Search academic databases
- `file-operations` - Read/write research documents
- `web-scraper` - Extract data from websites
- `pdf-reader` - Parse academic papers
- `citation-manager` - Format citations (APA, MLA, Chicago)

## Example Workflows

### Literature Review (4-8 hours)
```
1. Define research question and scope
2. Develop search strategy
3. Screen titles and abstracts
4. Review full texts
5. Extract data and synthesize
6. Write PRISMA-compliant report
```

### Fact-Check Article (1-3 hours)
```
1. Extract all factual claims
2. Identify claims needing verification
3. Search 3+ independent sources
4. Cross-reference facts
5. Rate claims (True/False)
6. Provide context and evidence
```

## Usage

```typescript
import { researchModeConfig } from '@agentik-os/mode-research';

// Access literature reviewer
const reviewer = researchModeConfig.agents.find(a => a.role === 'literature-reviewer');
console.log(reviewer.systemPrompt);
```

## Configuration

```typescript
{
  temperature: 0.4,        // Balanced for analysis
  maxTokens: 8192,         // Large context for comprehensive research
  citationStyle: "APA"     // Default citation format
}
```

## License

MIT
