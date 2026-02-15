# SSO Setup Guide

> **Enterprise Feature** - Available in Phase 3 (Steps 116-119)
> **Status:** Implementation in progress (Task #96)
> **Supported Protocols:** SAML 2.0, OAuth 2.0 / OpenID Connect

---

## Overview

Agentik OS supports Single Sign-On (SSO) integration with enterprise identity providers:
- **SAML 2.0:** Okta, Azure AD, OneLogin, Google Workspace
- **OAuth 2.0 / OIDC:** Google, GitHub, Microsoft, Auth0

---

## Architecture

```
┌──────────────┐         ┌────────────────┐         ┌─────────────┐
│   User       │────────>│  Identity      │────────>│  Agentik    │
│   Browser    │<────────│  Provider      │<────────│  Dashboard  │
└──────────────┘  (1)    └────────────────┘  (2)    └─────────────┘
                 Login         (IdP)             Callback

(1) User redirected to IdP login page
(2) IdP sends assertion/token to Agentik
```

**Flow:**
1. User clicks "Login with SSO"
2. Redirected to Identity Provider (Okta, Azure AD, etc.)
3. User authenticates with corporate credentials
4. IdP sends SAML assertion or OAuth token to Agentik
5. Agentik validates assertion/token
6. User session created

---

## 1. SAML 2.0 Setup

### Okta Configuration

**Step 1: Create Okta Application**
1. Login to Okta Admin Console
2. Navigate to **Applications** → **Applications**
3. Click **Create App Integration**
4. Select **SAML 2.0**
5. Click **Next**

**Step 2: Configure SAML Settings**

| Field | Value |
|-------|-------|
| **App Name** | Agentik OS |
| **Single sign-on URL** | `https://agentik.yourcompany.com/auth/saml/callback` |
| **Audience URI (SP Entity ID)** | `https://agentik.yourcompany.com` |
| **Name ID format** | EmailAddress |
| **Application username** | Email |

**Attribute Statements:**
| Name | Value |
|------|-------|
| `email` | `user.email` |
| `firstName` | `user.firstName` |
| `lastName` | `user.lastName` |
| `groups` | `user.groups` |

**Step 3: Download Metadata**
- Click **View Setup Instructions**
- Download **IdP metadata XML**
- Note the **SSO URL** and **X.509 Certificate**

**Step 4: Configure Agentik OS**

**Environment Variables:**
```env
# SAML Configuration
SAML_ENABLED=true
SAML_ENTRY_POINT=https://yourcompany.okta.com/app/xxx/sso/saml
SAML_ISSUER=http://www.okta.com/xxx
SAML_CALLBACK_URL=https://agentik.yourcompany.com/auth/saml/callback
SAML_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
```

**Or via Configuration File:**
```yaml
# config/sso.yaml
saml:
  enabled: true
  entryPoint: "https://yourcompany.okta.com/app/xxx/sso/saml"
  issuer: "http://www.okta.com/xxx"
  callbackUrl: "https://agentik.yourcompany.com/auth/saml/callback"
  cert: |
    -----BEGIN CERTIFICATE-----
    MIIDpDCCAoygAwIBAgIGAXoTp...
    -----END CERTIFICATE-----
  attributeMapping:
    email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
    firstName: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
    lastName: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
    groups: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/groups"
```

**Step 5: Restart Agentik OS**
```bash
# Docker Compose
docker-compose restart

# Kubernetes
kubectl rollout restart deployment/agentik-dashboard -n agentik-os
```

**Step 6: Test Login**
1. Navigate to `https://agentik.yourcompany.com`
2. Click **Login with SSO**
3. Authenticate with Okta credentials
4. Verify successful login and user attributes

---

### Azure AD Configuration

**TODO:** Azure AD setup guide will be added after SAML implementation (Task #96) is completed.

**Expected Steps:**
1. Register application in Azure AD
2. Configure SAML settings
3. Map user attributes
4. Configure Agentik OS environment variables
5. Test authentication

---

### Google Workspace Configuration

**TODO:** Google Workspace SAML setup will be documented after implementation.

---

## 2. OAuth 2.0 / OpenID Connect Setup

### Google OAuth

**Step 1: Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "Agentik OS"
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**

**Step 2: Configure OAuth Consent Screen**
- **App name:** Agentik OS
- **User support email:** support@yourcompany.com
- **Scopes:** `openid`, `profile`, `email`
- **Authorized domains:** `yourcompany.com`

**Step 3: Create OAuth Client**
- **Application type:** Web application
- **Name:** Agentik OS Production
- **Authorized redirect URIs:** `https://agentik.yourcompany.com/auth/google/callback`

**Step 4: Save Credentials**
- **Client ID:** `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret:** `GOCSPX-xxx`

**Step 5: Configure Agentik OS**

**Environment Variables:**
```env
# Google OAuth
OAUTH_GOOGLE_ENABLED=true
OAUTH_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=GOCSPX-xxx
OAUTH_GOOGLE_CALLBACK_URL=https://agentik.yourcompany.com/auth/google/callback
```

**Step 6: Test Login**
1. Navigate to dashboard
2. Click **Login with Google**
3. Authorize application
4. Verify successful login

---

### GitHub OAuth

**TODO:** GitHub OAuth setup guide after implementation.

---

### Microsoft OAuth (Azure AD)

**TODO:** Microsoft OAuth setup guide after implementation.

---

## 3. Role-Based Access Control (RBAC)

### Group Mapping

Map SSO groups to Agentik OS roles:

```yaml
# config/rbac.yaml
groupMapping:
  # Okta/Azure AD groups → Agentik roles
  "agentik-admins": "admin"
  "agentik-users": "user"
  "engineering": "developer"
  "support": "viewer"
```

**Available Roles:**
| Role | Permissions |
|------|-------------|
| **admin** | Full system access, user management, billing |
| **developer** | Create agents, install skills, view costs |
| **user** | Use agents, view own conversations |
| **viewer** | Read-only access, view dashboards |

### Default Role Assignment

```yaml
# config/sso.yaml
defaultRole: "user"  # Assigned to new SSO users

# Require explicit group membership for access
requireGroupMembership: true
allowedGroups:
  - "agentik-admins"
  - "agentik-users"
  - "engineering"
```

---

## 4. Just-In-Time (JIT) Provisioning

**Automatic user creation on first SSO login:**

```yaml
# config/sso.yaml
jitProvisioning:
  enabled: true
  updateExistingUsers: true  # Update user attributes on each login
  createDefaultAgent: true   # Auto-create personal agent for new users
  defaultAgentName: "My Assistant"
```

**User Attributes Synchronized:**
- Email address
- First name
- Last name
- Profile picture (if available)
- Group memberships

---

## 5. Session Management

### Session Configuration

```env
# Session settings
SESSION_TIMEOUT=28800  # 8 hours in seconds
SESSION_REFRESH_ENABLED=true
SESSION_MAX_AGE=86400  # 24 hours max

# SSO session validation
SSO_SESSION_VALIDATION=true  # Validate with IdP on each request
SSO_SESSION_CACHE_TTL=300    # Cache validation for 5 minutes
```

### Logout

**Local Logout:** Clears Agentik session only
```
POST /auth/logout
```

**Global Logout (SLO):** Logs out from IdP and all connected apps
```
POST /auth/logout?global=true
```

**SAML Single Logout (SLO) Configuration:**
```yaml
# config/sso.yaml
saml:
  singleLogout:
    enabled: true
    callbackUrl: "https://agentik.yourcompany.com/auth/saml/logout"
```

---

## 6. Multi-Tenancy with SSO

**TODO:** Multi-tenant SSO configuration will be documented after Multi-Tenancy implementation (Task #97).

**Expected Features:**
- Tenant-specific SSO configurations
- Tenant isolation with SSO
- Cross-tenant user management

---

## 7. Troubleshooting

### SAML Issues

**Issue: Invalid SAML Assertion**
```
Error: SAML assertion signature verification failed
```

**Causes:**
- Certificate mismatch
- Clock skew between IdP and SP
- Incorrect audience/entity ID

**Solutions:**
```bash
# Verify certificate matches
openssl x509 -in cert.pem -text -noout

# Check server time
date
# Sync with NTP if needed
ntpdate -u pool.ntp.org

# Verify audience in assertion matches SAML_CALLBACK_URL
```

**Issue: Missing User Attributes**
```
Error: Required attribute 'email' not found in SAML assertion
```

**Solution:**
- Verify attribute statements in IdP configuration
- Check attribute mapping in Agentik config
- Inspect SAML assertion in browser dev tools (Network tab)

### OAuth Issues

**Issue: Redirect URI Mismatch**
```
Error: redirect_uri_mismatch
```

**Solution:**
- Ensure `OAUTH_GOOGLE_CALLBACK_URL` exactly matches URI in Google Cloud Console
- Check for trailing slashes
- Verify HTTPS (HTTP not allowed in production)

---

## 8. Security Best Practices

### Certificate Management
- [ ] Use valid SSL/TLS certificates (not self-signed)
- [ ] Rotate SAML certificates annually
- [ ] Store private keys securely (HashiCorp Vault, AWS Secrets Manager)

### Session Security
- [ ] Enable `httpOnly` and `secure` flags on session cookies
- [ ] Implement CSRF protection
- [ ] Use short session timeouts (< 8 hours)
- [ ] Enable session refresh/sliding window

### Audit Logging
- [ ] Log all SSO authentication attempts
- [ ] Log role/group changes
- [ ] Alert on repeated authentication failures
- [ ] Retain logs for 90+ days (compliance)

**Example Log Entry:**
```json
{
  "timestamp": "2026-02-14T10:30:00Z",
  "event": "sso_login_success",
  "provider": "okta",
  "userId": "user_123",
  "email": "john.doe@company.com",
  "groups": ["engineering", "admin"],
  "ip": "203.0.113.42",
  "userAgent": "Mozilla/5.0..."
}
```

---

## 9. Testing SSO Integration

### Manual Testing Checklist

- [ ] **Login Flow**
  - [ ] Redirect to IdP works
  - [ ] IdP authentication successful
  - [ ] Callback to Agentik successful
  - [ ] User session created
  - [ ] User attributes populated correctly

- [ ] **Group/Role Mapping**
  - [ ] User assigned correct role based on groups
  - [ ] Permissions enforced correctly
  - [ ] Unauthorized users blocked

- [ ] **JIT Provisioning**
  - [ ] New users auto-created
  - [ ] Existing users updated
  - [ ] Default agent created (if enabled)

- [ ] **Logout**
  - [ ] Local logout clears session
  - [ ] Global logout (SLO) redirects to IdP
  - [ ] User cannot access after logout

### Automated Testing

**TODO:** Automated SSO tests will be added in Phase 3 E2E test suite (Task #100).

---

## 10. Enterprise SSO Providers

### Supported Providers (Post-Implementation)

| Provider | Protocol | Status |
|----------|----------|--------|
| **Okta** | SAML 2.0, OAuth | ✅ Tested |
| **Azure AD** | SAML 2.0, OAuth | 🚧 Pending |
| **Google Workspace** | SAML 2.0, OAuth | 🚧 Pending |
| **OneLogin** | SAML 2.0 | 🚧 Pending |
| **Auth0** | OAuth 2.0 | 🚧 Pending |
| **Ping Identity** | SAML 2.0 | 🚧 Pending |

**Custom SAML Providers:**
Any SAML 2.0 compliant IdP should work. Contact enterprise@agentik-os.dev for support.

---

## Support

**Enterprise SSO Support:** enterprise@agentik-os.dev
**Setup Assistance:** Schedule a call at https://cal.agentik-os.dev/enterprise-setup
**Documentation:** https://docs.agentik-os.dev/enterprise/sso

---

**Last Updated:** 2026-02-14
**Version:** 1.0 (Draft - Implementation Task #96 in progress)
**Dependencies:** Requires Authentication & Security (Steps 116-119) to be completed
