# Task #97 Implementation Checklist

**Agent:** runtime-backend-3
**Status:** BLOCKED by #96
**Ready to Execute:** When #96 complete

---

## Pre-Implementation (COMPLETED ✅)

- [x] Read step.json steps 120-123
- [x] Understand existing codebase patterns
- [x] Research multi-tenancy strategies
- [x] Research Docker best practices
- [x] Research Kubernetes patterns
- [x] Create design document
- [x] Create implementation examples
- [x] Notify team lead of research completion

---

## Step 120: Multi-Tenant Support (24h)

### Phase 1: Schema Design (2h)
- [ ] Design tenant data model (id, name, convexUrl, owner, subscription)
- [ ] Create SQLite migration: `backends/sqlite/migrations/009_tenants.sql`
- [ ] Define TypeScript interfaces in `packages/shared/src/types/tenant.ts`
- [ ] Update Convex schema if using Convex for master DB

### Phase 2: Tenant Manager (6h)
- [ ] Create `packages/runtime/src/tenants/manager.ts`
  - [ ] `createTenant()` - Provision new Convex deployment
  - [ ] `getTenant()` - Fetch tenant by ID
  - [ ] `getTenantForUser()` - Map user to tenant
  - [ ] `listTenants()` - List all tenants
  - [ ] `deleteTenant()` - Cleanup tenant data
- [ ] Add Convex client pooling (cache clients by tenant)
- [ ] Add error handling (deployment provisioning failures)
- [ ] Add logging (tenant lifecycle events)

### Phase 3: Tenant Isolator (6h)
- [ ] Create `packages/runtime/src/tenants/isolator.ts`
  - [ ] Middleware to extract tenant from request headers
  - [ ] Reject requests without valid tenant
  - [ ] Inject tenant context into runtime
  - [ ] Scope all database queries by tenant
- [ ] Update `packages/runtime/src/convex-client.ts` to use tenant context
- [ ] Add tenant validation middleware to all API routes

### Phase 4: Update Existing Code (8h)
- [ ] Update `cost/event-store.ts` - Scope to tenant
- [ ] Update `memory/` modules - Scope to tenant
- [ ] Update `pipeline/` - Scope to tenant
- [ ] Update all Convex mutations to include tenantId
- [ ] Update all Convex queries to filter by tenantId

### Phase 5: Testing (2h)
- [ ] Write `tenants/manager.test.ts`
  - [ ] Test tenant creation
  - [ ] Test tenant retrieval
  - [ ] Test tenant deletion cleanup
- [ ] Write `tenants/isolator.test.ts`
  - [ ] Test cross-tenant access prevention
  - [ ] Test missing tenant rejection
  - [ ] Test valid tenant acceptance
- [ ] Integration test: Create 2 tenants, verify data isolation
- [ ] Run `pnpm type-check` → 0 errors
- [ ] Run `pnpm test` → 90%+ coverage

---

## Step 121: Air-Gapped Deployment (20h)

### Phase 1: Bundle Script (8h)
- [ ] Create `installer/air-gapped-bundle.sh`
  - [ ] Compile runtime to standalone binary
  - [ ] Build dashboard static export
  - [ ] Bundle all node_modules
  - [ ] Download Ollama models (llama3, mistral)
  - [ ] Create SQLite schema dump
  - [ ] Generate manifest.json with SHA256 checksums
  - [ ] GPG sign manifest
- [ ] Test bundle generation
- [ ] Verify bundle size (<500MB compressed)

### Phase 2: Offline Installer (6h)
- [ ] Create `installer/install-airgapped.sh`
  - [ ] Verify manifest signature (GPG)
  - [ ] Verify all file checksums
  - [ ] Extract to `/opt/agentik-os`
  - [ ] Setup systemd service
  - [ ] Run initial database migrations
  - [ ] Generate admin credentials
  - [ ] Print setup instructions
- [ ] Test on clean Ubuntu/Debian system
- [ ] Test on clean RHEL/CentOS system

### Phase 3: Offline Updater (6h)
- [ ] Create `packages/runtime/src/updates/offline-updater.ts`
  - [ ] Check for update bundle (USB, local network)
  - [ ] Verify update bundle signature
  - [ ] Create backup of current installation
  - [ ] Apply update atomically
  - [ ] Rollback on failure
  - [ ] Restart services
- [ ] Write tests for rollback scenarios
- [ ] Test update from v1.0.0 → v1.1.0 mock

---

## Step 122: Docker Compose Production (16h)

### Phase 1: Runtime Dockerfile (4h)
- [ ] Move `docker-examples/Dockerfile.runtime` → `docker/Dockerfile.runtime`
- [ ] Test multi-stage build
- [ ] Verify image size (<100MB)
- [ ] Run Trivy security scan → 0 critical/high vulnerabilities
- [ ] Test health check endpoint
- [ ] Test container startup time (<10s)

### Phase 2: Dashboard Dockerfile (3h)
- [ ] Move `docker-examples/Dockerfile.dashboard` → `docker/Dockerfile.dashboard`
- [ ] Test Next.js static export
- [ ] Test Nginx config
- [ ] Verify image size (<150MB)
- [ ] Run Trivy scan
- [ ] Test health check

### Phase 3: Docker Compose (6h)
- [ ] Move `docker-examples/docker-compose.prod.yml` → `docker/docker-compose.prod.yml`
- [ ] Add Nginx reverse proxy for HTTPS
- [ ] Add Let's Encrypt cert automation
- [ ] Configure log rotation
- [ ] Test full stack startup
- [ ] Test service dependencies (dashboard waits for runtime)
- [ ] Test volume persistence (stop/start containers, data preserved)
- [ ] Test Prometheus scraping metrics
- [ ] Test Grafana dashboards

### Phase 4: Documentation (3h)
- [ ] Create `docker/README.md` with deployment guide
- [ ] Document environment variables (use `.env.example`)
- [ ] Document backup procedure
- [ ] Document upgrade procedure
- [ ] Document troubleshooting

---

## Step 123: Kubernetes Helm Chart (20h)

### Phase 1: Chart Scaffolding (2h)
- [ ] Move `k8s-examples/Chart.yaml` → `deploy/kubernetes/Chart.yaml`
- [ ] Move `k8s-examples/values.yaml` → `deploy/kubernetes/values.yaml`
- [ ] Create `deploy/kubernetes/README.md`
- [ ] Create `deploy/kubernetes/.helmignore`

### Phase 2: StatefulSet for Runtime (6h)
- [ ] Create `templates/statefulset.yaml`
  - [ ] Pod spec with init containers
  - [ ] PersistentVolumeClaim template
  - [ ] Liveness & readiness probes
  - [ ] Resource requests/limits
  - [ ] Security context (non-root)
  - [ ] Affinity rules (spread across nodes)
- [ ] Test StatefulSet deployment on Minikube
- [ ] Test pod restart (data persists)
- [ ] Test scaling (2 → 3 → 2 pods)

### Phase 3: Deployment for Dashboard (4h)
- [ ] Create `templates/deployment.yaml`
  - [ ] Pod spec with dashboard container
  - [ ] HPA integration
  - [ ] Rolling update strategy
  - [ ] Pod disruption budget
- [ ] Test deployment
- [ ] Test HPA scaling (load test with k6)
- [ ] Test rolling update (v1.0.0 → v1.0.1)

### Phase 4: Services & Ingress (4h)
- [ ] Create `templates/service.yaml`
  - [ ] ClusterIP service for runtime
  - [ ] ClusterIP service for dashboard
- [ ] Create `templates/ingress.yaml`
  - [ ] TLS configuration
  - [ ] Path routing (/ → dashboard, /api → runtime)
  - [ ] Cert-manager annotations
- [ ] Test ingress (access via domain)
- [ ] Test TLS certificate auto-generation

### Phase 5: ConfigMaps & Secrets (2h)
- [ ] Create `templates/configmap.yaml`
- [ ] Create `templates/secret.yaml`
- [ ] Document External Secrets Operator integration
- [ ] Test secret injection into pods

### Phase 6: Documentation & Testing (2h)
- [ ] Complete `deploy/kubernetes/README.md`
  - [ ] Prerequisites (K8s 1.28+, Helm 3+)
  - [ ] Installation steps
  - [ ] Configuration options
  - [ ] Upgrade guide
  - [ ] Uninstallation
- [ ] Test full install on GKE
- [ ] Test full install on EKS
- [ ] Test full install on AKS
- [ ] Run `helm lint` → 0 warnings
- [ ] Run `kubeval` → All manifests valid

---

## Final Verification

### Type Check
- [ ] `pnpm type-check` → 0 errors

### Tests
- [ ] `pnpm test` → All tests pass
- [ ] `pnpm test:coverage` → 90%+ coverage on new code
- [ ] Integration tests pass

### Docker
- [ ] Runtime image builds successfully
- [ ] Dashboard image builds successfully
- [ ] docker-compose.prod.yml starts full stack
- [ ] Health checks pass
- [ ] Trivy scan: 0 critical/high vulnerabilities

### Kubernetes
- [ ] Helm chart lints successfully
- [ ] Helm chart installs on test cluster
- [ ] All pods reach Ready state
- [ ] Ingress accessible via domain
- [ ] Metrics visible in Prometheus

### Documentation
- [ ] RUNTIME-BACKEND-3-RESEARCH.md complete
- [ ] docker/README.md complete
- [ ] deploy/kubernetes/README.md complete
- [ ] All code has JSDoc comments

### Guardian Review
- [ ] Request Guardian verification
- [ ] Address Guardian feedback
- [ ] Get Guardian approval

### Task Completion
- [ ] Update Task #97 status to "completed"
- [ ] Notify team lead
- [ ] Unblock Task #99 (Enterprise Docs)
- [ ] Celebrate! 🎉

---

**Total:** 80 hours across 4 steps
**ETA:** 3-4 days (when unblocked)
