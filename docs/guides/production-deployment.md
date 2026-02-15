# Production Deployment Guide

> **Deploy Agentik OS to production with confidence**

Learn how to deploy Agentik OS using Docker, Kubernetes, Vercel, and other platforms with production-grade configurations, monitoring, and scaling.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Configuration](#environment-configuration)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Vercel Deployment (Dashboard)](#vercel-deployment-dashboard)
7. [Railway Deployment](#railway-deployment)
8. [AWS Deployment](#aws-deployment)
9. [Monitoring & Observability](#monitoring--observability)
10. [Scaling Strategies](#scaling-strategies)
11. [Backup & Disaster Recovery](#backup--disaster-recovery)
12. [CI/CD Pipeline](#cicd-pipeline)
13. [Troubleshooting](#troubleshooting)

---

## Introduction

### Deployment Architecture

Agentik OS consists of multiple services:

```
┌─────────────────────────────────────────────────┐
│  Frontend (Dashboard)                           │
│  • Next.js 16 App Router                       │
│  • Deploy: Vercel, Netlify, or self-hosted    │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Backend (Convex)                               │
│  • Real-time database + functions              │
│  • Deploy: Convex Cloud (managed)              │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Runtime (Agent Engine)                         │
│  • Bun + TypeScript                            │
│  • Deploy: Docker, Kubernetes, Railway         │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  CLI                                            │
│  • Install globally: npm i -g @agentik/cli    │
└─────────────────────────────────────────────────┘
```

### Deployment Options

| Option | Best For | Pros | Cons |
|--------|----------|------|------|
| **Docker Compose** | Small teams, dev/staging | Simple, fast setup | Limited scaling |
| **Kubernetes** | Large teams, enterprise | Auto-scaling, HA | Complex setup |
| **Vercel + Convex** | Startups, SaaS | Fully managed, global CDN | Vendor lock-in |
| **Railway** | Quick deploys, hobbyists | Git push to deploy | Limited customization |
| **AWS ECS** | Enterprise, compliance | Full control, AWS ecosystem | Requires AWS expertise |

---

## Pre-Deployment Checklist

### 1. Environment Preparation

- [ ] **Domain name** registered and DNS configured
- [ ] **SSL certificate** obtained (Let's Encrypt or purchased)
- [ ] **API keys** ready (Anthropic, OpenAI, Gemini)
- [ ] **Database** credentials (Convex deployment URL)
- [ ] **Auth provider** configured (Clerk production keys)
- [ ] **Payment provider** configured (Stripe production keys)

### 2. Code Preparation

- [ ] **All tests passing** (`pnpm test`)
- [ ] **TypeScript compiles** with 0 errors (`pnpm type-check`)
- [ ] **No console errors** in browser
- [ ] **Environment variables** documented
- [ ] **Security audit** completed
- [ ] **Performance testing** done
- [ ] **Responsive design** verified (mobile/tablet/desktop)

### 3. Infrastructure Preparation

- [ ] **Production database** created (Convex prod deployment)
- [ ] **Redis instance** for caching (Upstash recommended)
- [ ] **CDN** configured (Cloudflare or Vercel Edge)
- [ ] **Monitoring** setup (Datadog, Sentry, or LogRocket)
- [ ] **Backup strategy** defined
- [ ] **Disaster recovery plan** documented

---

## Environment Configuration

### Production Environment Variables

```bash
# .env.production

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://agentik-os.com
NEXT_PUBLIC_API_URL=https://api.agentik-os.com

# Convex
CONVEX_DEPLOYMENT=prod:happy-animal-123
NEXT_PUBLIC_CONVEX_URL=https://happy-animal-123.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# AI Providers
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
OPENAI_API_KEY=sk-xxxxx
GOOGLE_AI_API_KEY=AIzaSyxxxxx

# Redis (Upstash)
UPSTASH_REDIS_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_TOKEN=xxxxx

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
DATADOG_API_KEY=xxxxx
NEXT_PUBLIC_LOGROCKET_APP_ID=xxxxx/agentik-os

# Security
ENCRYPTION_KEY=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)

# Email (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@agentik-os.com
```

### Securing Secrets

**Never commit .env files to git!**

```bash
# .gitignore
.env
.env.local
.env.production
.env.*.local
```

**Use secret management:**

```bash
# Vercel
vercel env add ANTHROPIC_API_KEY production

# Kubernetes
kubectl create secret generic agentik-secrets \
  --from-literal=ANTHROPIC_API_KEY=sk-ant-xxxxx \
  --from-literal=OPENAI_API_KEY=sk-xxxxx

# Docker Compose
docker secret create anthropic_api_key ./anthropic_key.txt
```

---

## Docker Deployment

### Dockerfile (Multi-Stage Build)

```dockerfile
# packages/dashboard/Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/dashboard/package.json ./packages/dashboard/
RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build shared package first
RUN pnpm --filter @agentik/shared build

# Build dashboard
RUN pnpm --filter @agentik/dashboard build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/packages/dashboard/.next/standalone ./
COPY --from=builder /app/packages/dashboard/.next/static ./packages/dashboard/.next/static
COPY --from=builder /app/packages/dashboard/public ./packages/dashboard/public

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "packages/dashboard/server.js"]
```

### Docker Compose (Full Stack)

```yaml
# docker-compose.prod.yml
version: '3.9'

services:
  dashboard:
    build:
      context: .
      dockerfile: packages/dashboard/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_CONVEX_URL=${CONVEX_URL}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
    secrets:
      - anthropic_api_key
      - openai_api_key
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  runtime:
    build:
      context: .
      dockerfile: packages/runtime/Dockerfile
    environment:
      - NODE_ENV=production
      - CONVEX_URL=${CONVEX_URL}
    secrets:
      - anthropic_api_key
      - openai_api_key
    restart: unless-stopped
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 4G

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - dashboard
    restart: unless-stopped

secrets:
  anthropic_api_key:
    file: ./secrets/anthropic_api_key.txt
  openai_api_key:
    file: ./secrets/openai_api_key.txt
```

### Nginx Configuration

```nginx
# nginx.conf
upstream dashboard {
  least_conn;
  server dashboard:3000 max_fails=3 fail_timeout=30s;
}

server {
  listen 80;
  server_name agentik-os.com www.agentik-os.com;

  # Redirect to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name agentik-os.com www.agentik-os.com;

  # SSL
  ssl_certificate /etc/nginx/ssl/fullchain.pem;
  ssl_certificate_key /etc/nginx/ssl/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
  ssl_prefer_server_ciphers on;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;

  # Gzip
  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

  # Proxy to Next.js
  location / {
    proxy_pass http://dashboard;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }

  # Static files (Next.js _next/static)
  location /_next/static {
    proxy_pass http://dashboard;
    proxy_cache_valid 200 365d;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }
}
```

### Deploy with Docker

```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f dashboard

# Stop services
docker compose -f docker-compose.prod.yml down
```

---

## Kubernetes Deployment

### Deployment Manifests

```yaml
# k8s/dashboard-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agentik-dashboard
  namespace: agentik-os
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agentik-dashboard
  template:
    metadata:
      labels:
        app: agentik-dashboard
    spec:
      containers:
      - name: dashboard
        image: agentik-os/dashboard:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXT_PUBLIC_CONVEX_URL
          valueFrom:
            secretKeyRef:
              name: agentik-secrets
              key: convex-url
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: agentik-secrets
              key: anthropic-api-key
        resources:
          requests:
            cpu: "500m"
            memory: "1Gi"
          limits:
            cpu: "2000m"
            memory: "4Gi"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: agentik-dashboard-service
  namespace: agentik-os
spec:
  selector:
    app: agentik-dashboard
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: agentik-dashboard-hpa
  namespace: agentik-os
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: agentik-dashboard
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Ingress (NGINX)

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: agentik-ingress
  namespace: agentik-os
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - agentik-os.com
    - www.agentik-os.com
    secretName: agentik-tls
  rules:
  - host: agentik-os.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: agentik-dashboard-service
            port:
              number: 80
```

### Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: agentik-secrets
  namespace: agentik-os
type: Opaque
data:
  # Base64 encoded values
  anthropic-api-key: c2stYW50LXh4eHh4  # echo -n "sk-ant-xxxxx" | base64
  openai-api-key: c2steHh4eHg=
  convex-url: aHR0cHM6Ly94eHh4eC5jb252ZXguY2xvdWQ=
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace agentik-os

# Create secrets
kubectl apply -f k8s/secrets.yaml

# Deploy application
kubectl apply -f k8s/dashboard-deployment.yaml
kubectl apply -f k8s/runtime-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n agentik-os
kubectl get svc -n agentik-os
kubectl get ingress -n agentik-os

# View logs
kubectl logs -f deployment/agentik-dashboard -n agentik-os

# Scale manually
kubectl scale deployment agentik-dashboard --replicas=5 -n agentik-os
```

---

## Vercel Deployment (Dashboard)

### Configuration

```json
// vercel.json
{
  "buildCommand": "pnpm turbo build --filter=@agentik/dashboard",
  "outputDirectory": "packages/dashboard/.next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1", "lhr1"], // US East, US West, London
  "env": {
    "NEXT_PUBLIC_CONVEX_URL": "@convex-url-production",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "@clerk-publishable-key-production"
  },
  "build": {
    "env": {
      "CLERK_SECRET_KEY": "@clerk-secret-key-production",
      "ANTHROPIC_API_KEY": "@anthropic-api-key-production"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

### Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project (first time)
vercel link

# Add secrets
vercel env add ANTHROPIC_API_KEY production
vercel env add CLERK_SECRET_KEY production
vercel env add CONVEX_DEPLOYMENT production

# Deploy to production
vercel --prod

# Or push to main branch (auto-deploy)
git push origin main
```

### Convex Production Deployment

```bash
# Deploy Convex functions to production
pnpm --filter @agentik/backend convex deploy --prod

# Copy deployment URL
# Example: https://happy-animal-123.convex.cloud

# Update Vercel environment variable
vercel env add NEXT_PUBLIC_CONVEX_URL production
# Value: https://happy-animal-123.convex.cloud
```

---

## Railway Deployment

### Railway Configuration

```toml
# railway.toml
[build]
builder = "nixpacks"
buildCommand = "pnpm install && pnpm turbo build"

[deploy]
startCommand = "pnpm --filter @agentik/dashboard start"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[[services]]
name = "dashboard"
port = 3000

[[services]]
name = "runtime"
```

### Deploy

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Link to project
railway link

# Add environment variables
railway variables set ANTHROPIC_API_KEY=sk-ant-xxxxx
railway variables set CONVEX_URL=https://xxxxx.convex.cloud

# Deploy
railway up

# Or connect GitHub (auto-deploy on push)
# Dashboard → GitHub → Connect repository
```

---

## AWS Deployment

### ECS (Elastic Container Service)

**1. Create ECR repository:**

```bash
# Create repository
aws ecr create-repository --repository-name agentik-dashboard

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t agentik-dashboard .
docker tag agentik-dashboard:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/agentik-dashboard:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/agentik-dashboard:latest
```

**2. Create ECS task definition:**

```json
{
  "family": "agentik-dashboard",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "dashboard",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/agentik-dashboard:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "ANTHROPIC_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:agentik/anthropic-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/agentik-dashboard",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**3. Create ECS service:**

```bash
aws ecs create-service \
  --cluster agentik-cluster \
  --service-name agentik-dashboard \
  --task-definition agentik-dashboard:1 \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/agentik-dashboard-tg,containerName=dashboard,containerPort=3000"
```

---

## Monitoring & Observability

### Sentry (Error Tracking)

```bash
# Install
pnpm add @sentry/nextjs

# Configure
# sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Don't send errors in development
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    return event;
  },
});
```

### Datadog (APM & Logs)

```typescript
// packages/dashboard/instrumentation.ts
import tracer from "dd-trace";

tracer.init({
  service: "agentik-dashboard",
  env: process.env.NODE_ENV,
  version: process.env.VERCEL_GIT_COMMIT_SHA,
  logInjection: true,
});

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("dd-trace/init");
  }
}
```

### Prometheus (Metrics)

```typescript
// packages/runtime/src/metrics.ts
import { register, Counter, Histogram } from "prom-client";

// Metrics
export const messagesProcessed = new Counter({
  name: "agentik_messages_processed_total",
  help: "Total number of messages processed",
  labelNames: ["model", "status"],
});

export const responseTime = new Histogram({
  name: "agentik_response_time_seconds",
  help: "Response time in seconds",
  labelNames: ["model"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

// Endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
});
```

### Health Checks

```typescript
// packages/dashboard/app/api/health/route.ts
export async function GET() {
  const checks = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      convex: await checkConvex(),
      clerk: await checkClerk(),
      anthropic: await checkAnthropic(),
    },
  };

  const allHealthy = Object.values(checks.checks).every((c) => c.healthy);

  return Response.json(checks, {
    status: allHealthy ? 200 : 503,
  });
}

async function checkConvex() {
  try {
    await convex.query("users:count");
    return { healthy: true, latency: 50 };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}
```

---

## Scaling Strategies

### Horizontal Scaling

**Kubernetes Auto-Scaling (HPA):**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: agentik-dashboard-hpa
spec:
  scaleTargetRef:
    kind: Deployment
    name: agentik-dashboard
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
```

### Vertical Scaling

**Adjust resource limits:**

```yaml
resources:
  requests:
    cpu: "1000m"    # 1 CPU
    memory: "2Gi"   # 2 GB RAM
  limits:
    cpu: "4000m"    # 4 CPUs
    memory: "8Gi"   # 8 GB RAM
```

### Database Scaling

**Convex scales automatically**, but for high-traffic:

1. **Read replicas** - Contact Convex support
2. **Caching** - Add Redis for frequently accessed data
3. **Sharding** - Partition by tenant ID

---

## Backup & Disaster Recovery

### Convex Backups

```bash
# Snapshot current state
pnpm --filter @agentik/backend convex export --path ./backups/snapshot-$(date +%Y%m%d).json

# Restore from snapshot
pnpm --filter @agentik/backend convex import --path ./backups/snapshot-20260214.json
```

### Automated Backups (Cron)

```bash
# crontab -e
0 2 * * * /home/agentik/scripts/backup-convex.sh
```

```bash
#!/bin/bash
# backup-convex.sh
DATE=$(date +%Y%m%d)
BACKUP_DIR=/mnt/backups

cd /home/agentik/agentik-os
pnpm --filter @agentik/backend convex export --path $BACKUP_DIR/snapshot-$DATE.json

# Upload to S3
aws s3 cp $BACKUP_DIR/snapshot-$DATE.json s3://agentik-backups/convex/

# Delete local backups older than 7 days
find $BACKUP_DIR -name "snapshot-*.json" -mtime +7 -delete
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective): 1 hour**
**RPO (Recovery Point Objective): 24 hours**

**Scenario 1: Convex Outage**
1. Restore from latest backup (automated hourly)
2. Deploy to secondary Convex deployment
3. Update DNS to point to backup

**Scenario 2: Complete Infrastructure Failure**
1. Provision new Kubernetes cluster (Terraform)
2. Restore Convex from S3 backup
3. Deploy application from CI/CD
4. Update DNS

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo test
      - run: pnpm turbo type-check

  deploy-dashboard:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"

  deploy-runtime:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t agentik-runtime -f packages/runtime/Dockerfile .

      - name: Push to ECR
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
          docker tag agentik-runtime:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/agentik-runtime:$GITHUB_SHA
          docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/agentik-runtime:$GITHUB_SHA

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster agentik-cluster --service agentik-runtime --force-new-deployment
```

---

## Troubleshooting

### Problem: Deployment Fails with "Module not found"

**Cause:** Missing dependencies or incorrect build order

**Solution:**

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install --frozen-lockfile

# Build in correct order
pnpm turbo build --filter=@agentik/shared
pnpm turbo build --filter=@agentik/dashboard
```

---

### Problem: Health Check Failing

**Cause:** App not responding on expected port

**Solution:**

```bash
# Check if app is listening
docker exec -it <container_id> netstat -tlnp

# Check logs
docker logs <container_id>

# Verify PORT env var
echo $PORT
```

---

### Problem: High Memory Usage

**Cause:** Next.js development mode or memory leaks

**Solution:**

```bash
# Ensure NODE_ENV=production
export NODE_ENV=production

# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm start

# Profile memory
node --inspect server.js
```

---

## Summary

Production deployment checklist:

- ✅ **Environment variables** configured
- ✅ **SSL certificate** installed
- ✅ **Monitoring** setup (Sentry, Datadog)
- ✅ **Backups** automated
- ✅ **CI/CD pipeline** working
- ✅ **Health checks** passing
- ✅ **Auto-scaling** configured
- ✅ **Disaster recovery** plan documented

**Recommended Stack for Most Teams:**

- **Dashboard**: Vercel (managed Next.js)
- **Backend**: Convex (managed real-time DB)
- **Runtime**: Railway or AWS ECS (containerized agent engine)
- **Monitoring**: Sentry + Datadog
- **Backups**: Automated to S3
- **CI/CD**: GitHub Actions

**Next Steps:**

1. Follow [Pre-Deployment Checklist](#pre-deployment-checklist)
2. Choose deployment option (Docker, K8s, Vercel, etc.)
3. Set up monitoring and alerting
4. Test disaster recovery plan
5. Document runbook for common issues

---

*Last updated: February 14, 2026*
*Agentik OS Infrastructure Team*
