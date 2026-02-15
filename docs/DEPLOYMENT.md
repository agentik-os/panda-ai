# Agentik OS - Deployment Guide

Complete guide for deploying Agentik OS in production environments.

---

## Table of Contents

1. [Docker Compose (Recommended for Small-Medium)](#docker-compose)
2. [Kubernetes Helm (Recommended for Enterprise)](#kubernetes-helm)
3. [Air-Gapped Deployment (Offline Mode)](#air-gapped-deployment)
4. [Multi-Tenancy Configuration](#multi-tenancy)
5. [Monitoring & Observability](#monitoring)
6. [Troubleshooting](#troubleshooting)

---

## Docker Compose

**Best for:** Small to medium deployments (1-100 concurrent users)

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/agentik-os/agentik-os
cd agentik-os

# 2. Copy environment template
cp .env.example .env

# 3. Configure environment variables
nano .env

# 4. Start services
docker-compose -f docker-compose.prod.yml up -d

# 5. Verify deployment
docker-compose -f docker-compose.prod.yml ps
```

### Environment Variables

Required environment variables in `.env`:

```bash
# Convex (Backend)
CONVEX_URL=https://your-convex-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# Authentication (Clerk)
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# AI Providers
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
GOOGLE_API_KEY=xxxxx

# OAuth (Optional)
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx
MICROSOFT_CLIENT_ID=xxxxx
MICROSOFT_CLIENT_SECRET=xxxxx

# Ports
DASHBOARD_PORT=3000
RUNTIME_PORT=8080
CLI_GATEWAY_PORT=9090
HTTP_PORT=80
HTTPS_PORT=443

# Features
MULTI_TENANT=true
AIR_GAPPED_MODE=false
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| **dashboard** | 3000 | Next.js 16 Web UI |
| **runtime** | 8080 | Agent runtime backend |
| **cli-gateway** | 9090 | Remote CLI access |
| **redis** | 6379 | Caching & rate limiting |
| **nginx** | 80/443 | Reverse proxy |
| **prometheus** | 9091 | Metrics collection |
| **grafana** | 3001 | Dashboards |

### Production Best Practices

```bash
# Enable SSL/TLS
# 1. Place certificates in nginx/ssl/
cp /path/to/cert.crt nginx/ssl/
cp /path/to/cert.key nginx/ssl/

# 2. Update nginx.conf with SSL config

# Enable auto-restart
docker-compose -f docker-compose.prod.yml up -d --restart=unless-stopped

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale runtime backend
docker-compose -f docker-compose.prod.yml up -d --scale runtime=3

# Health check
curl http://localhost:8080/health
```

### Backup & Recovery

```bash
# Backup volumes
docker run --rm -v agentik-os_agent-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/agent-data-$(date +%Y%m%d).tar.gz -C /data .

# Restore volumes
docker run --rm -v agentik-os_agent-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/agent-data-20240214.tar.gz -C /data
```

---

## Kubernetes Helm

**Best for:** Enterprise deployments (100+ concurrent users, HA required)

### Prerequisites

- Kubernetes cluster (v1.25+)
- Helm 3 installed
- kubectl configured

### Installation

```bash
# 1. Add Helm repository (once available)
helm repo add agentik-os https://charts.agentik-os.com
helm repo update

# 2. Create namespace
kubectl create namespace agentik-os

# 3. Create secrets
kubectl create secret generic agentik-os-secrets \
  --from-literal=convex-deploy-key=YOUR_KEY \
  --from-literal=anthropic-api-key=YOUR_KEY \
  --from-literal=openai-api-key=YOUR_KEY \
  --from-literal=google-api-key=YOUR_KEY \
  --from-literal=clerk-secret-key=YOUR_KEY \
  -n agentik-os

# 4. Install chart
helm install agentik-os agentik-os/agentik-os \
  --namespace agentik-os \
  --values values-production.yaml
```

### Custom values.yaml

Create `values-production.yaml`:

```yaml
# Replicas for HA
dashboard:
  replicaCount: 3
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 20

runtime:
  replicaCount: 5
  autoscaling:
    enabled: true
    minReplicas: 5
    maxReplicas: 50

# Ingress
ingress:
  enabled: true
  className: nginx
  hosts:
    - host: agentik-os.yourdomain.com
      paths:
        - path: /
          service: dashboard
        - path: /api
          service: runtime
  tls:
    - secretName: agentik-os-tls
      hosts:
        - agentik-os.yourdomain.com

# Resources
runtime:
  resources:
    requests:
      cpu: 2000m
      memory: 4Gi
    limits:
      cpu: 4000m
      memory: 8Gi

# Persistence
runtime:
  persistence:
    enabled: true
    size: 100Gi
    storageClass: fast-ssd

# Monitoring
monitoring:
  prometheus:
    enabled: true
  grafana:
    enabled: true
```

### Operations

```bash
# Check deployment status
helm status agentik-os -n agentik-os

# Upgrade deployment
helm upgrade agentik-os agentik-os/agentik-os \
  --namespace agentik-os \
  --values values-production.yaml

# Rollback
helm rollback agentik-os 1 -n agentik-os

# Uninstall
helm uninstall agentik-os -n agentik-os

# View logs
kubectl logs -f deployment/agentik-os-runtime -n agentik-os

# Scale manually
kubectl scale deployment/agentik-os-runtime --replicas=10 -n agentik-os
```

---

## Air-Gapped Deployment

**For:** High-security environments, offline deployments

### Setup

```bash
# 1. Download offline bundle (includes Docker images + Ollama models)
wget https://releases.agentik-os.com/offline/agentik-os-offline-v1.0.0.tar.gz

# 2. Extract bundle
tar xzf agentik-os-offline-v1.0.0.tar.gz
cd agentik-os-offline

# 3. Load Docker images
./scripts/load-images.sh

# 4. Start with offline mode
docker-compose -f docker-compose.airgapped.yml up -d
```

### Features in Air-Gapped Mode

| Feature | Air-Gapped Support |
|---------|-------------------|
| **Local LLMs** | ✅ Ollama (Llama 2, CodeLlama, Mistral) |
| **Vector DB** | ✅ ChromaDB (local) |
| **Authentication** | ✅ Local users (no SSO) |
| **Marketplace** | ⚠️ Pre-bundled skills only |
| **Updates** | ⚠️ Manual (new offline bundles) |

### Configuration

In `.env` for air-gapped mode:

```bash
AIR_GAPPED_MODE=true

# Disable external services
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=

# Enable local models
OLLAMA_ENABLED=true
OLLAMA_MODELS=llama2,codellama,mistral

# Local vector store
VECTOR_STORE=chroma
CHROMA_PATH=/app/data/chroma
```

---

## Multi-Tenancy

### Enable Multi-Tenancy

In `.env`:

```bash
MULTI_TENANT=true
```

In Helm `values.yaml`:

```yaml
multiTenant:
  enabled: true
  defaultPlan: "free"
  plans:
    free:
      maxAgents: 3
      maxUsers: 1
      maxStorageGB: 1
    pro:
      maxAgents: 50
      maxUsers: 10
      maxStorageGB: 50
    enterprise:
      maxAgents: unlimited
      maxUsers: unlimited
      maxStorageGB: unlimited
```

### Tenant Isolation

- **Row-Level Security:** Every table includes `tenantId` column
- **API Scoping:** All API requests scoped to tenant
- **Storage Isolation:** Separate storage paths per tenant
- **Resource Limits:** Enforced per-tenant quotas

### Create Tenant (API)

```bash
curl -X POST https://api.agentik-os.com/v1/tenants \
  -H "Authorization: Bearer ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "plan": "enterprise",
    "organizationId": "org_xxxxx"
  }'
```

---

## Monitoring

### Prometheus Metrics

Available at `http://your-domain:9091/metrics`

Key metrics:
- `agentik_agents_active` - Active agent count
- `agentik_conversations_total` - Total conversations
- `agentik_requests_total` - Total API requests
- `agentik_requests_duration_seconds` - Request latency
- `agentik_errors_total` - Error count

### Grafana Dashboards

Access Grafana at `http://your-domain:3001`

Pre-built dashboards:
1. **Agent Performance** - Agent response times, success rates
2. **System Health** - CPU, memory, disk usage
3. **User Activity** - Active users, conversations
4. **Cost Tracking** - AI API costs per tenant

### Alerts

Configure alerts in Prometheus:

```yaml
groups:
  - name: agentik-os
    rules:
      - alert: HighErrorRate
        expr: rate(agentik_errors_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes > 8e9
        for: 10m
        annotations:
          summary: "Runtime using >8GB memory"
```

---

## Troubleshooting

### Dashboard not loading

```bash
# Check dashboard logs
docker-compose logs dashboard

# Verify Convex connection
curl https://your-convex.convex.cloud/_system/status

# Check environment variables
docker-compose exec dashboard env | grep CONVEX
```

### Runtime backend errors

```bash
# Check runtime logs
docker-compose logs runtime

# Verify API keys
docker-compose exec runtime node -e "console.log(process.env.ANTHROPIC_API_KEY)"

# Test health endpoint
curl http://localhost:8080/health
```

### Permission denied (Multi-tenant)

```bash
# Check tenant context in request headers
curl -H "X-Tenant-ID: tenant-xxx" https://api.agentik-os.com/v1/agents

# Verify user role
SELECT role FROM users WHERE id = 'user-xxx';
```

### Kubernetes pod crashes

```bash
# Check pod logs
kubectl logs -f pod/agentik-os-runtime-xxxxx -n agentik-os

# Describe pod (events)
kubectl describe pod/agentik-os-runtime-xxxxx -n agentik-os

# Check resource limits
kubectl top pods -n agentik-os
```

---

## Performance Tuning

### Docker Compose

```yaml
# Increase runtime replicas
runtime:
  deploy:
    replicas: 5
    resources:
      limits:
        cpus: '4'
        memory: 8G
```

### Kubernetes

```yaml
# Enable Horizontal Pod Autoscaler
autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 100
  targetCPUUtilizationPercentage: 70
```

### Redis Tuning

```bash
# Increase max memory
redis:
  command: redis-server --maxmemory 8gb --maxmemory-policy allkeys-lru
```

---

## Support

- **Documentation:** https://docs.agentik-os.com
- **GitHub Issues:** https://github.com/agentik-os/agentik-os/issues
- **Enterprise Support:** support@agentik-os.com

---

**Last Updated:** 2026-02-14
**Version:** 1.0.0
