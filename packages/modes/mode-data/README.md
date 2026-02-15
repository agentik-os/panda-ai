# Data Mode

**Data analysis, visualization, and machine learning assistant**

## Overview

Data Mode provides specialized assistance for data science, statistical analysis, and machine learning tasks. It includes agents optimized for data exploration, visualization, and predictive modeling.

## Features

- **Statistical Analysis**: Descriptive statistics, hypothesis testing, regression analysis
- **Data Visualization**: Charts, dashboards, interactive plots
- **Data Cleaning**: Missing values, outliers, normalization
- **Machine Learning**: Model selection, training, evaluation, hyperparameter tuning
- **Big Data**: Scalable data processing with Spark, Dask

## Agents

### Data Analyst
- **Role**: Exploratory data analysis, statistical testing
- **Model**: Claude Sonnet 4.5
- **Skills**: file-operations, web-search, sql-query, python-exec

### Visualization Specialist
- **Role**: Creates clear, informative data visualizations
- **Model**: Claude Sonnet 4.5
- **Skills**: file-operations, python-exec

### ML Engineer
- **Role**: Builds and tunes machine learning models
- **Model**: Claude Sonnet 4.5
- **Skills**: file-operations, python-exec, web-search

## Recommended Skills

- `file-operations` - Read/write datasets
- `web-search` - Research techniques and libraries
- `sql-query` - Database queries
- `python-exec` - Execute analysis code

## Example Workflows

### Customer Segmentation Analysis (4-6 hours)
1. **Load Data**: Import customer data, check schema
2. **EDA**: Distribution analysis, correlation matrix
3. **Feature Engineering**: Create RFM metrics
4. **Clustering**: K-means, determine optimal k
5. **Visualization**: Segment profiles, business insights

### Predictive Model Development (6-8 hours)
1. **Data Prep**: Clean, split train/test, normalize
2. **Baseline**: Simple model for comparison
3. **Feature Selection**: Correlation, importance
4. **Model Training**: Try multiple algorithms
5. **Evaluation**: Metrics, confusion matrix, ROC curve
6. **Tuning**: Hyperparameter optimization

### Data Quality Report (2-3 hours)
1. **Schema Validation**: Types, constraints
2. **Completeness Check**: Missing values analysis
3. **Consistency**: Duplicates, outliers
4. **Distribution**: Summary statistics, histograms
5. **Report**: Automated quality report

## Configuration

- **Temperature**: 0.3 (precise, analytical)
- **Max Tokens**: 8192 (large context for datasets)

## Usage

```typescript
import { dataModeConfig, DATA_MODE_SYSTEM_PROMPT, DATA_MODE_AGENTS } from '@agentik-os/mode-data';

// Use in your agent runtime
const agent = new Agent({
  mode: dataModeConfig,
  systemPrompt: DATA_MODE_SYSTEM_PROMPT,
});
```
