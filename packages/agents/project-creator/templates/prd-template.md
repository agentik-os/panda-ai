# {{projectName}} - Product Requirements Document

> **Version:** 1.0.0
> **Last Updated:** {{date}}
> **Author:** Project Creator Agent
> **Status:** {{status}}

---

## Executive Summary

**Project Name:** {{projectName}}

**Tagline:** {{tagline}}

**Problem:**
{{problemStatement}}

**Solution:**
{{solutionStatement}}

**Target Users:**
{{#each targetUsers}}
- {{this}}
{{/each}}

**Business Model:**
{{businessModel}}

**Success Metrics:**
- **Acquisition:** {{acquisitionMetric}}
- **Activation:** {{activationMetric}}
- **Retention:** {{retentionMetric}}
- **Revenue:** {{revenueMetric}}
- **Referral:** {{referralMetric}}

---

## 1. Product Vision

### 1.1 Mission Statement

{{missionStatement}}

### 1.2 Product Positioning

{{productPositioning}}

### 1.3 Competitive Landscape

| Competitor | Strengths | Weaknesses | Our Advantage |
|------------|-----------|------------|---------------|
{{#each competitors}}
| {{name}} | {{strengths}} | {{weaknesses}} | {{ourAdvantage}} |
{{/each}}

---

## 2. User Personas

{{#each personas}}
### {{@index}}. {{name}}

**Demographics:**
- Age: {{age}}
- Occupation: {{occupation}}
- Tech savviness: {{techLevel}}

**Goals:**
{{#each goals}}
- {{this}}
{{/each}}

**Pain Points:**
{{#each painPoints}}
- {{this}}
{{/each}}

**User Story:**
"{{userStory}}"

---
{{/each}}

## 3. Features & Requirements

### 3.1 MVP Features (Phase 1)

{{#each mvpFeatures}}
#### {{id}}. {{name}}

**Priority:** {{priority}}
**User Story:** {{userStory}}

**Description:**
{{description}}

**Acceptance Criteria:**
{{#each acceptanceCriteria}}
- [ ] {{this}}
{{/each}}

**Technical Notes:**
{{technicalNotes}}

---
{{/each}}

### 3.2 Post-MVP Features (Future Phases)

{{#each futureFeatures}}
- **{{name}}** (Phase {{phase}}) - {{description}}
{{/each}}

---

## 4. User Flows

{{#each userFlows}}
### {{name}}

```
{{#each steps}}
{{@index}}. {{action}} → {{outcome}}
{{/each}}
```

**Happy Path:**
{{happyPath}}

**Error Cases:**
{{#each errorCases}}
- {{trigger}} → {{handling}}
{{/each}}

---
{{/each}}

## 5. Technical Architecture

### 5.1 Stack Overview

| Layer | Technology | Justification |
|-------|------------|---------------|
| Frontend | {{stack.frontend}} | {{stack.frontendReason}} |
| Backend | {{stack.backend}} | {{stack.backendReason}} |
| Database | {{stack.database}} | {{stack.databaseReason}} |
| Authentication | {{stack.auth}} | {{stack.authReason}} |
| Payments | {{stack.payments}} | {{stack.paymentsReason}} |
| Deployment | {{stack.deployment}} | {{stack.deploymentReason}} |

### 5.2 Data Models

{{#each dataModels}}
#### {{name}}

```typescript
{{schema}}
```

**Relationships:**
{{#each relationships}}
- {{this}}
{{/each}}

---
{{/each}}

### 5.3 API Endpoints

{{#each apiEndpoints}}
#### {{method}} {{path}}

**Description:** {{description}}

**Request:**
```json
{{requestExample}}
```

**Response:**
```json
{{responseExample}}
```

**Authentication:** {{authRequired}}

---
{{/each}}

### 5.4 Third-Party Integrations

{{#each integrations}}
- **{{name}}** ({{purpose}})
  - API: {{apiUrl}}
  - Docs: {{docsUrl}}
  - Cost: {{cost}}
{{/each}}

---

## 6. Design System

### 6.1 Brand Colors

```css
/* Primary Palette */
--color-primary: {{colors.primary}};
--color-secondary: {{colors.secondary}};
--color-accent: {{colors.accent}};

/* Neutrals */
--color-background: {{colors.background}};
--color-surface: {{colors.surface}};
--color-text: {{colors.text}};
--color-text-muted: {{colors.textMuted}};

/* Semantic */
--color-success: {{colors.success}};
--color-warning: {{colors.warning}};
--color-error: {{colors.error}};
--color-info: {{colors.info}};
```

### 6.2 Typography

```css
/* Font Families */
--font-heading: {{typography.heading}};
--font-body: {{typography.body}};
--font-mono: {{typography.mono}};

/* Scale */
--text-xs: {{typography.scale.xs}};
--text-sm: {{typography.scale.sm}};
--text-base: {{typography.scale.base}};
--text-lg: {{typography.scale.lg}};
--text-xl: {{typography.scale.xl}};
--text-2xl: {{typography.scale.xxl}};
```

### 6.3 Component Library

Based on **shadcn/ui** + custom components:

{{#each components}}
- {{name}} ({{variants}} variants)
{{/each}}

---

## 7. Success Metrics (AARRR)

### Acquisition
- **Target:** {{metrics.acquisition.target}}
- **Channels:** {{#each metrics.acquisition.channels}}{{this}}, {{/each}}
- **Cost per Acquisition:** {{metrics.acquisition.cpa}}

### Activation
- **Target:** {{metrics.activation.target}}
- **Definition:** {{metrics.activation.definition}}
- **Time to Value:** {{metrics.activation.ttv}}

### Retention
- **Target:** {{metrics.retention.target}}
- **DAU/MAU Ratio:** {{metrics.retention.dauMau}}
- **Churn Rate:** {{metrics.retention.churn}}

### Revenue
- **MRR Goal:** {{metrics.revenue.mrrGoal}}
- **ARPU:** {{metrics.revenue.arpu}}
- **LTV:** {{metrics.revenue.ltv}}

### Referral
- **Target:** {{metrics.referral.target}}
- **Viral Coefficient:** {{metrics.referral.viralCoeff}}
- **Incentives:** {{metrics.referral.incentives}}

---

## 8. Go-to-Market Strategy

### 8.1 Launch Plan

**Phase 1: Soft Launch** (Week 1-2)
{{#each launchPlan.softLaunch}}
- {{this}}
{{/each}}

**Phase 2: Public Launch** (Week 3-4)
{{#each launchPlan.publicLaunch}}
- {{this}}
{{/each}}

**Phase 3: Scale** (Month 2-3)
{{#each launchPlan.scale}}
- {{this}}
{{/each}}

### 8.2 Marketing Channels

{{#each marketingChannels}}
- **{{name}}** ({{budget}}/month) - {{strategy}}
{{/each}}

### 8.3 Pricing Strategy

{{#each pricingTiers}}
#### {{name}} - ${{price}}/{{interval}}

{{description}}

**Features:**
{{#each features}}
- {{this}}
{{/each}}

**Target Segment:** {{targetSegment}}

---
{{/each}}

---

## 9. Risks & Mitigation

{{#each risks}}
### {{severity}} Risk: {{name}}

**Description:**
{{description}}

**Probability:** {{probability}}
**Impact:** {{impact}}

**Mitigation Strategy:**
{{mitigation}}

**Contingency Plan:**
{{contingency}}

---
{{/each}}

---

## 10. Timeline & Milestones

| Milestone | Target Date | Deliverables | Status |
|-----------|-------------|--------------|--------|
{{#each milestones}}
| {{name}} | {{date}} | {{deliverables}} | {{status}} |
{{/each}}

---

## 11. Budget & Resources

### 11.1 Development Budget

| Item | Cost | Notes |
|------|------|-------|
{{#each budget.development}}
| {{item}} | ${{cost}} | {{notes}} |
{{/each}}
| **Total** | **${{budget.total}}** | |

### 11.2 Team Requirements

{{#each team}}
- **{{role}}** ({{commitment}}) - {{responsibilities}}
{{/each}}

---

## 12. Appendix

### 12.1 Glossary

{{#each glossary}}
- **{{term}}:** {{definition}}
{{/each}}

### 12.2 References

{{#each references}}
- [{{title}}]({{url}})
{{/each}}

---

**Document Status:** {{status}}
**Next Review:** {{nextReviewDate}}

---

*Generated by Agentik OS Project Creator Agent*
