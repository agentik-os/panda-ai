# Role-Based Access Control (RBAC) Guide

> **Enterprise Feature** - Granular permission management
> **Status:** Implementation in progress (Task #96 - Authentication & Security)

---

## Overview

Agentik OS implements fine-grained Role-Based Access Control (RBAC) to:
- Control who can access what features
- Enforce security policies
- Meet compliance requirements
- Support multi-tenant deployments

---

## Built-in Roles

| Role | Description | Use Case |
|------|-------------|----------|
| **admin** | Full system access | System administrators, DevOps |
| **developer** | Create agents, install skills, manage costs | Engineers, power users |
| **user** | Use agents, view conversations | End users, employees |
| **viewer** | Read-only access | Auditors, managers, observers |

---

## Role Permissions Matrix

| Permission | admin | developer | user | viewer |
|------------|-------|-----------|------|--------|
| **Agents** |
| Create agent | ✅ | ✅ | ❌ | ❌ |
| Edit own agent | ✅ | ✅ | ✅ | ❌ |
| Edit any agent | ✅ | ❌ | ❌ | ❌ |
| Delete agent | ✅ | ⚠️ Own only | ⚠️ Own only | ❌ |
| View agent conversations | ✅ | ✅ | ⚠️ Own only | ⚠️ Own only |
| **Skills** |
| Install skill | ✅ | ✅ | ❌ | ❌ |
| Publish skill to marketplace | ✅ | ✅ | ❌ | ❌ |
| Approve skill (security review) | ✅ | ❌ | ❌ | ❌ |
| Uninstall skill | ✅ | ✅ | ⚠️ Own agents | ❌ |
| **Costs** |
| View cost dashboard | ✅ | ✅ | ⚠️ Own only | ⚠️ Own only |
| Set budgets | ✅ | ✅ | ⚠️ Own agents | ❌ |
| Export cost reports | ✅ | ✅ | ❌ | ❌ |
| View billing | ✅ | ❌ | ❌ | ❌ |
| **Administration** |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Configure SSO | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ | ❌ |
| System settings | ✅ | ❌ | ❌ | ❌ |
| **Dreams** |
| Schedule dream | ✅ | ✅ | ⚠️ Own agents | ❌ |
| View dream execution logs | ✅ | ✅ | ⚠️ Own only | ⚠️ Own only |
| **Time Travel Debug** |
| Capture snapshots | ✅ | ✅ | ❌ | ❌ |
| Replay conversations | ✅ | ✅ | ❌ | ❌ |
| View snapshots | ✅ | ✅ | ⚠️ Own only | ⚠️ Own only |

**Legend:**
- ✅ Full access
- ⚠️ Limited access (conditions apply)
- ❌ No access

---

## Role Assignment

### Manual Assignment

**Via CLI:**
```bash
panda user assign-role \
  --email john.doe@company.com \
  --role developer
```

**Via Dashboard:**
1. Navigate to **Settings** → **Users**
2. Find user in list
3. Click **Edit**
4. Select role from dropdown
5. Click **Save**

### Automatic Assignment (SSO)

**Group-Based Assignment:**
```yaml
# config/rbac.yaml
groupMapping:
  # Corporate groups → Agentik roles
  "agentik-admins": "admin"
  "engineering": "developer"
  "employees": "user"
  "contractors": "user"
  "finance-team": "viewer"
```

**Attribute-Based Assignment:**
```yaml
# config/rbac.yaml
attributeMapping:
  - attribute: "department"
    value: "Engineering"
    role: "developer"

  - attribute: "department"
    value: "Finance"
    role: "viewer"

  - attribute: "jobTitle"
    contains: "Manager"
    role: "developer"
```

---

## Custom Permissions

### Creating Custom Roles

**TODO:** Custom role creation will be available after RBAC implementation (Task #96).

**Expected Configuration:**
```yaml
# config/rbac.yaml
customRoles:
  - name: "skill-reviewer"
    description: "Can review and approve skills for marketplace"
    permissions:
      - "skills:view"
      - "skills:approve"
      - "skills:reject"
      - "skills:comment"
      - "marketplace:moderate"

  - name: "cost-analyst"
    description: "Can view all costs but not modify"
    permissions:
      - "costs:view:all"
      - "costs:export:all"
      - "budgets:view:all"
```

---

## Permission Inheritance

```
admin
  ↓ (inherits all permissions from developer)
developer
  ↓ (inherits all permissions from user)
user
  ↓ (inherits all permissions from viewer)
viewer
```

**Example:**
- `developer` role can do everything `user` can do, plus create agents and install skills
- `admin` role can do everything `developer` can do, plus manage users and system settings

---

## Resource-Level Permissions

### Agent Ownership

**Owned Agents:**
- Creator has full control
- Can share with specific users
- Can transfer ownership

**Shared Agents:**
- Read-only by default
- Owner can grant edit permissions

**Example:**
```yaml
# Agent ownership
agent:
  id: "agent_001"
  name: "Sales Assistant"
  owner: "john.doe@company.com"
  sharedWith:
    - email: "jane.smith@company.com"
      permission: "read"
    - email: "team-sales@company.com"
      permission: "edit"
```

### Skill Permissions

**Dangerous Permissions Require Approval:**
- `fs:write` - Write to filesystem
- `network:external` - Access external APIs
- `exec:shell` - Execute shell commands
- `db:write` - Write to database

**Approval Workflow:**
```
User installs skill
  ↓
Skill requests dangerous permission
  ↓
Admin review required
  ↓
Admin approves/rejects
  ↓
Skill installed (if approved)
```

---

## Multi-Tenancy RBAC

**TODO:** Multi-tenant RBAC will be documented after implementation (Task #97).

**Expected Features:**
- Tenant-scoped roles
- Cross-tenant isolation
- Tenant admin role
- Resource quotas per tenant

---

## Audit Logging

All permission checks and role changes are logged:

```json
{
  "timestamp": "2026-02-14T10:30:00Z",
  "event": "permission_check",
  "userId": "user_123",
  "email": "john.doe@company.com",
  "role": "developer",
  "resource": "agent_001",
  "action": "delete",
  "result": "denied",
  "reason": "User does not own this agent"
}
```

**Audit Log Access:**
- **Admins:** View all audit logs
- **Others:** No access

**Retention:**
- 90 days default
- Configurable up to 365 days

---

## Permission Enforcement Points

### API Level

```typescript
// Runtime enforcement
import { requirePermission } from "@agentik-os/runtime/rbac";

export const deleteAgent = async (agentId: string, userId: string) => {
  // Check permission
  await requirePermission(userId, "agents:delete", { agentId });

  // Permission granted, proceed
  await db.delete("agents", agentId);
};
```

### Dashboard Level

```tsx
// UI enforcement
import { usePermission } from "@agentik-os/dashboard/hooks";

function AgentCard({ agent }) {
  const canDelete = usePermission("agents:delete", { agentId: agent.id });

  return (
    <Card>
      {/* ... */}
      {canDelete && (
        <Button onClick={handleDelete}>Delete</Button>
      )}
    </Card>
  );
}
```

### CLI Level

```bash
# CLI enforcement
panda agent delete agent_001
# Error: Permission denied. Required: agents:delete
```

---

## Default Role Policies

### Admin Policy

```yaml
permissions:
  - "*:*"  # Full access to everything
```

### Developer Policy

```yaml
permissions:
  # Agents
  - "agents:create"
  - "agents:read:own"
  - "agents:update:own"
  - "agents:delete:own"

  # Skills
  - "skills:install"
  - "skills:publish"
  - "skills:read"

  # Costs
  - "costs:read:own"
  - "costs:export:own"
  - "budgets:create:own"
  - "budgets:update:own"

  # Dreams
  - "dreams:create:own"
  - "dreams:read:own"
  - "dreams:execute:own"

  # Time Travel
  - "debug:snapshot:own"
  - "debug:replay:own"
```

### User Policy

```yaml
permissions:
  # Agents
  - "agents:read:own"
  - "agents:update:own"

  # Skills
  - "skills:read"

  # Conversations
  - "conversations:read:own"
  - "conversations:create:own"

  # Costs
  - "costs:read:own"
```

### Viewer Policy

```yaml
permissions:
  # Read-only
  - "agents:read:own"
  - "conversations:read:own"
  - "costs:read:own"
  - "skills:read"
```

---

## Testing RBAC

### Manual Testing Checklist

- [ ] **Admin role**
  - [ ] Can access all features
  - [ ] Can manage users
  - [ ] Can configure system settings
  - [ ] Can approve skills

- [ ] **Developer role**
  - [ ] Can create agents
  - [ ] Can install skills
  - [ ] Cannot manage users
  - [ ] Cannot access system settings

- [ ] **User role**
  - [ ] Can use agents
  - [ ] Cannot create agents
  - [ ] Cannot install skills
  - [ ] Cannot access admin features

- [ ] **Viewer role**
  - [ ] Can view dashboards
  - [ ] Cannot modify anything
  - [ ] Cannot create conversations

### Automated Testing

**TODO:** RBAC tests will be added in Phase 3 E2E test suite (Task #100).

---

## Security Best Practices

### Principle of Least Privilege
- Start users with minimal permissions
- Grant additional permissions as needed
- Review permissions quarterly

### Regular Audits
- Review user roles monthly
- Remove inactive users
- Check for permission creep

### Separation of Duties
- Don't assign admin role unless necessary
- Use developer role for day-to-day work
- Reserve admin for system changes

---

## Troubleshooting

### Issue: Permission Denied

```
Error: Permission denied. Required: agents:delete
```

**Causes:**
- User doesn't have required role
- User doesn't own the resource
- Permission not granted to role

**Solutions:**
1. Check user's role: `panda user get john.doe@company.com`
2. Check resource ownership: `panda agent get agent_001`
3. Contact admin to assign appropriate role

### Issue: Role Not Applied After SSO Login

**Causes:**
- Group mapping not configured
- User not in mapped group
- SSO attributes not synced

**Solutions:**
1. Check group mapping in `config/rbac.yaml`
2. Verify user's groups in IdP (Okta, Azure AD)
3. Re-login to sync attributes
4. Check audit logs for role assignment events

---

## Support

**Enterprise RBAC Support:** enterprise@agentik-os.dev
**Documentation:** https://docs.agentik-os.dev/enterprise/rbac
**Feature Requests:** https://github.com/agentik-os/agentik-os/discussions

---

**Last Updated:** 2026-02-14
**Version:** 1.0 (Draft - Implementation Task #96 in progress)
**Dependencies:** Requires Authentication & Security (Steps 116-119) to be completed
