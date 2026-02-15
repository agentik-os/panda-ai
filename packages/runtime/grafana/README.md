# Grafana Dashboard Setup

Comprehensive Grafana dashboards for monitoring Agentik OS runtime metrics.

---

## 📊 Available Dashboards

### 1. Agentik OS - Overview
**File:** `agentik-os-overview.json`

Comprehensive system overview dashboard showing:
- **Agent Execution**: Rate, duration (p95), errors
- **Message Processing**: Rate by channel
- **Cost Tracking**: Total cost by provider & model
- **System Health**: CPU usage, memory usage, error rate
- **Skills**: Execution rate by skill
- **HTTP**: Request rate by endpoint

### 2. Cost Tracking
**File:** `cost-tracking.json`

Detailed cost analytics dashboard showing:
- **Total Cost**: All providers combined
- **Cost by Provider**: Pie chart breakdown
- **Cost Over Time**: Stacked area chart
- **Cost Per Agent**: Track individual agent spend
- **Token Consumption**: Rate by provider, model, and type (input/output)

---

## 🚀 Quick Start

### Prerequisites

1. **Prometheus** installed and running
2. **Grafana** installed and running
3. **Runtime metrics server** running (`pnpm dev` in runtime package)

### Step 1: Start Metrics Server

The metrics server is automatically started when you run the runtime:

```bash
cd packages/runtime
pnpm dev
```

**Metrics exposed at:**
```
http://localhost:9090/metrics
```

### Step 2: Configure Prometheus

Create or update `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'agentik-os-runtime'
    static_configs:
      - targets: ['localhost:9090']
        labels:
          service: 'agentik-os'
          environment: 'development'
```

Start Prometheus:
```bash
prometheus --config.file=prometheus.yml
```

### Step 3: Add Prometheus to Grafana

1. Open Grafana: `http://localhost:3000`
2. Go to **Configuration** → **Data Sources**
3. Click **Add data source**
4. Select **Prometheus**
5. Configure:
   - **Name**: `prometheus`
   - **URL**: `http://localhost:9090`
   - **Scrape interval**: `15s`
6. Click **Save & Test**

### Step 4: Import Dashboards

1. Go to **Dashboards** → **Import**
2. Upload `agentik-os-overview.json`
3. Select **Prometheus** as data source
4. Click **Import**
5. Repeat for `cost-tracking.json`

---

## 📈 Metrics Reference

### Agent Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `agent_execution_total` | Counter | Total agent executions | `status` (success/error) |
| `agent_execution_duration_seconds` | Histogram | Agent execution duration | - |
| `agent_error_total` | Counter | Total agent errors | `error_type` |
| `active_agents` | Gauge | Current active agents | - |

### Message Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `messages_processed_total` | Counter | Total messages processed | `channel` |

### Cost Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `cost_total_usd` | Counter | Total cost in USD | `provider`, `model` |
| `cost_per_agent_usd` | Gauge | Cost per agent | `agent_id` |
| `cost_tokens_total` | Counter | Total tokens used | `provider`, `model`, `type` (input/output) |

### System Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `system_cpu_usage` | Gauge | CPU usage (%) | - |
| `system_memory_usage` | Gauge | Memory usage (%) | - |

### Skills Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `skills_executed_total` | Counter | Total skill executions | `skill_id` |

### Channel Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `channel_messages_total` | Counter | Messages per channel | `channel_type` |

### HTTP Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `http_requests_total` | Counter | Total HTTP requests | `method`, `path`, `status` |

---

## 🎯 Performance Targets

All dashboards visualize these production targets:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Agent execution p95 | <200ms | >500ms |
| Agent startup | <1s | >2s |
| Skill execution overhead | <50ms | >100ms |
| Error rate | <0.1% | >1% |
| CPU usage | <70% | >90% |
| Memory usage | <70% | >90% |

---

## 🔧 Customization

### Adding New Panels

1. Open dashboard in Grafana
2. Click **Add panel**
3. Select **Prometheus** data source
4. Write PromQL query (see examples below)
5. Configure visualization
6. Click **Apply**

### Example PromQL Queries

```promql
# Average agent execution duration (5m window)
avg(rate(agent_execution_duration_seconds_sum[5m]) / rate(agent_execution_duration_seconds_count[5m]))

# Error rate (% of total executions)
(rate(agent_error_total[5m]) / rate(agent_execution_total[5m])) * 100

# Cost per hour by provider
rate(cost_total_usd[1h]) * 3600

# Top 5 most expensive models
topk(5, cost_total_usd)

# Agent execution success rate
(1 - (rate(agent_error_total[5m]) / rate(agent_execution_total[5m]))) * 100
```

---

## 🚨 Alerts Configuration

### Recommended Alerts

Create alerts in Grafana for:

1. **High Error Rate**
   - Condition: `rate(agent_error_total[5m]) > 0.01`
   - Severity: Critical

2. **High CPU Usage**
   - Condition: `system_cpu_usage > 90`
   - Severity: Warning

3. **High Memory Usage**
   - Condition: `system_memory_usage > 90`
   - Severity: Warning

4. **Slow Agent Execution**
   - Condition: `histogram_quantile(0.95, rate(agent_execution_duration_seconds_bucket[5m])) > 5`
   - Severity: Warning

5. **Budget Exceeded**
   - Condition: `cost_total_usd > 100`
   - Severity: Critical

---

## 📝 Dashboard Variables

Both dashboards support these variables (add in **Settings** → **Variables**):

| Variable | Type | Query |
|----------|------|-------|
| `agent_id` | Query | `label_values(agent_execution_total, agent_id)` |
| `provider` | Query | `label_values(cost_total_usd, provider)` |
| `channel` | Query | `label_values(messages_processed_total, channel)` |
| `environment` | Custom | `development,staging,production` |

---

## 🔍 Troubleshooting

### Metrics Not Showing

1. **Check metrics server is running:**
   ```bash
   curl http://localhost:9090/metrics
   ```
   Should return Prometheus text format.

2. **Check Prometheus scraping:**
   - Go to Prometheus UI: `http://localhost:9090/targets`
   - Verify `agentik-os-runtime` target is UP

3. **Check Prometheus data source in Grafana:**
   - Go to **Data Sources** → **Prometheus**
   - Click **Test** (should show green checkmark)

### Dashboard Shows "No Data"

1. **Generate some metrics:**
   ```bash
   # Run some agents to generate data
   pnpm test:bench
   pnpm test:load:agents
   ```

2. **Check time range:**
   - Click time picker (top right)
   - Select "Last 15 minutes"

3. **Verify PromQL queries:**
   - Go to **Explore**
   - Run query manually
   - Check if data exists

### Metrics Reset After Restart

This is expected behavior. Counters reset when runtime restarts.

**Solution:** Use `rate()` or `increase()` functions to calculate changes over time.

---

## 📦 Export & Backup

### Export Dashboard

1. Open dashboard
2. Click **Settings** (gear icon)
3. Click **JSON Model** (left sidebar)
4. Copy JSON
5. Save to file

### Backup All Dashboards

```bash
# Using Grafana API
export GRAFANA_URL="http://localhost:3000"
export GRAFANA_TOKEN="your-api-token"

curl -H "Authorization: Bearer $GRAFANA_TOKEN" \
  "$GRAFANA_URL/api/dashboards/uid/agentik-os-overview" | \
  jq '.dashboard' > backup-overview.json

curl -H "Authorization: Bearer $GRAFANA_TOKEN" \
  "$GRAFANA_URL/api/dashboards/uid/agentik-os-cost" | \
  jq '.dashboard' > backup-cost.json
```

---

## 🔗 Resources

- **Prometheus Docs**: https://prometheus.io/docs/
- **Grafana Docs**: https://grafana.com/docs/
- **PromQL Guide**: https://prometheus.io/docs/prometheus/latest/querying/basics/
- **Grafana Dashboards**: https://grafana.com/grafana/dashboards/

---

**Dashboards maintained by:** runtime-backend team
**Last updated:** 2026-02-14
