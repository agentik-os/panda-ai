# Security Best Practices

> **Comprehensive security guide for Agentik OS deployments**

Learn how to secure your AI agents, protect user data, prevent common vulnerabilities, and maintain compliance with security standards.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Security Principles](#security-principles)
3. [Authentication & Authorization](#authentication--authorization)
4. [API Security](#api-security)
5. [Data Protection](#data-protection)
6. [Skill Sandboxing](#skill-sandboxing)
7. [Secrets Management](#secrets-management)
8. [Network Security](#network-security)
9. [Monitoring & Incident Response](#monitoring--incident-response)
10. [Compliance](#compliance)
11. [Security Checklist](#security-checklist)
12. [Common Vulnerabilities](#common-vulnerabilities)
13. [Security Tooling](#security-tooling)

---

## Introduction

### Why Security Matters for AI Agents

AI agents have unique security challenges:

- **Autonomous Actions** - Agents can take actions without human approval
- **API Access** - Agents call external APIs with credentials
- **User Data** - Agents process sensitive conversations and documents
- **Code Execution** - Skills run arbitrary code (sandboxed)
- **Multi-Tenancy** - One breach could expose multiple organizations

**A single security flaw can:**
- Expose customer data (GDPR violations, lawsuits)
- Compromise API keys (financial loss)
- Enable unauthorized actions (data deletion, spam)
- Damage brand reputation (loss of trust)

### Security Layers

```
┌─────────────────────────────────────────┐
│  User Authentication (Clerk)            │  ← Layer 1: Who are you?
├─────────────────────────────────────────┤
│  Authorization (RBAC)                   │  ← Layer 2: What can you do?
├─────────────────────────────────────────┤
│  API Security (Rate Limiting, CORS)    │  ← Layer 3: Network protection
├─────────────────────────────────────────┤
│  Data Encryption (At-rest, In-transit) │  ← Layer 4: Data protection
├─────────────────────────────────────────┤
│  Skill Sandboxing (WASM, gVisor)       │  ← Layer 5: Code isolation
├─────────────────────────────────────────┤
│  Secrets Management (Vault)             │  ← Layer 6: Credential security
├─────────────────────────────────────────┤
│  Audit Logging (Immutable logs)        │  ← Layer 7: Forensics
└─────────────────────────────────────────┘
```

---

## Security Principles

### 1. Defense in Depth

Never rely on a single security control. Layer multiple protections:

```typescript
// ❌ BAD: Single layer of protection
if (user.isAuthenticated) {
  return await deleteAgent(agentId);
}

// ✅ GOOD: Multiple layers
if (!user.isAuthenticated) {
  throw new Error("Not authenticated");
}

if (!user.canDeleteAgent(agentId)) {
  throw new Error("Not authorized");
}

if (agent.tenantId !== user.tenantId) {
  throw new Error("Tenant mismatch");
}

await auditLog("agent.delete", { userId: user.id, agentId });
await deleteAgent(agentId);
```

### 2. Least Privilege

Grant only the minimum permissions needed:

```typescript
// Agent permissions
const agentPermissions = {
  // ❌ BAD: Overly broad
  "*": ["read", "write", "delete"],

  // ✅ GOOD: Specific permissions
  "files": ["read"],
  "calendar": ["read", "create"],
  "email": ["send"], // Not "read" - agent shouldn't read emails
};
```

### 3. Zero Trust

**Never trust, always verify** - Even internal components:

```typescript
// ✅ Verify tenant ID even in internal function
async function getAgentMessages(agentId: string, tenantId: string) {
  const agent = await db.get(agentId);

  // Verify tenant owns this agent
  if (agent.tenantId !== tenantId) {
    throw new Error("Tenant mismatch");
  }

  return db.query("messages")
    .withIndex("by_agent", (q) => q.eq("agentId", agentId))
    .collect();
}
```

### 4. Fail Securely

When errors occur, fail to a secure state:

```typescript
// ✅ Default to most restrictive permissions
function getUserPermissions(userId: string): string[] {
  try {
    const user = await db.get(userId);
    return user.permissions || [];
  } catch (error) {
    // On error, return NO permissions (not admin!)
    logger.error("Failed to get user permissions", { userId, error });
    return []; // Safe default
  }
}
```

### 5. Security by Design

Build security in from the start, not as an afterthought:

```typescript
// ✅ Security built into type system
type AgentAction = {
  type: "send_email" | "create_file" | "api_call";
  permissions: string[]; // Required field
  auditLog: boolean; // Required field
  sandbox: boolean; // Required field
};

// Compiler enforces security requirements
const action: AgentAction = {
  type: "send_email",
  permissions: ["email.send"],
  auditLog: true,
  sandbox: true,
};
```

---

## Authentication & Authorization

### Clerk Integration (Recommended)

```typescript
// packages/dashboard/middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Public routes (no auth required)
  publicRoutes: ["/", "/pricing", "/docs"],

  // Routes requiring authentication
  protectedRoutes: ["/dashboard", "/agents", "/settings"],

  // After authentication, redirect here
  afterAuth(auth, req) {
    // Not authenticated → redirect to login
    if (!auth.userId && !isPublicRoute(req.url)) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    // Authenticated but no organization → create/select org
    if (auth.userId && !auth.orgId && req.nextUrl.pathname !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    return NextResponse.next();
  },
});
```

### Role-Based Access Control (RBAC)

```typescript
// Define roles
type Role = "owner" | "admin" | "member" | "viewer";

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  owner: ["*"], // Full access
  admin: [
    "agents.create",
    "agents.update",
    "agents.delete",
    "users.invite",
    "users.remove",
    "settings.update",
  ],
  member: [
    "agents.create",
    "agents.update", // Own agents only
    "messages.send",
    "messages.read",
  ],
  viewer: [
    "agents.read",
    "messages.read",
  ],
};

// Check permission
function hasPermission(user: User, permission: string): boolean {
  const userPermissions = ROLE_PERMISSIONS[user.role];

  // Wildcard grants all permissions
  if (userPermissions.includes("*")) {
    return true;
  }

  // Check exact match
  if (userPermissions.includes(permission)) {
    return true;
  }

  // Check prefix match (e.g., "agents.*" matches "agents.create")
  const permissionParts = permission.split(".");
  for (let i = permissionParts.length; i > 0; i--) {
    const prefix = permissionParts.slice(0, i).join(".") + ".*";
    if (userPermissions.includes(prefix)) {
      return true;
    }
  }

  return false;
}

// Usage in mutation
export const deleteAgent = mutation({
  handler: async (ctx, { agentId }) => {
    const user = await getCurrentUser(ctx);

    // Check permission
    if (!hasPermission(user, "agents.delete")) {
      throw new Error("Permission denied: agents.delete");
    }

    // Additional check: Can only delete own agents (unless admin)
    const agent = await ctx.db.get(agentId);
    if (agent.createdBy !== user.id && user.role !== "admin") {
      throw new Error("Can only delete your own agents");
    }

    await ctx.db.delete(agentId);
  },
});
```

### Multi-Factor Authentication (MFA)

```typescript
// Require MFA for sensitive actions
export const deleteAllAgents = mutation({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    // Require MFA for destructive actions
    if (!user.mfaVerified) {
      throw new Error("MFA verification required for this action");
    }

    // Proceed with deletion
    await deleteAllAgentsForUser(user.id);
  },
});
```

**Enable MFA in Clerk:**
1. Dashboard → User & Authentication → Multi-factor
2. Enable "Time-based one-time password (TOTP)"
3. Optionally require MFA for all users

---

## API Security

### Rate Limiting

Prevent abuse and DoS attacks:

```typescript
// packages/runtime/src/middleware/rateLimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Per-user rate limits
const userRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
});

// Per-IP rate limits (stricter for unauthenticated)
const ipRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
});

export async function checkRateLimit(
  identifier: string,
  type: "user" | "ip"
): Promise<{ success: boolean; limit: number; remaining: number }> {
  const ratelimit = type === "user" ? userRateLimit : ipRateLimit;
  const { success, limit, remaining } = await ratelimit.limit(identifier);

  if (!success) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }

  return { success, limit, remaining };
}
```

**Usage:**

```typescript
// In API route
export async function POST(request: Request) {
  const user = await getCurrentUser();

  // Check rate limit
  await checkRateLimit(user.id, "user");

  // Process request
  return await handleRequest(request);
}
```

### CORS Configuration

```typescript
// packages/dashboard/next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          // Only allow requests from your domain
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_APP_URL || "https://agentik-os.com",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Enable XSS protection
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};
```

### Input Validation

**Never trust user input:**

```typescript
import { z } from "zod";

// Define schema
const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  model: z.enum(["claude-opus-4-6", "claude-sonnet-4-5", "claude-haiku-4-5"]),
  systemPrompt: z.string().max(10000),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().min(1).max(4096),
});

// Validate input
export const createAgent = mutation({
  args: createAgentSchema,
  handler: async (ctx, args) => {
    // args is type-safe and validated
    return await ctx.db.insert("agents", {
      ...args,
      tenantId: ctx.auth.tenantId,
      createdAt: Date.now(),
    });
  },
});
```

**Sanitize HTML:**

```typescript
import DOMPurify from "isomorphic-dompurify";

// Sanitize user-generated HTML
function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href"],
  });
}

// Usage
const safeHtml = sanitizeHtml(userInput);
```

### SQL Injection Prevention

**Convex protects against SQL injection by design:**

```typescript
// ✅ Safe - Convex uses parameterized queries
const users = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", userEmail))
  .collect();

// Even if userEmail contains malicious input, it's treated as data, not code
```

**If using raw SQL (e.g., Postgres for analytics):**

```typescript
import { sql } from "@vercel/postgres";

// ✅ Use parameterized queries
const result = await sql`
  SELECT * FROM users
  WHERE email = ${userEmail}
`;

// ❌ NEVER concatenate user input
const result = await sql`SELECT * FROM users WHERE email = '${userEmail}'`; // VULNERABLE!
```

---

## Data Protection

### Encryption at Rest

**Convex encrypts data at rest by default.**

For additional encryption (e.g., storing credit cards):

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32-byte key
const ALGORITHM = "aes-256-gcm";

export function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(":");

  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Usage
const encryptedCard = encrypt(creditCardNumber);
await db.insert("payments", { encryptedCard });
```

### Encryption in Transit

**Always use HTTPS:**

```typescript
// Enforce HTTPS in production
if (process.env.NODE_ENV === "production" && !request.url.startsWith("https://")) {
  return NextResponse.redirect(request.url.replace("http://", "https://"));
}
```

**TLS Configuration (nginx):**

```nginx
server {
  listen 443 ssl http2;
  server_name agentik-os.com;

  # Strong SSL configuration
  ssl_certificate /etc/letsencrypt/live/agentik-os.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/agentik-os.com/privkey.pem;

  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
  ssl_prefer_server_ciphers on;

  # HSTS (force HTTPS for 1 year)
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### Data Retention & Deletion

**Implement data lifecycle policies:**

```typescript
// Cron job to delete old data
export const deleteOldMessages = internalMutation({
  handler: async (ctx) => {
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 days

    const oldMessages = await ctx.db
      .query("messages")
      .withIndex("by_created_at", (q) => q.lt("createdAt", cutoff))
      .collect();

    for (const message of oldMessages) {
      // Check if tenant has requested data retention
      const tenant = await ctx.db.get(message.tenantId);
      if (tenant.dataRetentionDays && tenant.dataRetentionDays > 90) {
        continue; // Skip deletion
      }

      await ctx.db.delete(message._id);
    }

    return { deleted: oldMessages.length };
  },
});
```

**GDPR Right to Erasure:**

```typescript
export const deleteUserData = mutation({
  handler: async (ctx, { userId }) => {
    // Verify permission
    const currentUser = await getCurrentUser(ctx);
    if (currentUser.id !== userId && !currentUser.isAdmin) {
      throw new Error("Permission denied");
    }

    // Delete all user data
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("createdBy", userId))
      .collect();

    for (const agent of agents) {
      await ctx.db.delete(agent._id);
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Anonymize user record (don't delete to preserve audit logs)
    await ctx.db.patch(userId, {
      email: `deleted-${userId}@example.com`,
      name: "Deleted User",
      deletedAt: Date.now(),
    });

    return { deleted: true };
  },
});
```

---

## Skill Sandboxing

### WASM Sandboxing with Extism

All skills run in WebAssembly sandboxes:

```typescript
// packages/runtime/src/skills/sandbox.ts
import { createPlugin } from "@extism/extism";

export async function runSkillInSandbox(
  skillCode: Uint8Array,
  input: unknown
): Promise<unknown> {
  // Create isolated WASM plugin
  const plugin = await createPlugin(skillCode, {
    useWasi: true,
    allowedHosts: ["api.example.com"], // Whitelist external APIs
    config: {
      timeout: 30000, // 30 second timeout
      maxMemory: 50 * 1024 * 1024, // 50 MB memory limit
    },
  });

  try {
    // Call skill function
    const output = await plugin.call("execute", JSON.stringify(input));
    return JSON.parse(output.toString());
  } finally {
    // Always clean up
    await plugin.close();
  }
}
```

**Skill capabilities are explicitly granted:**

```typescript
// Skill manifest defines permissions
const skillManifest = {
  id: "weather-skill",
  permissions: [
    "network.http.get", // Can make HTTP GET requests
    // NOT granted: "network.http.post", "fs.read", "process.spawn"
  ],
  allowedHosts: [
    "api.weather.com", // Can only call this API
  ],
  maxMemory: 10 * 1024 * 1024, // 10 MB
  timeout: 5000, // 5 seconds
};
```

### Container Isolation (Production)

For high-security deployments, run skills in containers:

```yaml
# docker-compose.yml
services:
  skill-sandbox:
    image: agentik-os/skill-runner:latest
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    read_only: true
    tmpfs:
      - /tmp
    environment:
      - SKILL_TIMEOUT=30
      - MAX_MEMORY=50M
```

**gVisor for kernel-level isolation:**

```bash
# Run skill container with gVisor
docker run --runtime=runsc \
  --memory=50m \
  --cpus=0.5 \
  --network=none \
  agentik-os/skill-runner:latest
```

---

## Secrets Management

### Environment Variables

```bash
# .env.local (NEVER commit to git!)
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
CONVEX_DEPLOYMENT=prod:happy-animal-123
CLERK_SECRET_KEY=sk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx

# Use strong secrets
ENCRYPTION_KEY=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
```

**Load securely:**

```typescript
// Validate at startup
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is required");
}

// Never log secrets
logger.info("API Key loaded", {
  keyPrefix: process.env.ANTHROPIC_API_KEY.slice(0, 7) + "...",
});
```

### HashiCorp Vault (Enterprise)

```typescript
import vault from "node-vault";

const client = vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

// Read secret
const secret = await client.read("secret/data/anthropic");
const apiKey = secret.data.data.api_key;

// Write secret
await client.write("secret/data/stripe", {
  data: { secret_key: process.env.STRIPE_SECRET_KEY },
});
```

### Rotating Secrets

```typescript
// Cron job to rotate API keys
export const rotateApiKeys = internalMutation({
  handler: async (ctx) => {
    const tenants = await ctx.db.query("tenants").collect();

    for (const tenant of tenants) {
      // Generate new API key
      const newKey = generateApiKey();

      // Update tenant
      await ctx.db.patch(tenant._id, {
        apiKey: newKey,
        apiKeyRotatedAt: Date.now(),
      });

      // Notify tenant
      await sendEmail({
        to: tenant.billingEmail,
        subject: "API Key Rotated",
        body: `Your new API key: ${newKey}`,
      });
    }
  },
});
```

---

## Network Security

### Firewall Rules

```bash
# Allow only necessary ports
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

### DDoS Protection (Cloudflare)

```typescript
// Cloudflare Turnstile (CAPTCHA)
export async function verifyCaptcha(token: string): Promise<boolean> {
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    }
  );

  const data = await response.json();
  return data.success;
}
```

### IP Whitelisting

```typescript
// Restrict admin endpoints to trusted IPs
const ADMIN_IP_WHITELIST = [
  "203.0.113.0/24", // Office network
  "192.0.2.42", // VPN
];

export function isAdminIpAllowed(ip: string): boolean {
  return ADMIN_IP_WHITELIST.some((range) => ipInRange(ip, range));
}

// In API route
if (!isAdminIpAllowed(request.ip)) {
  return new Response("Forbidden", { status: 403 });
}
```

---

## Monitoring & Incident Response

### Security Logging

```typescript
// Log all security events
export function logSecurityEvent(event: {
  type: "auth.failed" | "permission.denied" | "rate_limit.exceeded" | "suspicious.activity";
  userId?: string;
  ip: string;
  details: unknown;
}) {
  logger.warn("Security event", {
    ...event,
    timestamp: new Date().toISOString(),
    severity: getSeverity(event.type),
  });

  // Also send to SIEM (e.g., Datadog, Splunk)
  if (process.env.SIEM_ENDPOINT) {
    fetch(process.env.SIEM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  }
}
```

### Alerting

```typescript
// Alert on suspicious activity
export async function detectSuspiciousActivity(userId: string) {
  const recentFailedLogins = await db
    .query("audit_logs")
    .withIndex("by_user_and_type", (q) =>
      q.eq("userId", userId).eq("type", "auth.failed")
    )
    .filter((q) => q.gte(q.field("timestamp"), Date.now() - 3600000)) // Last hour
    .collect();

  if (recentFailedLogins.length > 5) {
    // Alert security team
    await sendSlackAlert({
      channel: "#security",
      message: `⚠️ Suspicious activity: ${recentFailedLogins.length} failed login attempts for user ${userId}`,
    });

    // Temporarily lock account
    await db.patch(userId, { locked: true, lockedReason: "Suspicious activity" });
  }
}
```

### Incident Response Plan

**1. Detection** → Automated alerts + manual reports

**2. Containment**
```bash
# Disable compromised user
panda user suspend <userId>

# Rotate API keys
panda tenant rotate-keys <tenantId>

# Block malicious IP
ufw deny from <ip>
```

**3. Investigation**
```bash
# Export audit logs
panda audit export --user <userId> --start 2026-02-01 --end 2026-02-14

# Check for data exfiltration
panda audit search --type "data.export" --user <userId>
```

**4. Recovery**
```bash
# Restore from backup
panda restore --tenant <tenantId> --snapshot <snapshotId>

# Reset passwords
panda tenant reset-passwords <tenantId>
```

**5. Post-Mortem**
- Document incident timeline
- Identify root cause
- Implement preventive measures
- Notify affected users (if required)

---

## Compliance

### GDPR (EU)

**Requirements:**
- ✅ User consent for data processing
- ✅ Right to access (data export)
- ✅ Right to erasure (data deletion)
- ✅ Data portability
- ✅ Breach notification (within 72 hours)

**Implementation:**

```typescript
// GDPR consent tracking
export const recordConsent = mutation({
  handler: async (ctx, { userId, consentType }) => {
    await ctx.db.insert("consents", {
      userId,
      type: consentType, // "data_processing", "marketing", etc.
      granted: true,
      timestamp: Date.now(),
      ipAddress: ctx.request.ip,
    });
  },
});

// Data export
export const exportUserData = query({
  handler: async (ctx, { userId }) => {
    // Export all data in machine-readable format
    const agents = await ctx.db.query("agents")...;
    const messages = await ctx.db.query("messages")...;

    return {
      agents: agents.map((a) => ({ ...a })),
      messages: messages.map((m) => ({ ...m })),
      exportedAt: new Date().toISOString(),
    };
  },
});
```

### HIPAA (Healthcare - US)

**Requirements:**
- ✅ Encryption at rest and in transit
- ✅ Audit logs (all data access)
- ✅ Access controls (RBAC)
- ✅ Business Associate Agreement (BAA)
- ✅ Breach notification

**Implementation:**

```typescript
// Audit every access to PHI (Protected Health Information)
export const getPatientData = query({
  handler: async (ctx, { patientId }) => {
    // Log access
    await ctx.db.insert("phi_access_logs", {
      userId: ctx.auth.userId,
      patientId,
      timestamp: Date.now(),
      action: "read",
    });

    return await ctx.db.get(patientId);
  },
});
```

### SOC 2 (Enterprise)

**Requirements:**
- ✅ Security policies documented
- ✅ Access controls enforced
- ✅ Change management process
- ✅ Incident response plan
- ✅ Regular security audits

**Implementation:**

```typescript
// Change management audit trail
export const deployCode = mutation({
  handler: async (ctx, { version, changes }) => {
    // Require approval
    if (!ctx.auth.hasRole("admin")) {
      throw new Error("Deployment requires admin approval");
    }

    // Log deployment
    await ctx.db.insert("deployments", {
      version,
      changes,
      deployedBy: ctx.auth.userId,
      timestamp: Date.now(),
      approvedBy: ctx.auth.approvedBy,
    });

    // Deploy
    await deploy(version);
  },
});
```

---

## Security Checklist

### Pre-Launch

- [ ] All endpoints require authentication
- [ ] RBAC implemented and tested
- [ ] Input validation on all user inputs
- [ ] Rate limiting configured
- [ ] CORS configured correctly
- [ ] HTTPS enforced (no HTTP)
- [ ] Secrets stored in env vars (not code)
- [ ] Error messages don't leak sensitive info
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Security headers configured
- [ ] Audit logging implemented
- [ ] Backup and recovery tested
- [ ] Incident response plan documented

### Monthly

- [ ] Review audit logs for anomalies
- [ ] Update dependencies (npm audit fix)
- [ ] Rotate API keys
- [ ] Review user permissions
- [ ] Test backup restoration
- [ ] Review security alerts
- [ ] Update security documentation

### Quarterly

- [ ] Penetration testing
- [ ] Security training for team
- [ ] Review and update incident response plan
- [ ] Compliance audit (GDPR, HIPAA, SOC 2)
- [ ] Disaster recovery drill

---

## Common Vulnerabilities

### 1. Broken Authentication

**Vulnerability:**
```typescript
// ❌ Weak session management
if (req.cookies.userId === targetUserId) {
  return userData;
}
```

**Fix:**
```typescript
// ✅ Use Clerk for authentication
const { userId } = auth();
if (!userId) {
  return redirect("/login");
}
```

### 2. Sensitive Data Exposure

**Vulnerability:**
```typescript
// ❌ Logging sensitive data
logger.info("User logged in", { user: fullUserObject });
```

**Fix:**
```typescript
// ✅ Redact sensitive fields
logger.info("User logged in", {
  userId: user.id,
  // NOT: email, password, apiKey
});
```

### 3. XML External Entities (XXE)

**Vulnerability:**
```typescript
// ❌ Parsing untrusted XML
const xml = new DOMParser().parseFromString(userInput, "text/xml");
```

**Fix:**
```typescript
// ✅ Disable external entities
const parser = new DOMParser({
  errorHandler: () => {},
  // Disable external entities
});
```

### 4. Insecure Direct Object References (IDOR)

**Vulnerability:**
```typescript
// ❌ No ownership check
export const getAgent = query({
  handler: async (ctx, { agentId }) => {
    return await ctx.db.get(agentId); // Any user can access any agent!
  },
});
```

**Fix:**
```typescript
// ✅ Verify ownership
export const getAgent = query({
  handler: async (ctx, { agentId }) => {
    const agent = await ctx.db.get(agentId);

    // Check user owns this agent
    if (agent.tenantId !== ctx.auth.tenantId) {
      throw new Error("Not found");
    }

    return agent;
  },
});
```

### 5. Security Misconfiguration

**Vulnerability:**
```typescript
// ❌ Debug mode in production
if (req.query.debug === "true") {
  return { __internal: allSecrets };
}
```

**Fix:**
```typescript
// ✅ Disable debug features in production
if (process.env.NODE_ENV !== "development") {
  return new Response("Not found", { status: 404 });
}
```

---

## Security Tooling

### Automated Scanning

**npm audit:**
```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Force fix (may break things)
npm audit fix --force
```

**Snyk:**
```bash
# Install
npm install -g snyk

# Authenticate
snyk auth

# Test for vulnerabilities
snyk test

# Monitor continuously
snyk monitor
```

### Static Analysis

**ESLint Security Plugin:**
```bash
npm install --save-dev eslint-plugin-security

# .eslintrc.json
{
  "plugins": ["security"],
  "extends": ["plugin:security/recommended"]
}
```

**Semgrep:**
```bash
# Install
pip install semgrep

# Scan for security issues
semgrep --config=auto .
```

### Penetration Testing

**OWASP ZAP:**
```bash
# Docker
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://your-app.com

# Generates security report
```

**Burp Suite:**
- Manual testing for complex vulnerabilities
- Session handling, CSRF, authentication bypasses

---

## Summary

Securing Agentik OS requires:

1. **Authentication & Authorization** - Clerk + RBAC
2. **API Security** - Rate limiting, CORS, input validation
3. **Data Protection** - Encryption at rest and in transit
4. **Skill Sandboxing** - WASM (Extism) + containers (gVisor)
5. **Secrets Management** - Env vars + Vault
6. **Network Security** - Firewall, DDoS protection
7. **Monitoring** - Audit logs, alerting, incident response
8. **Compliance** - GDPR, HIPAA, SOC 2

**Remember:**
- Security is a process, not a checklist
- Defense in depth (multiple layers)
- Assume breach (plan for the worst)
- Continuous improvement (learn from incidents)

**Next Steps:**

1. Complete the [Security Checklist](#security-checklist)
2. Set up [Monitoring & Alerting](#monitoring--incident-response)
3. Document your [Incident Response Plan](#monitoring--incident-response)
4. Schedule regular security audits

**Need Help?**

- 📧 Email: security@agentik-os.com
- 🔒 Report vulnerabilities: security@agentik-os.com (PGP key available)
- 💬 Discord: [discord.gg/agentik-os](https://discord.gg/agentik-os)

---

*Last updated: February 14, 2026*
*Agentik OS Security Team*
