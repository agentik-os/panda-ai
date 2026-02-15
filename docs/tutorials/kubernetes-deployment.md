# Deploy Agentik OS to Kubernetes

> **20-minute tutorial: Production-ready Kubernetes deployment with autoscaling and monitoring**

Learn by deploying Agentik OS to a Kubernetes cluster with horizontal pod autoscaling, health checks, and observability.

---

## What You'll Build

By the end of this tutorial, you'll have:

- ✅ Agentik OS running on Kubernetes
- ✅ Horizontal Pod Autoscaling (3-20 replicas)
- ✅ Health checks and probes
- ✅ Monitoring with Prometheus + Grafana
- ✅ Ingress with SSL/TLS
- ✅ Production-ready configuration

**Time:** 20 minutes
**Difficulty:** Advanced
**Prerequisites:** Kubernetes cluster (local or cloud), kubectl, Docker

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Ingress                            │
│          (nginx, SSL/TLS termination)                 │
└────────────┬─────────────────────────────────────────┘
             │
    ┌────────▼─────────┐
    │   Load Balancer  │
    │   (Service)      │
    └────────┬─────────┘
             │
   ┌─────────┴──────────┬──────────────┐
   │                    │              │
┌──▼───────────┐ ┌──────▼──────┐ ┌────▼──────────┐
│ Runtime Pod 1│ │Runtime Pod 2│ │Runtime Pod 3  │
│ (agent exec) │ │(agent exec) │ │(agent exec)   │
└──────┬───────┘ └──────┬──────┘ └────┬──────────┘
       │                │              │
       └────────────────┴──────────────┘
                        │
              ┌─────────▼──────────┐
              │  Dashboard Pods    │
              │  (Next.js 16)      │
              └────────────────────┘
                        │
              ┌─────────▼──────────┐
              │  Convex Backend    │
              │  (managed service) │
              └────────────────────┘
```

---

## Step 1: Build Docker Images (3 minutes)

### Dockerfile for Runtime

Create `Dockerfile.runtime`:

```dockerfile
# Multi-stage build for optimized image size
FROM oven/bun:1.0-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY packages/runtime/package.json ./packages/runtime/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/runtime ./packages/runtime
COPY packages/shared ./packages/shared
COPY turbo.json ./

# Build
RUN bun run build --filter=@agentik/runtime

# Production stage
FROM oven/bun:1.0-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/packages/runtime/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S agentik -u 1001
USER agentik

EXPOSE 8080

CMD ["bun", "run", "dist/index.js"]
```

### Dockerfile for Dashboard

Create `Dockerfile.dashboard`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY packages/dashboard/package.json ./packages/dashboard/

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY packages/dashboard ./packages/dashboard
COPY turbo.json ./

RUN pnpm build --filter=@agentik/dashboard

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/packages/dashboard/.next/standalone ./
COPY --from=builder /app/packages/dashboard/.next/static ./packages/dashboard/.next/static
COPY --from=builder /app/packages/dashboard/public ./packages/dashboard/public

EXPOSE 3000

CMD ["node", "packages/dashboard/server.js"]
```

### Build and Push Images

```bash
# Build images
docker build -f Dockerfile.runtime -t agentik/runtime:1.0.0 .
docker build -f Dockerfile.dashboard -t agentik/dashboard:1.0.0 .

# Tag for registry
docker tag agentik/runtime:1.0.0 your-registry.io/agentik/runtime:1.0.0
docker tag agentik/dashboard:1.0.0 your-registry.io/agentik/dashboard:1.0.0

# Push to registry (Docker Hub, ECR, GCR, etc.)
docker push your-registry.io/agentik/runtime:1.0.0
docker push your-registry.io/agentik/dashboard:1.0.0
```

---

## Step 2: Create Kubernetes Manifests (5 minutes)

### Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: agentik
  labels:
    name: agentik
```

### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: agentik-config
  namespace: agentik
data:
  # Runtime config
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  PORT: "8080"

  # Feature flags
  ENABLE_COST_TRACKING: "true"
  ENABLE_TIME_TRAVEL: "true"
  ENABLE_CONSENSUS: "true"

  # Limits
  MAX_CONCURRENT_SESSIONS: "100"
  MAX_TOKENS_PER_REQUEST: "100000"
  REQUEST_TIMEOUT: "300000"
```

### Secrets

```bash
# Create secrets from environment variables
kubectl create secret generic agentik-secrets \
  --from-literal=ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  --from-literal=OPENAI_API_KEY=$OPENAI_API_KEY \
  --from-literal=CONVEX_URL=$CONVEX_URL \
  --from-literal=CONVEX_DEPLOY_KEY=$CONVEX_DEPLOY_KEY \
  --from-literal=CLERK_SECRET_KEY=$CLERK_SECRET_KEY \
  --from-literal=STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY \
  --namespace=agentik
```

### Runtime Deployment

```yaml
# k8s/runtime-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agentik-runtime
  namespace: agentik
  labels:
    app: agentik-runtime
spec:
  replicas: 3  # Initial replica count
  selector:
    matchLabels:
      app: agentik-runtime
  template:
    metadata:
      labels:
        app: agentik-runtime
    spec:
      containers:
        - name: runtime
          image: your-registry.io/agentik/runtime:1.0.0
          imagePullPolicy: Always
          ports:
            - containerPort: 8080
              protocol: TCP
          env:
            # ConfigMap values
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: agentik-config
                  key: NODE_ENV
            - name: LOG_LEVEL
              valueFrom:
                configMapKeyRef:
                  name: agentik-config
                  key: LOG_LEVEL
            # Secrets
            - name: ANTHROPIC_API_KEY
              valueFrom:
                secretKeyRef:
                  name: agentik-secrets
                  key: ANTHROPIC_API_KEY
            - name: CONVEX_URL
              valueFrom:
                secretKeyRef:
                  name: agentik-secrets
                  key: CONVEX_URL
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "2000m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 30
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
```

### Dashboard Deployment

```yaml
# k8s/dashboard-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agentik-dashboard
  namespace: agentik
  labels:
    app: agentik-dashboard
spec:
  replicas: 2
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
          image: your-registry.io/agentik/dashboard:1.0.0
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
          env:
            - name: NEXT_PUBLIC_CONVEX_URL
              valueFrom:
                secretKeyRef:
                  name: agentik-secrets
                  key: CONVEX_URL
            - name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
              valueFrom:
                secretKeyRef:
                  name: agentik-secrets
                  key: CLERK_PUBLISHABLE_KEY
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
```

### Services

```yaml
# k8s/services.yaml
---
apiVersion: v1
kind: Service
metadata:
  name: agentik-runtime
  namespace: agentik
spec:
  selector:
    app: agentik-runtime
  ports:
    - protocol: TCP
      port: 8080
      targetPort: 8080
  type: ClusterIP

---
apiVersion: v1
kind: Service
metadata:
  name: agentik-dashboard
  namespace: agentik
spec:
  selector:
    app: agentik-dashboard
  ports:
    - protocol: TCP
      port: 3000
      targetPort: 3000
  type: ClusterIP
```

---

## Step 3: Configure Autoscaling (2 minutes)

### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: agentik-runtime-hpa
  namespace: agentik
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: agentik-runtime
  minReplicas: 3
  maxReplicas: 20
  metrics:
    # CPU-based scaling
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70

    # Memory-based scaling
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80

    # Custom metrics (requests per second)
    - type: Pods
      pods:
        metric:
          name: requests_per_second
        target:
          type: AverageValue
          averageValue: "100"

  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
        - type: Pods
          value: 2
          periodSeconds: 60
      selectPolicy: Max

    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
      selectPolicy: Min
```

**What this does:**
- Maintains 3-20 pods
- Scales up when CPU >70% or memory >80%
- Scales up quickly (50% or 2 pods per minute)
- Scales down slowly (10% per minute with 5min cooldown)

---

## Step 4: Configure Ingress (3 minutes)

### Install Ingress Controller (if not present)

```bash
# Install nginx ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

### Ingress Manifest

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: agentik-ingress
  namespace: agentik
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"

    # Rate limiting
    nginx.ingress.kubernetes.io/limit-rps: "100"

    # Timeouts for long-running agent requests
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - agentik.yourdomain.com
        - dashboard.agentik.yourdomain.com
      secretName: agentik-tls
  rules:
    # Dashboard
    - host: dashboard.agentik.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: agentik-dashboard
                port:
                  number: 3000

    # Runtime API
    - host: agentik.yourdomain.com
      http:
        paths:
          - path: /v1
            pathType: Prefix
            backend:
              service:
                name: agentik-runtime
                port:
                  number: 8080
```

### Install cert-manager for SSL

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create cluster issuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
```

---

## Step 5: Deploy Everything (2 minutes)

```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/runtime-deployment.yaml
kubectl apply -f k8s/dashboard-deployment.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml

# Wait for deployments to be ready
kubectl wait --for=condition=available --timeout=300s \
  deployment/agentik-runtime deployment/agentik-dashboard \
  -n agentik

# Verify pods are running
kubectl get pods -n agentik

# Check HPA status
kubectl get hpa -n agentik

# Check ingress
kubectl get ingress -n agentik
```

**Expected output:**

```
NAME                                READY   STATUS    RESTARTS   AGE
agentik-runtime-7d9f8b6c5d-abcd1    1/1     Running   0          2m
agentik-runtime-7d9f8b6c5d-abcd2    1/1     Running   0          2m
agentik-runtime-7d9f8b6c5d-abcd3    1/1     Running   0          2m
agentik-dashboard-6c8d7b5f4-xyz1    1/1     Running   0          2m
agentik-dashboard-6c8d7b5f4-xyz2    1/1     Running   0          2m
```

---

## Step 6: Set Up Monitoring (5 minutes)

### Install Prometheus + Grafana

```bash
# Add Prometheus Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus + Grafana stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false
```

### ServiceMonitor for Agentik

```yaml
# k8s/servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: agentik-runtime
  namespace: agentik
  labels:
    app: agentik-runtime
spec:
  selector:
    matchLabels:
      app: agentik-runtime
  endpoints:
    - port: http
      path: /metrics
      interval: 30s
```

### Apply ServiceMonitor

```bash
kubectl apply -f k8s/servicemonitor.yaml
```

### Access Grafana

```bash
# Get Grafana password
kubectl get secret -n monitoring prometheus-grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode

# Port-forward Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Open http://localhost:3000
# Username: admin
# Password: [from above command]
```

### Import Agentik Dashboard

Create `grafana-dashboard.json` with key metrics:

```json
{
  "dashboard": {
    "title": "Agentik OS - Production",
    "panels": [
      {
        "title": "Active Sessions",
        "targets": [
          {
            "expr": "agentik_active_sessions"
          }
        ]
      },
      {
        "title": "Requests per Second",
        "targets": [
          {
            "expr": "rate(agentik_requests_total[1m])"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, agentik_request_duration_seconds_bucket)"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(agentik_errors_total[5m])"
          }
        ]
      },
      {
        "title": "Token Usage (per minute)",
        "targets": [
          {
            "expr": "rate(agentik_tokens_used_total[1m])"
          }
        ]
      },
      {
        "title": "Cost (per hour)",
        "targets": [
          {
            "expr": "rate(agentik_cost_usd_total[1h]) * 3600"
          }
        ]
      }
    ]
  }
}
```

Import via Grafana UI: **Dashboards** → **Import** → Paste JSON

---

## Step 7: Test Production Setup (3 minutes)

### Health Checks

```bash
# Test runtime health
curl https://agentik.yourdomain.com/health

# Test dashboard health
curl https://dashboard.agentik.yourdomain.com/api/health
```

### Load Test

```bash
# Install k6
brew install k6  # or download from k6.io

# Create load test script
cat > load-test.js <<'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function () {
  const res = http.post(
    'https://agentik.yourdomain.com/v1/agents/agent_123/messages',
    JSON.stringify({
      content: 'Hello, what is 2+2?',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${__ENV.AGENTIK_API_KEY}`,
      },
    }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  sleep(1);
}
EOF

# Run load test
k6 run load-test.js
```

### Watch Autoscaling

```bash
# Watch HPA in real-time
kubectl get hpa -n agentik --watch

# Watch pod count
kubectl get pods -n agentik --watch
```

**Expected behavior:**
- Under load, HPA scales up pods (3 → 10 → 20)
- After load decreases, HPA scales down slowly (5min delay)

---

## Production Best Practices

### 1. Multi-Region Deployment

```yaml
# Deploy to multiple regions
regions:
  - us-east-1      # Primary
  - eu-west-1      # Europe
  - ap-southeast-1 # Asia

# Use global load balancer (AWS Route53, Cloudflare)
routing:
  type: latency-based
  healthCheck: /health
```

### 2. Pod Disruption Budget

```yaml
# k8s/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: agentik-runtime-pdb
  namespace: agentik
spec:
  minAvailable: 2  # Always keep at least 2 pods running
  selector:
    matchLabels:
      app: agentik-runtime
```

### 3. Resource Quotas

```yaml
# k8s/resource-quota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: agentik-quota
  namespace: agentik
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 40Gi
    limits.cpu: "40"
    limits.memory: 80Gi
    persistentvolumeclaims: "10"
```

### 4. Network Policies

```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: agentik-runtime-policy
  namespace: agentik
spec:
  podSelector:
    matchLabels:
      app: agentik-runtime
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: agentik-dashboard
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - podSelector: {}
      ports:
        - protocol: TCP
          port: 443  # Convex API
```

### 5. Backup Strategy

```bash
# Backup Convex data
convex export --deployment prod > backup-$(date +%Y%m%d).json

# Schedule daily backups
kubectl create cronjob convex-backup \
  --image=convex/cli \
  --schedule="0 2 * * *" \
  --restart=OnFailure \
  -- convex export --deployment prod
```

---

## Cost Optimization

### Right-Sizing Pods

```yaml
# Use Vertical Pod Autoscaler for recommendations
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: agentik-runtime-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: agentik-runtime
  updatePolicy:
    updateMode: "Off"  # Recommendation mode only
```

### Spot Instances (AWS EKS)

```yaml
# Node group with spot instances
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: agentik-cluster
nodeGroups:
  - name: spot-workers
    instanceTypes:
      - m5.large
      - m5a.large
      - m5n.large
    spot: true
    minSize: 3
    maxSize: 20
    labels:
      workload: agentik-runtime
    taints:
      - key: workload
        value: spot
        effect: NoSchedule

# Runtime deployment tolerates spot taint
spec:
  template:
    spec:
      tolerations:
        - key: workload
          value: spot
          effect: NoSchedule
```

---

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n agentik

# Check logs
kubectl logs <pod-name> -n agentik --previous

# Common issues:
# - ImagePullBackOff → Check image registry credentials
# - CrashLoopBackOff → Check environment variables / secrets
# - Pending → Check resource quotas
```

### HPA Not Scaling

```bash
# Check HPA status
kubectl describe hpa agentik-runtime-hpa -n agentik

# Check metrics server
kubectl top nodes
kubectl top pods -n agentik

# Install metrics server if missing
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### High Latency

```bash
# Check pod resource usage
kubectl top pods -n agentik

# Check pod events
kubectl get events -n agentik --sort-by='.lastTimestamp'

# Scale manually if needed
kubectl scale deployment agentik-runtime --replicas=10 -n agentik
```

---

## Summary

You've learned:

- ✅ How to containerize Agentik OS for production
- ✅ How to deploy to Kubernetes with proper configuration
- ✅ How to set up horizontal autoscaling (3-20 pods)
- ✅ How to configure health checks and probes
- ✅ How to set up monitoring with Prometheus + Grafana
- ✅ How to configure ingress with SSL/TLS
- ✅ Production best practices and troubleshooting

**Next Tutorial:**

1. [Telegram Bot Integration](./telegram-integration.md)

**Resources:**

- 📚 [Production Deployment Guide](../guides/production-deployment.md)
- 🛠️ [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- 💬 Discord: [discord.gg/agentik-os](https://discord.gg/agentik-os)

---

*Last updated: February 14, 2026*
*Agentik OS Tutorial Team*
