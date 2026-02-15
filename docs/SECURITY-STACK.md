# Agentik OS - Security Stack

> **Security is not a feature. It's a layer. Every agent action passes through it.**

---

## Philosophy

```
Most AI platforms: "We'll add security later"
Agentik OS:        "Security is the kernel's first job"
```

Three principles:
1. **Sandbox everything** -- no skill touches the host
2. **Audit everything** -- every action is an immutable event
3. **Scan everything** -- code, containers, secrets, prompts

---

## Security Architecture

```
                    ┌─────────────────────────────┐
                    │     SECURITY KERNEL          │
                    │                              │
User ──► Agent ──► │  1. Prompt Guard (LLM Guard) │
                    │  2. Permission Check         │
                    │  3. Budget Check              │
                    │  4. Sandbox (WASM/gVisor)     │
                    │  5. Network Policy            │
                    │  6. Audit Log (event)         │
                    │                              │
                    └──────────┬───────────────────┘
                               │
                    ┌──────────▼───────────────────┐
                    │     SKILL EXECUTION           │
                    │  (isolated, monitored, logged) │
                    └───────────────────────────────┘
```

---

## Layer 1: Runtime Sandbox

Every MCP skill runs in isolation. Zero trust by default.

| Technology | Isolation Level | Cold Start | Best For |
|-----------|----------------|------------|----------|
| **WASM (Extism)** | Memory sandbox | 1ms | Lightweight skills |
| **gVisor** | Syscall filtering | 50ms | Heavy skills |
| **Kata Containers** | Full microVM | 200ms | Untrusted code |
| **seccomp-bpf** | Syscall whitelist | 0ms (filter) | All processes |

### Sandbox Config Per Skill

```yaml
# skill.agentik.yaml
sandbox:
  runtime: wasm              # wasm | gvisor | kata
  network:
    allow_outbound: false
    allowlist:
      - "api.github.com:443"
      - "api.stripe.com:443"
  filesystem:
    read_only: true
    allowed_paths:
      - "/tmp/skill-workspace"
  resources:
    memory_limit: 256Mi
    cpu_limit: 0.5
    timeout: 30s
  secrets:
    allowed:
      - GITHUB_TOKEN
      - STRIPE_KEY
```

---

## Layer 2: AI Security (Prompt Guard)

### Threat Model

| Threat | Attack Vector | Defense |
|--------|--------------|---------|
| **Prompt injection** | User input → manipulate agent | LLM Guard input scanner |
| **Jailbreak** | Bypass safety rules | Multi-layer guardrails |
| **Data exfiltration** | Agent leaks PII/secrets | Output scanner + redaction |
| **Tool poisoning** | Malicious MCP server | Skill audit + sandbox |
| **Shadow servers** | Hidden MCP connections | Network policy enforcement |
| **Confused deputy** | Agent tricked into bad action | Permission system + consent |

### LLM Guard Integration

```
Input Pipeline:                    Output Pipeline:
User message                       Agent response
  → Anonymize PII                    → Check for leaked secrets
  → Detect prompt injection          → Detect PII in output
  → Check banned patterns            → Redact sensitive data
  → Validate against policy          → Log for audit
  → Pass to agent                    → Return to user
```

**LLM Guard** (open source, MIT, 2.5M+ downloads):
- Prompt sanitization (input)
- Response validation (output)
- Real-time detection + redaction
- Configurable sensitivity levels

### MCP-Specific Threats (CoSAI Whitepaper)

12 threat categories, ~40 distinct threats identified:

| Category | Risk | Mitigation |
|----------|------|-----------|
| Identity spoofing | Fake MCP server | Cryptographic server identity |
| Tool poisoning | Malicious tool descriptions | Skill audit before install |
| Command execution | RCE via tool args | Input validation + sandbox |
| Data exfiltration | Tool phones home | Network policy (deny by default) |
| Dependency attacks | Supply chain | SBOM + vulnerability scanning |
| Privilege escalation | Skill requests more perms | Capability-based permissions |

---

## Layer 3: Code Security Scanning

### Integrated Scanners

| Tool | Type | Languages | License | MCP Server |
|------|------|-----------|---------|-----------|
| **Semgrep** | SAST | 30+ | LGPL 2.1 | `mcp:security/semgrep` |
| **Bandit** | SAST | Python | Apache 2.0 | `mcp:security/bandit` |
| **Bearer** | SAST + Privacy | 7 languages | Apache 2.0 | `mcp:security/bearer` |
| **CodeQL** | SAST | 10+ | Free for OSS | `mcp:security/codeql` |
| **npm audit** | SCA | JavaScript | Built-in | `mcp:security/npm-audit` |
| **Trivy** | Multi-scanner | All | Apache 2.0 | `mcp:security/trivy` |

### Dev OS Security Mode

```
Developer pushes code → Pre-commit hook triggers:

  1. Semgrep scan ─────── SAST (code patterns)
  2. npm audit ──────────── SCA (dependencies)
  3. Gitleaks ──────────── Secret detection
  4. Bearer ───────────── Privacy/data flow
  5. Trivy ────────────── Container + SBOM

  All pass? → Commit allowed
  Any fail? → Block + show fix suggestions
```

---

## Layer 4: Secret Detection

### Tools

| Tool | Detectors | Verification | License |
|------|-----------|-------------|---------|
| **TruffleHog** | 800+ | Active (checks if secret is live) | GPL 3.0 |
| **Gitleaks** | Custom regex | Pattern match only | MIT |
| **detect-secrets** | Baseline comparison | Entropy-based | Apache 2.0 |

### Agentik OS Secret Management

```
Secrets flow:

  1. User provides API key
  2. Encrypted at rest (AES-256-GCM)
  3. Stored in secure vault (never in event log)
  4. Injected at runtime (env vars, in-memory only)
  5. Skill sandbox has access ONLY to declared secrets
  6. Secret never appears in agent output (redacted)
  7. Rotation alerts when keys expire
```

### Pre-Install Skill Audit

Before ANY skill is installed:

```
agentik skill add some-skill
  → Download to quarantine
  → TruffleHog scan (embedded secrets?)
  → Semgrep scan (dangerous patterns?)
  → Permission analysis (what does it request?)
  → Network analysis (where does it connect?)
  → PASS → Install
  → FAIL → Block + report
```

---

## Layer 5: Container & Infrastructure Security

### Container Scanning

| Tool | Features | Speed | License |
|------|----------|-------|---------|
| **Trivy** | CVEs, secrets, IaC, SBOM | Fast | Apache 2.0 |
| **Grype** | CVEs, NVD integration | Fast | Apache 2.0 |
| **Docker Scout** | Docker-native, remediation | Medium | Proprietary |

### Cloud Scanning (for SaaS deployments)

| Tool | Clouds | Checks | License |
|------|--------|--------|---------|
| **Prowler** | AWS/Azure/GCP | 300+ | Apache 2.0 |
| **ScoutSuite** | AWS/Azure/GCP | Multi-cloud | GPL 2.0 |
| **CloudSploit** | AWS/Azure/GCP/OCI | 200+ | GPL 3.0 |

---

## Layer 6: Network Security

### Built-In Scanning (Pentester Tools)

Already installed on this VPS and available as Agentik OS integrations:

| Tool | Purpose | Integration |
|------|---------|------------|
| **Nmap** | Port scanning, service detection | `mcp:security/nmap` |
| **Nuclei** | Template-based vuln scanning | `mcp:security/nuclei` |
| **Nikto** | Web server scanning | `mcp:security/nikto` |
| **ffuf** | Web fuzzing | `mcp:security/ffuf` |
| **sqlmap** | SQL injection testing | `mcp:security/sqlmap` |
| **Masscan** | Fast port scanning | `mcp:security/masscan` |

### Security OS Mode

```yaml
# modes/security-os.yaml
name: Security OS
description: Penetration testing and security audit mode
personality: "I am a meticulous security auditor. I find vulnerabilities."

agents:
  - name: recon
    model: claude-sonnet
    skills: [nmap-scan, dns-enum, subdomain-finder]
    description: "Reconnaissance and information gathering"

  - name: vuln-scanner
    model: claude-sonnet
    skills: [nuclei-scan, nikto-scan, ssl-check]
    description: "Vulnerability scanning and assessment"

  - name: web-tester
    model: claude-opus
    skills: [xss-test, sqli-test, auth-bypass, ffuf-fuzz]
    description: "Web application penetration testing"

  - name: reporter
    model: claude-sonnet
    skills: [report-generator, cvss-scorer, remediation-advisor]
    description: "Generate security reports with remediation"

automations:
  - cron: "0 2 * * *"      # Nightly scan
    agent: vuln-scanner
    action: "Scan all exposed services"

  - cron: "0 6 * * 1"      # Weekly report
    agent: reporter
    action: "Generate weekly security posture report"

budget:
  daily_limit: $2.00
  model_preference: sonnet  # Cost-effective for scanning
```

---

## Layer 7: Web Application Security

### OWASP ZAP Integration

```
Security OS agent workflow:

  1. Passive scan (spider + observe)
  2. Active scan (inject payloads)
  3. API scan (OpenAPI spec)
  4. Report generation
  5. Auto-remediation suggestions

MCP Server: mcp:security/zap
  tools:
    - zap_spider(url)
    - zap_active_scan(url, policy)
    - zap_api_scan(openapi_spec)
    - zap_report(format)
    - zap_alerts(risk_level)
```

### Nuclei Template Engine

```
3,000+ community templates:

  nuclei -u https://target.com -t cves/          # Known CVEs
  nuclei -u https://target.com -t exposures/     # Exposed configs
  nuclei -u https://target.com -t misconfigs/    # Misconfigurations
  nuclei -u https://target.com -t default-logins/ # Default creds
```

---

## Security Dashboard (Cost X-Ray Extension)

```
+------------------------------------------+
| SECURITY DASHBOARD                       |
|------------------------------------------|
| POSTURE SCORE: 87/100  ████████░░  B+    |
|                                          |
| LAST SCAN: 2 hours ago                   |
|                                          |
| FINDINGS                                 |
| ● 0 Critical    ● 2 High                |
| ● 5 Medium      ● 12 Low                |
|                                          |
| SKILL AUDIT                              |
| 23 skills installed                      |
| 23 passed security audit   ✅            |
| 0 flagged                               |
|                                          |
| SECRETS                                  |
| 8 API keys stored (encrypted)           |
| 0 leaked in codebase        ✅           |
| 2 expiring in 30 days       ⚠️           |
|                                          |
| AGENT ACTIVITY (24h)                     |
| 847 actions logged                       |
| 0 permission violations     ✅           |
| 3 blocked by network policy ✅           |
+------------------------------------------+
```

---

## SBOM & Supply Chain

### Software Bill of Materials

Every Agentik OS installation generates an SBOM:

| Tool | Format | License |
|------|--------|---------|
| **Syft** | CycloneDX, SPDX | Apache 2.0 |

```bash
# Generate SBOM for Agentik OS
syft agentik-os:latest -o cyclonedx-json > sbom.json

# Scan SBOM for vulnerabilities
grype sbom:sbom.json
```

### Skill Supply Chain Security

```
Skill installation pipeline:

  1. Download from registry
  2. Verify signature (if signed)
  3. Generate SBOM (dependencies)
  4. Scan with Trivy (CVEs)
  5. Scan with TruffleHog (secrets)
  6. Scan with Semgrep (malicious patterns)
  7. Capability analysis (what permissions?)
  8. Sandbox test run
  9. User approval
  10. Install
```

---

## Existing Claude Code Security Skills

Already available in the ecosystem:

| Skill | Source | Focus |
|-------|--------|-------|
| **Trail of Bits** | github.com/trailofbits/skills | CodeQL, Semgrep, variant analysis |
| **Security Auditor** | skills.sh | Structured audits, remediation plans |
| **Awesome Security** | skills.sh | Pentesting payloads, expert agents |
| **SkillShield** | Service | Pre-install skill security scoring |
| **mcp-scan** (Snyk) | CLI | MCP server vulnerability scanning |

---

## Implementation Priority

### P0 -- Ship with MVP

| Component | Tool | Effort |
|-----------|------|--------|
| WASM sandbox | Extism | Medium |
| Secret encryption | AES-256-GCM | Low |
| Permission system | Capability-based | Medium |
| Audit log | Event sourcing (already built) | Free |
| Network policy | iptables per skill | Low |
| Prompt guard | LLM Guard | Low |

### P1 -- Month 2-3

| Component | Tool | Effort |
|-----------|------|--------|
| Pre-install skill audit | TruffleHog + Semgrep | Medium |
| Code scanning MCP servers | Semgrep, Bandit, npm audit | Medium |
| Security dashboard | Next.js component | Medium |
| Secret rotation alerts | Custom | Low |
| SBOM generation | Syft | Low |

### P2 -- Month 4-6

| Component | Tool | Effort |
|-----------|------|--------|
| Security OS mode | Full pentest toolkit | High |
| ZAP integration | OWASP ZAP MCP | Medium |
| Nuclei integration | Nuclei MCP | Medium |
| Container scanning | Trivy MCP | Medium |
| Cloud scanning | Prowler MCP | Medium |
| TEE multi-tenant | Intel TDX / AMD SEV-SNP | High |

### P3 -- Future

| Component | Tool | Effort |
|-----------|------|--------|
| P2P trust network | Cryptographic identity | High |
| Homomorphic encryption | Research only | Very High |
| Formal verification | TLA+ for agent protocols | High |

---

## Security vs OpenClaw

| Security Feature | OpenClaw | Agentik OS |
|-----------------|----------|-----------|
| Skill sandboxing | Basic process isolation | **WASM + gVisor + Kata** |
| Secret management | Environment variables | **Encrypted vault + rotation** |
| Prompt injection defense | None built-in | **LLM Guard (input + output)** |
| Supply chain audit | None | **TruffleHog + Semgrep pre-install** |
| Network isolation | None | **Per-skill iptables + allowlist** |
| Audit trail | Basic logs | **Immutable event-sourced log** |
| Security dashboard | None | **Real-time posture scoring** |
| Pentest toolkit | None | **Security OS mode (nmap, nuclei, zap)** |
| SBOM | None | **Auto-generated with Syft** |
| Known vulnerabilities | ClawHavoc (2025) | **Designed to prevent ClawHavoc-class attacks** |

---

*Created: 2026-02-13*
*Sources: CoSAI, OWASP, LLM Guard, Trivy, TruffleHog, Semgrep, Nuclei*
