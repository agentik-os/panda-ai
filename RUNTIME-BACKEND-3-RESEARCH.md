# Runtime-Backend #3 - Multi-Tenancy & Deployment Research

**Agent:** runtime-backend-3
**Task:** #97 - Multi-Tenancy & Deployment (Steps 120-123)
**Blocked By:** #96 (Auth & Security)
**Status:** RESEARCH PHASE
**Date:** 2026-02-14

---

## Mission

Implement enterprise-grade multi-tenancy and production deployment infrastructure for Agentik OS.

**Total Scope:** 80 hours across 4 steps
**Target:** Zero data leakage, one-command deployment, production-ready

---

## Step Breakdown

### Step 120: Multi-Tenant Support (24h)
**Files:**
- `packages/runtime/src/tenants/manager.ts` (NEW)
- `packages/runtime/src/tenants/isolator.ts` (NEW)
- `backends/sqlite/migrations/009_tenants.sql` (NEW)

**Dependencies:** step-118 (SSO - part of Task #96)

**Deliverables:**
1. Workspace/organization model
2. Tenant-scoped Convex queries
3. Data isolation enforcement
4. Cross-tenant access prevention
5. Migration for tenant schema

### Step 121: Air-Gapped Deployment (20h)
**Files:**
- `installer/air-gapped-bundle.sh` (NEW)
- `packages/runtime/src/updates/offline-updater.ts` (NEW)

**Dependencies:** step-100 (already complete)

**Deliverables:**
1. Offline installation bundle
2. Bundle verification (checksums)
3. Offline update mechanism
4. No internet requirement after install

### Step 122: Docker Compose for Production (16h)
**Files:**
- `docker/docker-compose.prod.yml` (NEW)
- `docker/Dockerfile.runtime` (NEW)
- `docker/Dockerfile.dashboard` (NEW)
- `docker/.env.example` (NEW)

**Dependencies:** step-100 (already complete)

**Deliverables:**
1. Multi-stage Docker builds
2. Production-ready compose file
3. Health checks
4. Volume management
5. Network isolation
6. Secrets management

### Step 123: Kubernetes Helm Chart (20h)
**Files:**
- `deploy/kubernetes/Chart.yaml` (NEW)
- `deploy/kubernetes/values.yaml` (NEW)
- `deploy/kubernetes/templates/deployment.yaml` (NEW)
- `deploy/kubernetes/templates/service.yaml` (NEW)
- `deploy/kubernetes/templates/ingress.yaml` (NEW)

**Dependencies:** step-122 (Docker images)

**Deliverables:**
1. Helm chart v3
2. StatefulSets for runtime
3. Deployments for dashboard
4. Services & Ingress
5. ConfigMaps & Secrets
6. Resource limits & autoscaling

---

## Architecture Research

### 1. Multi-Tenancy Patterns

#### Option A: Row-Level Security (RLS)
**Pros:**
- Single database
- Simpler architecture
- Better for analytics across tenants

**Cons:**
- Risk of query bugs leaking data
- Complex indexes
- Performance at scale

#### Option B: Database-Per-Tenant
**Pros:**
- Perfect isolation
- Easy backups per tenant
- Independent scaling

**Cons:**
- Complex connection pooling
- Migration nightmare
- Expensive at scale

#### Option C: Schema-Per-Tenant (RECOMMENDED)
**Pros:**
- Good isolation
- Reasonable cost
- Manageable migrations
- Fits Convex multi-deployment model

**Cons:**
- More complex than RLS
- Per-schema overhead

**Decision:** Use **Convex deployments** as tenant boundaries:
- Each tenant = separate Convex deployment
- Perfect isolation via Convex API
- Tenant ID → Convex deployment URL mapping
- Zero cross-tenant risk

### 2. Convex Multi-Tenancy Strategy

```typescript
// Tenant Manager Architecture
interface Tenant {
  id: string;
  name: string;
  convexDeploymentUrl: string;
  createdAt: number;
  owner: string;
  subscription: 'free' | 'pro' | 'enterprise';
}

interface TenantManager {
  createTenant(name: string, owner: string): Promise<Tenant>;
  getTenantForUser(userId: string): Promise<Tenant>;
  getConvexClient(tenantId: string): ConvexClient;
}
```

**How it works:**
1. Master database tracks tenants (SQLite or Convex)
2. Each tenant gets dedicated Convex deployment
3. Runtime routes requests to correct deployment
4. Zero shared data structures

**Isolation guarantees:**
- ✅ Data: Separate Convex deployments
- ✅ Compute: Separate Convex functions
- ✅ Costs: Track per deployment
- ✅ Backups: Independent snapshots

### 3. Docker Architecture

#### Multi-Stage Build Strategy

```dockerfile
# Stage 1: Dependencies
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Stage 2: Builder
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Stage 3: Runtime
FROM oven/bun:1-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
USER bun
EXPOSE 3000
CMD ["bun", "dist/index.js"]
```

**Benefits:**
- Small final image (~50MB vs 500MB+)
- No dev dependencies in production
- Security via distroless/alpine
- Fast builds with layer caching

#### Service Architecture

```yaml
services:
  runtime:
    build: ./docker/Dockerfile.runtime
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - CONVEX_URL=${CONVEX_URL}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  dashboard:
    build: ./docker/Dockerfile.dashboard
    ports:
      - "3001:3001"
    depends_on:
      - runtime
    environment:
      - NEXT_PUBLIC_RUNTIME_URL=http://runtime:3000
    restart: unless-stopped

  # Observability stack
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./docker/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3002:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
```

### 4. Kubernetes Architecture

#### StatefulSet vs Deployment

**Runtime → StatefulSet:**
- Persistent storage for local state
- Ordered deployment
- Stable network IDs

**Dashboard → Deployment:**
- Stateless frontend
- Horizontal scaling
- Rolling updates

#### Resource Planning

```yaml
# Development
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"

# Production
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "4Gi"
    cpu: "2000m"
```

#### Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: agentik-os-dashboard
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: agentik-os-dashboard
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Technology Deep Dive

### 1. Convex for Multi-Tenancy

**Convex Deployment Per Tenant Model:**

Advantages:
- Perfect data isolation (no query bugs possible)
- Independent scaling per tenant
- Easy backups/restores
- Built-in real-time (no custom WebSocket logic)

Challenges:
- Need master database to track tenant → deployment mapping
- Convex client initialization per request
- Cost (free tier = 1 deployment, need Pro for multiple)

**Implementation Strategy:**

```typescript
// packages/runtime/src/tenants/manager.ts
import { ConvexHttpClient } from "convex/browser";

const tenantDeployments = new Map<string, ConvexHttpClient>();

export function getClientForTenant(tenantId: string): ConvexHttpClient {
  let client = tenantDeployments.get(tenantId);

  if (!client) {
    const tenant = getTenantConfig(tenantId);
    client = new ConvexHttpClient(tenant.convexUrl);
    tenantDeployments.set(tenantId, client);
  }

  return client;
}
```

### 2. Air-Gapped Deployment

**Bundle Contents:**
- Runtime binary (Bun compiled)
- Dashboard static build
- SQLite database (empty schema)
- Offline model files (Ollama)
- Dependency cache
- Update manifests

**Bundle Structure:**
```
agentik-os-airgapped-v1.0.0.tar.gz
├── runtime/
│   ├── bin/agentik-os
│   └── lib/ (vendored deps)
├── dashboard/
│   └── out/ (Next.js static export)
├── models/
│   └── ollama/ (pre-downloaded)
├── install.sh
├── update.sh
└── manifest.json (checksums)
```

**Security:**
- SHA256 checksums for all files
- GPG signature on manifest
- Verify before extraction

### 3. Docker Best Practices

**FROM Choice:**
- Development: `oven/bun:1` (full tooling)
- Production: `oven/bun:1-alpine` (minimal)

**Security:**
- Non-root user (`USER bun`)
- Read-only filesystem where possible
- Drop capabilities (`CAP_DROP=ALL`)
- Secret injection via env vars (not baked in)

**Optimization:**
- Layer caching (COPY package.json first)
- .dockerignore (exclude node_modules, .git)
- Multi-stage builds (separate deps/build/runtime)

### 4. Kubernetes Patterns

**Service Mesh vs Ingress:**
- Start with Ingress (simpler)
- Add Istio/Linkerd later if needed

**Storage:**
- PersistentVolumeClaims for StatefulSets
- StorageClass: `gp3` (AWS), `pd-ssd` (GCP)

**Secrets Management:**
- Sealed Secrets (gitops-friendly)
- External Secrets Operator (sync from Vault)
- Never commit secrets to git

---

## Implementation Plan

### Phase 1: Multi-Tenancy (Step 120) - 24h
**BLOCKED until #96 complete**

1. **Design tenant schema** (2h)
   - Master DB: tenants table
   - Fields: id, name, convexUrl, owner, createdAt
   - Migration script

2. **Build TenantManager** (6h)
   - Create tenant → provision Convex deployment
   - Get tenant for user
   - List all tenants
   - Delete tenant (cleanup)

3. **Build TenantIsolator** (6h)
   - Middleware to extract tenant from request
   - Reject requests without valid tenant
   - Inject tenant context into runtime

4. **Update all Convex queries** (8h)
   - Scope by tenant
   - Prevent cross-tenant access
   - Add tenant to all mutations

5. **Testing** (2h)
   - Attempt cross-tenant access (should fail)
   - Concurrent tenant operations
   - Tenant deletion cleanup

### Phase 2: Air-Gapped Bundle (Step 121) - 20h

1. **Bundle script** (8h)
   - Tar runtime + dashboard + deps
   - Download Ollama models
   - Generate manifest with checksums
   - GPG sign manifest

2. **Offline installer** (6h)
   - Verify checksums before install
   - Extract to /opt/agentik-os
   - Configure systemd service
   - Initial setup wizard

3. **Offline updater** (6h)
   - Check for updates (USB or local network)
   - Verify signatures
   - Atomic rollback on failure
   - Preserve data during update

### Phase 3: Docker Production (Step 122) - 16h

1. **Dockerfile.runtime** (4h)
   - Multi-stage build
   - Bun runtime
   - Health check endpoint
   - Non-root user

2. **Dockerfile.dashboard** (3h)
   - Next.js static export
   - Nginx to serve
   - Compression & caching

3. **docker-compose.prod.yml** (6h)
   - Runtime + Dashboard services
   - Prometheus + Grafana
   - Network isolation
   - Volume mounts
   - Health checks

4. **Environment & Secrets** (3h)
   - .env.example template
   - Secret rotation docs
   - Backup scripts

### Phase 4: Kubernetes Helm (Step 123) - 20h

1. **Chart scaffolding** (2h)
   - Chart.yaml metadata
   - values.yaml defaults
   - README.md

2. **StatefulSet for Runtime** (6h)
   - Persistent storage
   - Init containers
   - Liveness/readiness probes
   - Resource limits

3. **Deployment for Dashboard** (4h)
   - HPA configuration
   - Rolling updates
   - Pod disruption budgets

4. **Services & Ingress** (4h)
   - ClusterIP services
   - Ingress with TLS
   - Cert-manager integration

5. **ConfigMaps & Secrets** (2h)
   - Config templates
   - Secret references
   - External Secrets Operator

6. **Documentation** (2h)
   - Installation guide
   - Upgrade guide
   - Troubleshooting

---

## Testing Strategy

### Multi-Tenancy Tests
```typescript
// Test cross-tenant access prevention
test('prevents cross-tenant data access', async () => {
  const tenant1 = await createTenant('tenant1');
  const tenant2 = await createTenant('tenant2');

  const agent1 = await createAgent(tenant1.id, 'Agent 1');

  // Attempt to access agent1 from tenant2 context
  await expect(
    getAgent(tenant2.id, agent1.id)
  ).rejects.toThrow('Agent not found');
});
```

### Docker Tests
```bash
# Build images
docker build -f docker/Dockerfile.runtime -t agentik-os:test .

# Run smoke test
docker run --rm agentik-os:test /health

# Security scan
trivy image agentik-os:test
```

### Kubernetes Tests
```bash
# Dry run
helm install agentik-os ./deploy/kubernetes --dry-run --debug

# Validate manifests
kubeval deploy/kubernetes/templates/*.yaml

# Deploy to test cluster
helm install agentik-os ./deploy/kubernetes -n test
kubectl wait --for=condition=ready pod -l app=agentik-os -n test
```

---

## Quality Checklist

**Multi-Tenancy:**
- [ ] Zero cross-tenant data access possible
- [ ] Tenant creation < 5s
- [ ] Tenant deletion cascades all data
- [ ] Convex client pooling efficient

**Docker:**
- [ ] Runtime image < 100MB
- [ ] Dashboard image < 150MB
- [ ] Health checks pass
- [ ] Zero critical vulnerabilities (Trivy)
- [ ] Startup time < 10s

**Kubernetes:**
- [ ] Helm install works first try
- [ ] Pods ready in < 60s
- [ ] HPA scales under load
- [ ] Graceful shutdown (SIGTERM)
- [ ] PVC properly mounted

**General:**
- [ ] pnpm type-check: 0 errors
- [ ] vitest: 90%+ coverage
- [ ] Documentation complete
- [ ] Guardian approval

---

## Risks & Mitigations

### Risk 1: Convex Multi-Deployment Cost
**Impact:** High - Could be expensive at scale
**Likelihood:** High
**Mitigation:**
- Start with single deployment + RLS for MVP
- Migrate to multi-deployment for enterprise tier only
- Document cost in pricing

### Risk 2: Docker Build Complexity
**Impact:** Medium - Slow CI/CD
**Likelihood:** Medium
**Mitigation:**
- Layer caching in CI
- Use BuildKit
- Parallel builds

### Risk 3: K8s Learning Curve
**Impact:** Low - May take longer
**Likelihood:** Medium
**Mitigation:**
- Reference existing charts (Supabase, Ghost)
- Test on Minikube locally
- Ask architect for review

---

## Next Steps

**NOW (Research Phase):**
1. ✅ Read step.json steps 120-123
2. ✅ Understand project architecture
3. ✅ Research multi-tenancy patterns
4. 🔄 Research Docker best practices (IN PROGRESS)
5. 🔄 Research Kubernetes patterns (IN PROGRESS)
6. ⏳ Create implementation checklist
7. ⏳ Monitor Task #96 progress

**WHEN UNBLOCKED:**
1. Claim Task #97
2. Implement Step 120 (Multi-Tenancy)
3. Implement Step 121 (Air-Gapped)
4. Implement Step 122 (Docker)
5. Implement Step 123 (Kubernetes)
6. Request Guardian verification
7. Mark complete

---

## References

**Multi-Tenancy:**
- [AWS Multi-Tenant SaaS Architecture](https://aws.amazon.com/solutions/multi-tenant-saas/)
- [Stripe's Multi-Tenancy Strategy](https://stripe.com/blog/multi-tenancy)

**Docker:**
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Bun in Docker](https://bun.sh/guides/ecosystem/docker)

**Kubernetes:**
- [Helm Best Practices](https://helm.sh/docs/chart_best_practices/)
- [Supabase Helm Chart](https://github.com/supabase/supabase/tree/master/docker) (reference)

**Security:**
- [OWASP Multi-Tenancy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multitenant_Application_Security_Cheat_Sheet.html)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [CIS Kubernetes Benchmark](https://www.cisecurity.org/benchmark/kubernetes)

---

**Status:** RESEARCH IN PROGRESS
**Blocked By:** Task #96 (Auth & Security)
**Next Update:** When #96 complete or every 24h
