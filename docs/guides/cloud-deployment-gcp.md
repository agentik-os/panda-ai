# Google Cloud Platform Deployment Guide

> **Deploy Agentik OS on GCP with Cloud Run, Cloud SQL, and managed services**

Complete guide for deploying Agentik OS on Google Cloud Platform using Cloud Run for serverless containers, Cloud SQL for databases, and Memorystore for caching.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Project Setup](#project-setup)
4. [Container Deployment with Cloud Run](#container-deployment-with-cloud-run)
5. [Database with Cloud SQL](#database-with-cloud-sql)
6. [Caching with Memorystore](#caching-with-memorystore)
7. [Load Balancing & CDN](#load-balancing--cdn)
8. [Secret Management](#secret-management)
9. [Monitoring & Logging](#monitoring--logging)
10. [Auto-Scaling Configuration](#auto-scaling-configuration)
11. [CI/CD with Cloud Build](#cicd-with-cloud-build)
12. [Cost Optimization](#cost-optimization)
13. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Production Architecture

```
                    ┌─────────────────────┐
                    │  Cloud CDN          │
                    │  (Global Edge)      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Cloud Load Balancer│
                    │  (HTTPS/SSL)        │
                    └──────────┬──────────┘
                               │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
  ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
  │ Cloud Run   │     │ Cloud Run   │     │ Cloud Run   │
  │ Instance 1  │     │ Instance 2  │     │ Instance 3  │
  │ (Runtime)   │     │ (Runtime)   │     │ (Runtime)   │
  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
       ┌─────────▼─────────┐    ┌─────────▼─────────┐
       │  Memorystore       │    │  Convex Cloud     │
       │  (Redis)           │    │  (Database)       │
       └────────────────────┘    └───────────────────┘
```

### GCP Services Used

| Service | Purpose | Pricing Model |
|---------|---------|---------------|
| **Cloud Run** | Serverless containers | Pay per request + CPU time |
| **Cloud Load Balancing** | HTTPS routing, SSL termination | $0.025/hour + data processed |
| **Cloud CDN** | Global content delivery | $0.04-0.08/GB egress |
| **Memorystore (Redis)** | Caching + sessions | $0.049/GB-hour |
| **Secret Manager** | API keys, credentials | $0.06 per 10k accesses |
| **Cloud Logging** | Centralized logs | $0.50/GB ingested |
| **Cloud Monitoring** | Metrics, alerts, dashboards | Free tier: 150MB/month |
| **Container Registry** | Docker images | $0.026/GB storage |
| **Cloud Build** | CI/CD pipelines | 120 build-minutes/day free |

---

## Prerequisites

### 1. GCP Account Setup

```bash
# Install gcloud CLI
brew install google-cloud-sdk  # macOS
# or: curl https://sdk.cloud.google.com | bash  # Linux

# Initialize gcloud
gcloud init

# Login
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

### 2. Enable Required APIs

```bash
# Enable all required services
gcloud services enable \
  run.googleapis.com \
  compute.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  redis.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com \
  cloudresourcemanager.googleapis.com \
  servicenetworking.googleapis.com
```

### 3. Install Required Tools

```bash
# Install Docker (if not installed)
brew install docker  # macOS

# Install Terraform (optional, for IaC)
brew install terraform  # macOS

# Verify installations
gcloud --version
docker --version
terraform --version
```

---

## Project Setup

### 1. Create GCP Project

```bash
# Create new project
gcloud projects create agentik-production \
  --name="Agentik OS Production"

# Set as active project
gcloud config set project agentik-production

# Link billing account (required for Cloud Run)
gcloud beta billing projects link agentik-production \
  --billing-account=YOUR_BILLING_ACCOUNT_ID
```

### 2. Set Environment Variables

```bash
export PROJECT_ID=agentik-production
export REGION=us-central1
export SERVICE_NAME=agentik-runtime
export IMAGE_NAME=gcr.io/$PROJECT_ID/$SERVICE_NAME
```

---

## Container Deployment with Cloud Run

### 1. Build and Push Docker Image

**Create optimized Dockerfile:**

```dockerfile
# packages/runtime/Dockerfile
FROM oven/bun:1.2-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
COPY packages/runtime/package.json ./packages/runtime/
COPY packages/shared/package.json ./packages/shared/

RUN bun install --frozen-lockfile

# Build application
COPY packages/runtime ./packages/runtime
COPY packages/shared ./packages/shared

RUN cd packages/runtime && bun run build

# Production image
FROM oven/bun:1.2-alpine

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/packages/runtime/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Cloud Run requires port 8080
ENV PORT=8080
EXPOSE 8080

# Run as non-root
USER bun

CMD ["bun", "run", "dist/index.js"]
```

**Build and push:**

```bash
# Build for Cloud Run (linux/amd64)
docker build -t $IMAGE_NAME:latest \
  --platform linux/amd64 \
  -f packages/runtime/Dockerfile .

# Tag with commit hash
GIT_HASH=$(git rev-parse --short HEAD)
docker tag $IMAGE_NAME:latest $IMAGE_NAME:$GIT_HASH

# Push to Container Registry
docker push $IMAGE_NAME:latest
docker push $IMAGE_NAME:$GIT_HASH
```

### 2. Deploy to Cloud Run

**Initial deployment:**

```bash
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 100 \
  --concurrency 80 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "CONVEX_URL=https://your-deployment.convex.cloud" \
  --set-secrets "ANTHROPIC_API_KEY=anthropic-key:latest" \
  --set-secrets "OPENAI_API_KEY=openai-key:latest"
```

**Configuration options explained:**

| Flag | Value | Description |
|------|-------|-------------|
| `--memory` | `2Gi` | Memory per instance (512Mi-32Gi) |
| `--cpu` | `2` | vCPUs per instance (1, 2, 4, 8) |
| `--min-instances` | `1` | Always-on instances (prevents cold starts) |
| `--max-instances` | `100` | Maximum scale limit |
| `--concurrency` | `80` | Requests per instance (1-1000) |
| `--timeout` | `300` | Request timeout in seconds (max 3600) |

### 3. Update Existing Deployment

```bash
# Deploy new version with traffic split
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME:$GIT_HASH \
  --region $REGION \
  --tag blue \
  --no-traffic  # Don't send traffic yet

# Test the new version
NEW_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(status.traffic[0].url)')

curl $NEW_URL/health

# Gradually shift traffic (canary deployment)
gcloud run services update-traffic $SERVICE_NAME \
  --region $REGION \
  --to-revisions blue=10,LATEST=90

# If successful, shift all traffic
gcloud run services update-traffic $SERVICE_NAME \
  --region $REGION \
  --to-latest
```

### 4. Custom Domain Mapping

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service $SERVICE_NAME \
  --domain api.agentik-os.com \
  --region $REGION

# Get DNS records to configure
gcloud run domain-mappings describe \
  --domain api.agentik-os.com \
  --region $REGION
```

**Add these DNS records:**

```
Type: A
Name: api
Value: 216.239.32.21

Type: AAAA
Name: api
Value: 2001:4860:4802:32::15
```

---

## Database with Cloud SQL

### Option 1: Convex Cloud (Recommended)

```bash
# Already set up in Convex dashboard
# Just configure environment variable
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --set-env-vars "CONVEX_URL=https://your-deployment.convex.cloud"
```

### Option 2: Cloud SQL (PostgreSQL)

**Create instance:**

```bash
# Create PostgreSQL instance
gcloud sql instances create agentik-db \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=$REGION \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=4 \
  --enable-bin-log \
  --retained-backups-count=7

# Set root password
gcloud sql users set-password postgres \
  --instance=agentik-db \
  --password=STRONG_PASSWORD_HERE

# Create database
gcloud sql databases create agentik \
  --instance=agentik-db
```

**Connect from Cloud Run:**

```bash
# Get instance connection name
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe agentik-db \
  --format='value(connectionName)')

# Update Cloud Run service
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --add-cloudsql-instances $INSTANCE_CONNECTION_NAME \
  --set-env-vars "DATABASE_URL=postgresql://postgres:PASSWORD@localhost/agentik?host=/cloudsql/$INSTANCE_CONNECTION_NAME"
```

**Connection in code:**

```typescript
import { Client } from 'pg';

const client = new Client({
  host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'agentik',
});

await client.connect();
```

---

## Caching with Memorystore

### 1. Create Redis Instance

```bash
# Create Memorystore (Redis) instance
gcloud redis instances create agentik-redis \
  --size=1 \
  --region=$REGION \
  --redis-version=redis_7_0 \
  --tier=basic \
  --enable-auth

# Get connection info
gcloud redis instances describe agentik-redis \
  --region=$REGION \
  --format='value(host,port,authString)'
```

### 2. Connect from Cloud Run

**Create VPC Connector:**

```bash
# Create connector for Cloud Run to access Memorystore
gcloud compute networks vpc-access connectors create agentik-connector \
  --network=default \
  --region=$REGION \
  --range=10.8.0.0/28

# Update Cloud Run to use connector
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --vpc-connector=agentik-connector \
  --vpc-egress=private-ranges-only
```

**Configure in application:**

```typescript
import { createClient } from 'redis';

const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  password: process.env.REDIS_AUTH,
});

await redis.connect();

// Usage examples
await redis.set('session:123', JSON.stringify(sessionData), { EX: 3600 });
const cached = await redis.get('session:123');
```

### 3. Caching Patterns

```typescript
// Session caching
export async function getSession(sessionId: string) {
  const cached = await redis.get(`session:${sessionId}`);
  if (cached) return JSON.parse(cached);

  const session = await convex.query(api.sessions.get, { sessionId });
  await redis.setEx(`session:${sessionId}`, 3600, JSON.stringify(session));

  return session;
}

// Rate limiting
export async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const requests = await redis.incr(key);

  if (requests === 1) {
    await redis.expire(key, 60);  // 1 minute window
  }

  return requests <= 100;  // 100 req/min
}

// Response caching
export async function cacheResponse(key: string, data: any, ttl = 300) {
  await redis.setEx(`response:${key}`, ttl, JSON.stringify(data));
}
```

---

## Load Balancing & CDN

### 1. Set Up Cloud Load Balancer

```bash
# Reserve static IP
gcloud compute addresses create agentik-ip \
  --ip-version=IPV4 \
  --global

# Get IP address
IP_ADDRESS=$(gcloud compute addresses describe agentik-ip \
  --format="get(address)" \
  --global)

echo "Your Load Balancer IP: $IP_ADDRESS"

# Create serverless NEG for Cloud Run
gcloud compute network-endpoint-groups create agentik-neg \
  --region=$REGION \
  --network-endpoint-type=serverless \
  --cloud-run-service=$SERVICE_NAME

# Create backend service
gcloud compute backend-services create agentik-backend \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --enable-cdn

# Add NEG to backend
gcloud compute backend-services add-backend agentik-backend \
  --global \
  --network-endpoint-group=agentik-neg \
  --network-endpoint-group-region=$REGION

# Create URL map
gcloud compute url-maps create agentik-urlmap \
  --default-service=agentik-backend

# Create SSL certificate (managed)
gcloud compute ssl-certificates create agentik-cert \
  --domains=api.agentik-os.com \
  --global

# Create HTTPS proxy
gcloud compute target-https-proxies create agentik-https-proxy \
  --url-map=agentik-urlmap \
  --ssl-certificates=agentik-cert

# Create forwarding rule
gcloud compute forwarding-rules create agentik-https-rule \
  --address=agentik-ip \
  --global \
  --target-https-proxy=agentik-https-proxy \
  --ports=443
```

### 2. Enable Cloud CDN

```bash
# CDN is already enabled on backend service
# Configure cache settings
gcloud compute backend-services update agentik-backend \
  --global \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC \
  --default-ttl=3600 \
  --max-ttl=86400 \
  --client-ttl=3600

# Set custom cache keys
gcloud compute backend-services update agentik-backend \
  --global \
  --cache-key-include-protocol \
  --cache-key-include-host \
  --cache-key-include-query-string
```

**Cache headers in code:**

```typescript
// Set cache headers for static content
res.setHeader('Cache-Control', 'public, max-age=3600');

// No cache for dynamic content
res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

// Vary by user
res.setHeader('Vary', 'Cookie, Authorization');
```

---

## Secret Management

### 1. Create Secrets

```bash
# Create secrets from files
echo -n "sk-ant-..." | gcloud secrets create anthropic-key \
  --data-file=- \
  --replication-policy=automatic

echo -n "sk-..." | gcloud secrets create openai-key \
  --data-file=- \
  --replication-policy=automatic

# Create from environment variables
printf "%s" "$STRIPE_SECRET_KEY" | gcloud secrets create stripe-key \
  --data-file=-
```

### 2. Grant Access to Cloud Run

```bash
# Get Cloud Run service account
SERVICE_ACCOUNT=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(spec.template.spec.serviceAccountName)')

# Grant secret access
gcloud secrets add-iam-policy-binding anthropic-key \
  --member=serviceAccount:$SERVICE_ACCOUNT \
  --role=roles/secretmanager.secretAccessor

gcloud secrets add-iam-policy-binding openai-key \
  --member=serviceAccount:$SERVICE_ACCOUNT \
  --role=roles/secretmanager.secretAccessor
```

### 3. Access Secrets in Code

```typescript
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

async function getSecret(name: string): Promise<string> {
  const [version] = await client.accessSecretVersion({
    name: `projects/${process.env.GCP_PROJECT}/secrets/${name}/versions/latest`,
  });

  return version.payload?.data?.toString() || '';
}

// Usage
const anthropicKey = await getSecret('anthropic-key');
const openaiKey = await getSecret('openai-key');
```

**Or use environment variable (simpler):**

Already configured in Cloud Run deployment command:
```bash
--set-secrets "ANTHROPIC_API_KEY=anthropic-key:latest"
```

---

## Monitoring & Logging

### 1. Cloud Logging

**View logs:**

```bash
# Stream logs in real-time
gcloud run services logs tail $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID

# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
  --limit=50 \
  --format=json

# Filter by severity
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=20
```

**Structured logging in code:**

```typescript
import { Logging } from '@google-cloud/logging';

const logging = new Logging({ projectId: process.env.GCP_PROJECT });
const log = logging.log('agentik-runtime');

// Write structured log
const metadata = {
  resource: { type: 'cloud_run_revision' },
  severity: 'INFO',
  labels: {
    userId: user.id,
    requestId: req.id,
  },
};

const entry = log.entry(metadata, {
  message: 'Agent created',
  agentId: agent.id,
  model: agent.model,
  timestamp: Date.now(),
});

await log.write(entry);
```

### 2. Cloud Monitoring

**Create custom metrics:**

```typescript
import { MetricServiceClient } from '@google-cloud/monitoring';

const client = new MetricServiceClient();

async function recordMetric(name: string, value: number) {
  const projectName = client.projectPath(process.env.GCP_PROJECT!);

  const dataPoint = {
    interval: {
      endTime: { seconds: Date.now() / 1000 },
    },
    value: { doubleValue: value },
  };

  const timeSeries = {
    metric: {
      type: `custom.googleapis.com/agentik/${name}`,
      labels: {
        environment: 'production',
      },
    },
    resource: {
      type: 'cloud_run_revision',
      labels: {
        service_name: process.env.K_SERVICE || '',
        revision_name: process.env.K_REVISION || '',
      },
    },
    points: [dataPoint],
  };

  await client.createTimeSeries({
    name: projectName,
    timeSeries: [timeSeries],
  });
}

// Usage
await recordMetric('agent_created', 1);
await recordMetric('message_processed', 1);
await recordMetric('tokens_used', 1847);
```

**Create alerts:**

```bash
# Create alert policy for high error rate
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=300s \
  --condition-expression='
    resource.type = "cloud_run_revision" AND
    metric.type = "run.googleapis.com/request_count" AND
    metric.labels.response_code_class = "5xx"
  '
```

### 3. Error Reporting

```typescript
import { ErrorReporting } from '@google-cloud/error-reporting';

const errors = new ErrorReporting({
  projectId: process.env.GCP_PROJECT,
  reportMode: 'production',
});

// Report errors
try {
  // Your code
} catch (error) {
  errors.report(error);
  throw error;
}
```

---

## Auto-Scaling Configuration

### 1. Concurrency-Based Scaling

```bash
# Update service with scaling configuration
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --min-instances=1 \
  --max-instances=100 \
  --concurrency=80 \
  --cpu-throttling \
  --cpu=2 \
  --memory=2Gi
```

**Scaling behavior:**

| Concurrent Requests | Instances | Notes |
|-------------------|-----------|-------|
| 0-80 | 1 | Minimum instance |
| 81-160 | 2 | Scale up |
| 161-240 | 3 | Continue scaling |
| ... | ... | Up to max instances |

### 2. Request-Based Scaling

Cloud Run automatically scales based on:
- Incoming request volume
- CPU utilization
- Memory usage
- Request processing time

**Best practices:**

```bash
# Low-traffic API (cost-optimized)
--min-instances=0 \
--max-instances=10 \
--concurrency=100

# Medium-traffic API (balanced)
--min-instances=1 \
--max-instances=50 \
--concurrency=80

# High-traffic API (performance-optimized)
--min-instances=3 \
--max-instances=100 \
--concurrency=50
```

### 3. CPU Allocation

```bash
# CPU allocated only during request processing (default)
--cpu-throttling  # Cost-effective for IO-bound apps

# CPU always allocated (better for background tasks)
--no-cpu-throttling  # Use for compute-intensive apps
```

---

## CI/CD with Cloud Build

### 1. Create cloudbuild.yaml

```yaml
# cloudbuild.yaml
steps:
  # Install dependencies
  - name: 'oven/bun:1.2'
    entrypoint: 'bun'
    args: ['install', '--frozen-lockfile']

  # Run tests
  - name: 'oven/bun:1.2'
    entrypoint: 'bun'
    args: ['test']
    env:
      - 'NODE_ENV=test'

  # Type check
  - name: 'oven/bun:1.2'
    entrypoint: 'bun'
    args: ['run', 'type-check']

  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/agentik-runtime:$COMMIT_SHA'
      - '-t'
      - 'gcr.io/$PROJECT_ID/agentik-runtime:latest'
      - '-f'
      - 'packages/runtime/Dockerfile'
      - '.'

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '--all-tags'
      - 'gcr.io/$PROJECT_ID/agentik-runtime'

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'agentik-runtime'
      - '--image=gcr.io/$PROJECT_ID/agentik-runtime:$COMMIT_SHA'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--memory=2Gi'
      - '--cpu=2'
      - '--min-instances=1'
      - '--max-instances=100'

images:
  - 'gcr.io/$PROJECT_ID/agentik-runtime:$COMMIT_SHA'
  - 'gcr.io/$PROJECT_ID/agentik-runtime:latest'

timeout: 1800s  # 30 minutes

options:
  machineType: 'E2_HIGHCPU_8'
  logging: CLOUD_LOGGING_ONLY
```

### 2. Set Up GitHub Trigger

```bash
# Connect GitHub repo
gcloud beta builds triggers create github \
  --repo-name=agentik-os \
  --repo-owner=your-org \
  --branch-pattern='^main$' \
  --build-config=cloudbuild.yaml \
  --included-files='packages/runtime/**,packages/shared/**'
```

### 3. Manual Build

```bash
# Submit build manually
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=COMMIT_SHA=$(git rev-parse --short HEAD)
```

---

## Cost Optimization

### 1. Right-Size Instances

**Monitor and optimize:**

```bash
# Get metrics
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/container/cpu/utilizations"' \
  --project=$PROJECT_ID
```

**Sizing guide:**

| Traffic | CPU | Memory | Min Instances | Max Instances | Monthly Cost |
|---------|-----|--------|---------------|---------------|--------------|
| Low (<100 req/day) | 1 | 512Mi | 0 | 10 | $0-5 |
| Medium (<10k req/day) | 1 | 1Gi | 1 | 25 | $20-40 |
| High (<100k req/day) | 2 | 2Gi | 1 | 50 | $80-150 |
| Very High (>100k req/day) | 2 | 2Gi | 3 | 100 | $200-400 |

### 2. Minimize Cold Starts

```bash
# Keep 1 instance always warm (costs ~$30/month)
--min-instances=1

# Or use scheduled warming
gcloud scheduler jobs create http warm-up-job \
  --schedule="*/5 * * * *" \
  --uri="https://api.agentik-os.com/health" \
  --http-method=GET
```

### 3. Optimize Container Size

```dockerfile
# Multi-stage builds (from earlier)
FROM oven/bun:1.2-alpine AS builder
# ... build steps ...

FROM oven/bun:1.2-alpine  # Minimal runtime image
# ... copy artifacts ...
```

**Image size comparison:**

| Base Image | Size | Cold Start |
|-----------|------|------------|
| `node:20` | 1.1GB | ~8s |
| `node:20-slim` | 250MB | ~4s |
| `node:20-alpine` | 150MB | ~2s |
| `oven/bun:1.2-alpine` | 90MB | ~1s |

### 4. Use Cloud CDN

Already enabled in load balancer setup - saves on egress costs:

| Without CDN | With CDN | Savings |
|------------|----------|---------|
| $0.12/GB (US) | $0.04/GB (cache hit) | 67% |
| $0.19/GB (APAC) | $0.08/GB (cache hit) | 58% |

---

## Troubleshooting

### Common Issues

#### 1. Cold Start Latency

**Symptoms:**
- First request takes > 5 seconds
- Intermittent slow responses

**Solutions:**

```bash
# Keep instances warm
--min-instances=1

# Reduce container size (see Optimize Container Size)

# Pre-warm critical resources
async function warmup() {
  await Promise.all([
    redis.ping(),
    convex.query(api.internal.health),
  ]);
}
```

#### 2. Out of Memory Errors

**Symptoms:**
- Container crashes with exit code 137
- Logs show "JavaScript heap out of memory"

**Solutions:**

```bash
# Increase memory
--memory=4Gi  # Was: 2Gi

# Or optimize code
const cache = new LRUCache({ max: 500 });
```

#### 3. VPC Connector Issues

**Symptoms:**
- Cannot connect to Memorystore
- "Connection refused" errors

**Solutions:**

```bash
# Verify connector status
gcloud compute networks vpc-access connectors describe agentik-connector \
  --region=$REGION

# Check connector range doesn't conflict
gcloud compute networks subnets list --network=default

# Recreate if needed
gcloud compute networks vpc-access connectors delete agentik-connector --region=$REGION
```

#### 4. High Costs

**Symptoms:**
- Monthly bill higher than expected

**Solutions:**

```bash
# Analyze costs by SKU
gcloud billing accounts list
gcloud billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID

# View cost breakdown
gcloud alpha billing accounts get-iam-policy BILLING_ACCOUNT_ID
```

**Common cost drivers:**

- Cloud Run CPU time (always-allocated vs. throttled)
- Memorystore instance running 24/7
- Cloud CDN egress (optimize cache hit rate)
- Cloud Logging (reduce log volume)

---

## Next Steps

- [AWS Deployment](./cloud-deployment-aws.md) - Deploy on AWS with ECS
- [Azure Deployment](./cloud-deployment-azure.md) - Deploy on Azure Container Apps
- [Multi-Cloud Strategy](./multi-cloud-deployment.md) - Deploy across clouds
- [Monitoring Best Practices](./monitoring-best-practices.md) - Advanced observability

---

**Questions?** Join our [Discord](https://discord.gg/agentik-os) or open an issue on [GitHub](https://github.com/agentik-os/agentik-os).

---

*Last updated: February 14, 2026 • GCP Deployment Guide v1.0*
