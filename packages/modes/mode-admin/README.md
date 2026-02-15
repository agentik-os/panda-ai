# Admin Mode

**System administration and DevOps assistant**

## Overview

Admin Mode provides specialized assistance for system administration, infrastructure management, and DevOps operations. It includes agents optimized for server management and security hardening.

## Features

- **Server Management**: Linux, Windows server administration
- **Cloud Infrastructure**: AWS, GCP, Azure deployment and management
- **CI/CD Pipelines**: GitHub Actions, GitLab CI, Jenkins
- **Security Hardening**: Configuration, access control, vulnerability scanning
- **Monitoring & Alerting**: Prometheus, Grafana, DataDog, PagerDuty
- **Backup & Disaster Recovery**: Automated backups, recovery plans

## Agents

### SysAdmin
- **Role**: Manages servers, deployment, monitoring, incident response
- **Model**: Claude Sonnet 4.5
- **Skills**: file-operations, web-search

### Security Engineer
- **Role**: Hardens systems, manages access control, vulnerability scanning
- **Model**: Claude Sonnet 4.5
- **Skills**: web-search, file-operations

## Recommended Skills

- `file-operations` - Server configuration management
- `web-search` - Documentation and troubleshooting

## Example Workflows

### Deploy New Server (2-4 hours)
1. **Provision**: Cloud instance, networking, firewall
2. **Secure**: SSH keys, fail2ban, firewall rules
3. **Configure**: Software stack, services, monitoring
4. **Harden**: Security updates, minimal packages, least privilege
5. **Backup**: Automated backup schedule
6. **Monitor**: Alerts, dashboards, health checks

### Incident Response (1-6 hours)
1. **Alert**: Notification received, severity assessment
2. **Investigate**: Logs, metrics, root cause analysis
3. **Mitigate**: Quick fix to restore service
4. **Communicate**: Status updates to stakeholders
5. **Resolve**: Permanent fix, testing
6. **Postmortem**: Document incident, prevent recurrence

### Security Audit (1-2 days)
1. **Inventory**: All systems, services, access points
2. **Vulnerability Scan**: Automated tools (Nessus, OpenVAS)
3. **Access Review**: User permissions, SSH keys, API keys
4. **Configuration Review**: Firewall, SSL/TLS, patches
5. **Compliance Check**: SOC2, HIPAA, GDPR requirements
6. **Report**: Findings, prioritized remediation plan

## Best Practices

- **Infrastructure as Code**: Terraform, CloudFormation
- **Least Privilege Access**: Minimal permissions, MFA
- **Automated Backups**: Tested recovery procedures
- **Health Monitoring**: Proactive alerts
- **Incident Response Plans**: Documented runbooks

## Configuration

- **Temperature**: 0.3 (precise, no mistakes)
- **Max Tokens**: 4096

## Usage

```typescript
import { adminModeConfig, ADMIN_MODE_SYSTEM_PROMPT, ADMIN_MODE_AGENTS } from '@agentik-os/mode-admin';

// Use in your agent runtime
const agent = new Agent({
  mode: adminModeConfig,
  systemPrompt: ADMIN_MODE_SYSTEM_PROMPT,
});
```
