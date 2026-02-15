# Enterprise Deployment Guide

> **Target Audience:** DevOps Engineers, SREs, Enterprise IT Teams
> **Prerequisites:** Docker, Kubernetes (optional), Cloud provider account
> **Estimated Setup Time:** 2-4 hours

---

## Overview

This guide covers deploying Agentik OS in enterprise environments with:
- High availability (HA) architecture
- Horizontal scaling
- Security hardening
- Monitoring & observability
- Disaster recovery

---

## Deployment Options

| Option | Use Case | Complexity | Scalability |
|--------|----------|------------|-------------|
| **Docker Compose** | Dev/staging, small teams | Low | Limited |
| **Kubernetes** | Production, large orgs | Medium | High |
| **Cloud Managed** | Fastest setup, auto-scaling | Low | Very High |
| **Air-Gapped** | High security, compliance | High | Medium |

---

## 1. Docker Compose Deployment

### Prerequisites
```bash
# Required
docker --version  # >= 24.0
docker-compose --version  # >= 2.20

# Recommended system resources
# - CPU: 4+ cores
# - RAM: 8GB+
# - Disk: 50GB+ SSD
```

### Quick Start

**Step 1: Clone Repository**
```bash
git clone https://github.com/agentik-os/agentik-os.git
cd agentik-os
```

**Step 2: Configure Environment**
```bash
cp .env.example .env
nano .env  # Configure secrets
```

**Required Environment Variables:**
```env
# Convex Backend
CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# AI Providers (at least one required)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...

# Dashboard (auto-generated if not set)
DASHBOARD_SECRET=random-32-char-string

# Database (uses Convex by default)
# Optional: PostgreSQL for self-hosted
# DATABASE_URL=postgresql://user:pass@localhost:5432/agentik

# Optional: Redis for caching
# REDIS_URL=redis://localhost:6379
```

**Step 3: Deploy**
```bash
docker-compose up -d
```

**Step 4: Verify**
```bash
# Check services
docker-compose ps

# Expected output:
# NAME              STATUS   PORTS
# agentik-runtime   Up       0.0.0.0:3000->3000/tcp
# agentik-dashboard Up       0.0.0.0:3001->3001/tcp
# agentik-websocket Up       0.0.0.0:3002->3002/tcp

# Check logs
docker-compose logs -f
```

**Step 5: Access Dashboard**
```
http://localhost:3001
```

### Production Hardening

**Enable HTTPS (Recommended):**
```yaml
# docker-compose.prod.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - dashboard
```

**Configure Nginx:**
```nginx
# nginx.conf
server {
  listen 443 ssl http2;
  server_name agentik.yourcompany.com;

  ssl_certificate /etc/nginx/ssl/cert.pem;
  ssl_certificate_key /etc/nginx/ssl/key.pem;

  location / {
    proxy_pass http://dashboard:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location /ws {
    proxy_pass http://websocket:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

---

## 2. Kubernetes Deployment

### Prerequisites
```bash
kubectl version  # >= 1.27
helm version     # >= 3.12
```

### Architecture

```
┌─────────────────────────────────────────┐
│           Load Balancer (Ingress)        │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│   Dashboard    │    │   WebSocket     │
│   (3 replicas) │    │   (2 replicas)  │
└────────────────┘    └─────────────────┘
        │                       │
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │   Runtime Engine      │
        │   (5 replicas)        │
        └───────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│   Convex DB    │    │   Redis Cache   │
│   (managed)    │    │   (3 replicas)  │
└────────────────┘    └─────────────────┘
```

### Helm Chart Installation

**Step 1: Add Helm Repository**
```bash
# TODO: Will be published after Phase 3 completion
helm repo add agentik-os https://helm.agentik-os.dev
helm repo update
```

**Step 2: Create Values File**
```yaml
# values.prod.yaml
replicaCount:
  runtime: 5
  dashboard: 3
  websocket: 2

image:
  repository: ghcr.io/agentik-os/agentik-os
  tag: "1.0.0"
  pullPolicy: IfNotPresent

resources:
  runtime:
    requests:
      memory: "2Gi"
      cpu: "1000m"
    limits:
      memory: "4Gi"
      cpu: "2000m"

env:
  CONVEX_URL: "https://your-deployment.convex.cloud"
  # Secrets managed via Kubernetes Secrets

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: agentik.yourcompany.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: agentik-tls
      hosts:
        - agentik.yourcompany.com

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

**Step 3: Create Secrets**
```bash
kubectl create secret generic agentik-secrets \
  --from-literal=ANTHROPIC_API_KEY=sk-ant-... \
  --from-literal=OPENAI_API_KEY=sk-... \
  --from-literal=CONVEX_DEPLOY_KEY=... \
  --from-literal=DASHBOARD_SECRET=...
```

**Step 4: Deploy**
```bash
helm install agentik-os agentik-os/agentik-os \
  -f values.prod.yaml \
  --namespace agentik-os \
  --create-namespace
```

**Step 5: Verify**
```bash
kubectl get pods -n agentik-os
kubectl get svc -n agentik-os
kubectl get ingress -n agentik-os
```

### High Availability Configuration

**Enable Pod Disruption Budget:**
```yaml
# pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: agentik-runtime-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: agentik-runtime
```

**Multi-Zone Deployment:**
```yaml
# Spread pods across availability zones
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app: agentik-runtime
          topologyKey: topology.kubernetes.io/zone
```

---

## 3. Cloud Managed Deployment

### AWS (ECS Fargate)

**TODO:** Implementation guide will be added after Convex Backend Adapter (Task #91) is completed.

### Google Cloud (Cloud Run)

**TODO:** Implementation guide will be added after deployment testing.

### Azure (Container Apps)

**TODO:** Implementation guide will be added after deployment testing.

---

## 4. Monitoring & Observability

### Prometheus Metrics

**TODO:** Metrics endpoints will be documented after Monitoring & Observability (Task #98) is completed.

Expected metrics:
- `agentik_messages_total` - Total messages processed
- `agentik_cost_total` - Total AI costs
- `agentik_agent_status` - Agent health status
- `agentik_dream_executions` - Dream execution count

### Grafana Dashboards

**TODO:** Dashboard templates will be provided after Task #98 completion.

### Log Aggregation

**TODO:** Log shipping configuration will be documented after implementation.

---

## 5. Security Hardening

### Network Security

**Firewall Rules:**
```bash
# Allow only necessary ports
# Dashboard: 443 (HTTPS)
# WebSocket: 443 (WSS over HTTPS)
# Block direct access to Runtime port 3000
```

**Rate Limiting:**
```nginx
# nginx.conf
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
  limit_req zone=api burst=20 nodelay;
}
```

### Secret Management

**Using Kubernetes Secrets:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: agentik-api-keys
type: Opaque
stringData:
  anthropic-key: "sk-ant-..."
  openai-key: "sk-..."
```

**Using HashiCorp Vault:**
```bash
# TODO: Vault integration guide after implementation
```

---

## 6. Backup & Disaster Recovery

### Convex Backup

**TODO:** Convex backup/restore procedures will be documented after Task #91 completion.

### State Recovery

**TODO:** Recovery procedures will be added after implementation.

---

## 7. Scaling Guidelines

| Metric | Scale Up When | Scale Down When |
|--------|---------------|-----------------|
| **CPU** | >70% for 5 min | <30% for 15 min |
| **Memory** | >80% for 5 min | <40% for 15 min |
| **Messages/sec** | >100 | <20 |
| **Response Time** | >2s p95 | <500ms p95 |

**Horizontal Scaling:**
```bash
# Manual scaling
kubectl scale deployment agentik-runtime --replicas=10

# Auto-scaling (configured in Helm values)
# See autoscaling section above
```

---

## 8. Troubleshooting

### Common Issues

**Issue: Pods CrashLooping**
```bash
# Check logs
kubectl logs -n agentik-os <pod-name>

# Common causes:
# - Missing environment variables
# - Invalid API keys
# - Network connectivity issues
```

**Issue: High Memory Usage**
```bash
# Check resource usage
kubectl top pods -n agentik-os

# Solution: Increase memory limits or scale horizontally
```

**Issue: WebSocket Connection Failures**
```bash
# Verify ingress configuration
kubectl describe ingress -n agentik-os

# Ensure WebSocket upgrade headers are set in Nginx/Ingress
```

---

## 9. Production Checklist

- [ ] HTTPS enabled with valid certificates
- [ ] Secrets stored securely (not in env files)
- [ ] Rate limiting configured
- [ ] Monitoring & alerting set up
- [ ] Backup strategy defined
- [ ] Disaster recovery plan documented
- [ ] Pod disruption budgets configured
- [ ] Resource limits set appropriately
- [ ] Autoscaling enabled
- [ ] Multi-zone deployment (if HA required)
- [ ] Load testing completed
- [ ] Security audit performed

---

## Support

**Enterprise Support:** enterprise@agentik-os.dev
**Community:** https://github.com/agentik-os/agentik-os/discussions
**Documentation:** https://docs.agentik-os.dev

---

**Last Updated:** 2026-02-14
**Version:** 1.0 (Draft - pending implementation completion)
