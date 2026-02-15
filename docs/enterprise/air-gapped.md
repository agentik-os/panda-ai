# Air-Gapped Deployment Guide

> **High-Security Enterprise Deployment**
> **Use Case:** Government, defense, highly regulated industries
> **Security Level:** Maximum (no internet connectivity)

---

## Overview

Air-gapped deployment of Agentik OS enables operation in completely isolated environments without internet connectivity. This guide covers:
- Prerequisites & planning
- Offline installation
- Local AI model hosting (Ollama)
- Update management
- Monitoring & troubleshooting

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Air-Gapped Network (Isolated)            │
│                                                   │
│  ┌──────────────┐    ┌──────────────┐           │
│  │  Agentik OS  │───▶│   Ollama     │           │
│  │   Runtime    │    │  (Local AI)  │           │
│  └──────────────┘    └──────────────┘           │
│          │                                        │
│  ┌───────▼──────────────┐                       │
│  │  Convex DB (Local)    │                       │
│  │  PostgreSQL (Alt)     │                       │
│  └───────────────────────┘                       │
│                                                   │
│  ┌────────────────────────────────────────┐     │
│  │  Dashboard (Web UI)                     │     │
│  └────────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
           │
           │ (Sneakernet - Physical media only)
           │
   ┌───────▼────────┐
   │  External      │
   │  Workstation   │
   │  (Updates)     │
   └────────────────┘
```

**Key Differences from Internet-Connected Deployment:**
- No external API calls (Anthropic, OpenAI blocked)
- All AI models run locally via Ollama
- Convex DB runs locally (not cloud-hosted)
- Updates delivered via physical media (USB drives)
- No telemetry or analytics

---

## Prerequisites

### Hardware Requirements

**Minimum (Small Team, <10 users):**
- **CPU:** 16 cores (Intel Xeon, AMD EPYC)
- **RAM:** 64GB
- **GPU:** NVIDIA RTX 4090 (24GB VRAM) or equivalent
- **Storage:** 2TB NVMe SSD
- **Network:** 10Gbps internal (air-gapped)

**Recommended (Medium Team, <50 users):**
- **CPU:** 32+ cores
- **RAM:** 128GB+
- **GPU:** 2x NVIDIA A100 (80GB VRAM each)
- **Storage:** 4TB NVMe SSD (RAID 1)
- **Network:** 25Gbps internal

**Enterprise (Large Team, 100+ users):**
- **CPU:** 64+ cores (multi-node cluster)
- **RAM:** 256GB+ per node
- **GPU:** 4x NVIDIA H100 (80GB VRAM each)
- **Storage:** 10TB+ NVMe SSD (RAID 10)
- **Network:** 100Gbps internal

### Software Requirements

**Operating System:**
- Ubuntu 22.04 LTS (recommended)
- Red Hat Enterprise Linux 9
- Rocky Linux 9

**Container Runtime:**
- Docker 24.0+ or Podman 4.5+
- Kubernetes 1.27+ (for multi-node)

**GPU Drivers:**
- NVIDIA Driver 535+ (for Ollama)
- CUDA 12.2+

---

## Installation Steps

### Phase 1: Prepare External Workstation

**Step 1: Download Artifacts (on internet-connected machine)**

```bash
# Create download directory
mkdir -p agentik-airgap
cd agentik-airgap

# Download Agentik OS container images
docker pull ghcr.io/agentik-os/runtime:1.0.0
docker pull ghcr.io/agentik-os/dashboard:1.0.0
docker pull ghcr.io/agentik-os/convex-local:1.0.0

# Save images as tar archives
docker save ghcr.io/agentik-os/runtime:1.0.0 -o runtime.tar
docker save ghcr.io/agentik-os/dashboard:1.0.0 -o dashboard.tar
docker save ghcr.io/agentik-os/convex-local:1.0.0 -o convex-local.tar

# Download Ollama models
# Note: Models are 4GB-70GB each!
curl -o llama-3.2-70b.tar https://ollama.ai/library/llama3.2:70b
curl -o codellama-34b.tar https://ollama.ai/library/codellama:34b
curl -o mistral-7b.tar https://ollama.ai/library/mistral:7b

# Download Ollama server
curl -o ollama-linux-amd64 https://ollama.ai/download/ollama-linux-amd64
chmod +x ollama-linux-amd64

# Download configuration files
curl -o docker-compose.airgap.yml \
  https://raw.githubusercontent.com/agentik-os/agentik-os/main/docker/docker-compose.airgap.yml

curl -o .env.airgap.example \
  https://raw.githubusercontent.com/agentik-os/agentik-os/main/.env.airgap.example
```

**Step 2: Transfer to Air-Gapped Environment**

```bash
# Verify checksums
sha256sum *.tar > checksums.txt

# Copy to USB drive (or burn to DVD for maximum security)
cp -r agentik-airgap /media/usb-drive/

# Physically transfer USB drive to air-gapped environment
```

---

### Phase 2: Install on Air-Gapped Server

**Step 1: Load Container Images**

```bash
# On air-gapped server
cd /media/usb-drive/agentik-airgap

# Verify checksums
sha256sum -c checksums.txt

# Load images
docker load -i runtime.tar
docker load -i dashboard.tar
docker load -i convex-local.tar
```

**Step 2: Install Ollama**

```bash
# Copy Ollama binary
cp ollama-linux-amd64 /usr/local/bin/ollama

# Install as systemd service
cat > /etc/systemd/system/ollama.service <<EOF
[Unit]
Description=Ollama Local AI Server
After=network.target

[Service]
Type=simple
User=ollama
Group=ollama
ExecStart=/usr/local/bin/ollama serve
Restart=on-failure
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_MODELS=/var/lib/ollama/models"

[Install]
WantedBy=multi-user.target
EOF

# Create ollama user
useradd -r -s /bin/false -d /var/lib/ollama ollama

# Create models directory
mkdir -p /var/lib/ollama/models
chown -R ollama:ollama /var/lib/ollama

# Start Ollama
systemctl enable ollama
systemctl start ollama
```

**Step 3: Load AI Models**

```bash
# Import models
tar -xf llama-3.2-70b.tar -C /var/lib/ollama/models/
tar -xf codellama-34b.tar -C /var/lib/ollama/models/
tar -xf mistral-7b.tar -C /var/lib/ollama/models/

# Verify models loaded
curl http://localhost:11434/api/tags
```

**Step 4: Configure Agentik OS**

```bash
# Copy environment file
cp .env.airgap.example .env

# Edit configuration
nano .env
```

**Air-Gapped Configuration:**
```env
# Air-Gapped Mode
AIRGAP_MODE=true
TELEMETRY_ENABLED=false
EXTERNAL_API_BLOCKED=true

# Local Ollama Configuration
OLLAMA_ENABLED=true
OLLAMA_HOST=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama3.2:70b

# Disable Cloud AI Providers
ANTHROPIC_ENABLED=false
OPENAI_ENABLED=false
GOOGLE_AI_ENABLED=false

# Local Convex Database
CONVEX_MODE=local
CONVEX_DATA_DIR=/var/lib/agentik/convex
CONVEX_PORT=3100

# Or use PostgreSQL
# DATABASE_URL=postgresql://agentik:password@localhost:5432/agentik

# Dashboard Configuration
DASHBOARD_PORT=3001
DASHBOARD_SECRET=<generate-random-secret>

# Security
SESSION_SECURE=true
HTTPS_ONLY=true
CSP_ENABLED=true
```

**Step 5: Deploy**

```bash
# Start services
docker-compose -f docker-compose.airgap.yml up -d

# Verify all services running
docker-compose ps

# Expected output:
# NAME                    STATUS   PORTS
# agentik-runtime         Up       0.0.0.0:3000->3000/tcp
# agentik-dashboard       Up       0.0.0.0:3001->3001/tcp
# agentik-convex-local    Up       3100/tcp
```

**Step 6: Initial Setup**

```bash
# Create first admin user
docker exec -it agentik-runtime panda user create \
  --email admin@yourcompany.local \
  --role admin \
  --password <secure-password>

# Access dashboard
# https://<server-ip>:3001
```

---

## Model Selection for Air-Gap

### Recommended Models by Use Case

| Use Case | Model | Size | VRAM | Performance |
|----------|-------|------|------|-------------|
| **General Chat** | Llama 3.2 70B | 40GB | 48GB | Best |
| **Code Generation** | CodeLlama 34B | 20GB | 24GB | Excellent |
| **Fast Responses** | Mistral 7B | 4GB | 8GB | Good |
| **Lightweight** | Phi-3 Mini | 2GB | 4GB | Acceptable |

### Model Performance Expectations

**Llama 3.2 70B (Recommended):**
- Response time: 2-5 seconds (on A100 80GB)
- Quality: Comparable to Claude Sonnet
- Use for: Complex reasoning, long conversations

**CodeLlama 34B:**
- Response time: 1-3 seconds
- Quality: Excellent for code tasks
- Use for: Code generation, debugging, refactoring

**Mistral 7B (Fallback):**
- Response time: <1 second
- Quality: Good for simple queries
- Use for: Quick responses, high concurrency

---

## Networking & Security

### Firewall Configuration

```bash
# Only allow internal network access
ufw default deny incoming
ufw default deny outgoing  # Block all internet!
ufw allow from 10.0.0.0/8 to any port 3001  # Dashboard
ufw allow from 10.0.0.0/8 to any port 3000  # API
ufw enable
```

### HTTPS Configuration

**Generate Self-Signed Certificate (for internal use):**
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
  -keyout /etc/ssl/private/agentik.key \
  -out /etc/ssl/certs/agentik.crt \
  -subj "/CN=agentik.yourcompany.local"
```

**Configure Nginx:**
```nginx
server {
  listen 443 ssl http2;
  server_name agentik.yourcompany.local;

  ssl_certificate /etc/ssl/certs/agentik.crt;
  ssl_certificate_key /etc/ssl/private/agentik.key;

  location / {
    proxy_pass http://localhost:3001;
  }
}
```

---

## Update Management

### Preparing Updates (External Workstation)

```bash
# Download new version
docker pull ghcr.io/agentik-os/runtime:1.1.0
docker save ghcr.io/agentik-os/runtime:1.1.0 -o runtime-1.1.0.tar

# Download changelog
curl -o CHANGELOG-1.1.0.md \
  https://raw.githubusercontent.com/agentik-os/agentik-os/v1.1.0/CHANGELOG.md

# Create update package
tar -czf agentik-update-1.1.0.tar.gz \
  runtime-1.1.0.tar \
  CHANGELOG-1.1.0.md \
  update-script.sh

# Transfer to USB drive
```

### Applying Updates (Air-Gapped Server)

```bash
# Extract update package
tar -xzf /media/usb-drive/agentik-update-1.1.0.tar.gz

# Review changelog
cat CHANGELOG-1.1.0.md

# Load new images
docker load -i runtime-1.1.0.tar

# Backup current data
docker exec agentik-convex-local /backup.sh /backups/pre-update-1.1.0

# Apply update
docker-compose down
docker-compose -f docker-compose.airgap.yml up -d

# Verify
docker-compose ps
curl https://localhost:3001/health
```

---

## Monitoring

### Health Checks

```bash
# Check all services
docker-compose ps

# Check Ollama
curl http://localhost:11434/api/tags

# Check API
curl https://localhost:3001/health

# Check disk space (models are large!)
df -h /var/lib/ollama
df -h /var/lib/agentik
```

### Resource Monitoring

```bash
# GPU usage (NVIDIA)
nvidia-smi -l 1

# CPU/RAM
htop

# Docker stats
docker stats
```

---

## Troubleshooting

### Issue: Out of GPU Memory

```
Error: CUDA out of memory
```

**Solutions:**
1. Use smaller model (Mistral 7B instead of Llama 70B)
2. Reduce concurrent users
3. Add more GPUs
4. Enable model quantization:
   ```bash
   # Use quantized model (4-bit)
   ollama pull llama3.2:70b-q4_0
   ```

### Issue: Slow Response Times

**Causes:**
- Insufficient GPU power
- Model too large for VRAM
- Too many concurrent requests

**Solutions:**
1. Upgrade GPU (A100 → H100)
2. Add more GPUs for parallel processing
3. Implement request queuing
4. Use faster model for simple queries

### Issue: Disk Space Running Out

**Causes:**
- Large AI models (70GB each)
- Conversation logs
- Snapshots (Time Travel Debug)

**Solutions:**
1. Remove unused models
2. Configure log rotation
3. Archive old conversations
4. Add more storage

---

## Compliance & Audit

### Audit Logging

All actions logged locally:
```bash
# View audit logs
docker exec agentik-runtime tail -f /var/log/agentik/audit.log
```

**Log Retention:**
- 365 days default (configurable)
- Stored in: `/var/lib/agentik/logs/audit/`

### Compliance Reports

```bash
# Generate compliance report
docker exec agentik-runtime panda compliance report \
  --start-date 2026-01-01 \
  --end-date 2026-12-31 \
  --output /reports/compliance-2026.pdf
```

---

## Backup & Recovery

### Backup Procedure

```bash
# Backup script
#!/bin/bash
BACKUP_DIR=/backups/agentik-$(date +%Y%m%d)
mkdir -p $BACKUP_DIR

# Backup Convex database
docker exec agentik-convex-local /backup.sh $BACKUP_DIR/convex

# Backup configuration
cp -r /etc/agentik $BACKUP_DIR/config

# Backup logs
cp -r /var/log/agentik $BACKUP_DIR/logs

# Create archive
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
```

### Recovery Procedure

```bash
# Extract backup
tar -xzf agentik-20260214.tar.gz

# Restore Convex database
docker exec agentik-convex-local /restore.sh /backups/agentik-20260214/convex

# Restore configuration
cp -r /backups/agentik-20260214/config/* /etc/agentik/

# Restart services
docker-compose restart
```

---

## Performance Benchmarks

### Expected Performance (Llama 3.2 70B on A100 80GB)

| Metric | Value |
|--------|-------|
| **Tokens/second** | 20-30 |
| **Response time (simple)** | 2-3s |
| **Response time (complex)** | 5-10s |
| **Concurrent users** | 10-15 |
| **Daily messages** | ~5,000 |

### Scaling Recommendations

| Users | GPUs | Model |
|-------|------|-------|
| 1-10 | 1x A100 | Llama 70B |
| 10-50 | 2x A100 | Llama 70B |
| 50-100 | 4x A100 | Llama 70B |
| 100-500 | 8x H100 | Llama 70B + Mistral |
| 500+ | Multi-node cluster | Model routing |

---

## Support

**Air-Gapped Deployment Support:** enterprise@agentik-os.dev
**Government/Defense Inquiries:** gov@agentik-os.dev
**Custom Hardware Sizing:** Contact sales team

---

**Last Updated:** 2026-02-14
**Version:** 1.0 (Draft - awaiting full air-gap testing)
**Security Classification:** For authorized personnel only
