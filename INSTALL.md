# Installation Guide - Panda AI

Simple step-by-step installation guide.

---

## Prerequisites

1. **Node.js 20+**
   ```bash
   # Check version
   node --version  # Should be >= 20.0.0

   # If you need to install/update:
   # Download from: https://nodejs.org/
   # Or use nvm: nvm install 20
   ```

2. **pnpm 9+**
   ```bash
   # Install pnpm globally
   npm install -g pnpm

   # Check version
   pnpm --version  # Should be >= 9.0.0
   ```

3. **API Keys**

   You need at least ONE of these:
   - **Claude:** Get from [console.anthropic.com](https://console.anthropic.com/)
   - **OpenAI:** Get from [platform.openai.com](https://platform.openai.com/)
   - **Gemini:** Get from [ai.google.dev](https://ai.google.dev/)

---

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/agentik-os/panda-ai.git
cd panda-ai
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all dependencies for all packages (~5-10 minutes first time).

### 3. Build All Packages

```bash
pnpm build
```

This compiles all TypeScript to JavaScript (~2-3 minutes).

### 4. Verify Installation

```bash
# Type check (must show 0 errors)
pnpm type-check

# Run tests
pnpm test
```

**Expected output:**
```
✓ Tasks: 33 successful, 33 total
✓ Time: < 1s >>> FULL TURBO
```

---

## Configuration

### Initialize Panda AI

```bash
pnpm --filter @agentik-os/cli exec panda init
```

This creates a config file at `~/.panda-ai/config.json`.

### Add Your API Key

```bash
# For Claude
pnpm --filter @agentik-os/cli exec panda config set anthropic.apiKey "sk-ant-..."

# For OpenAI
pnpm --filter @agentik-os/cli exec panda config set openai.apiKey "sk-..."

# For Gemini
pnpm --filter @agentik-os/cli exec panda config set gemini.apiKey "..."
```

---

## First Usage

### Option 1: CLI

```bash
# Create your first agent
pnpm --filter @agentik-os/cli exec panda agent create Demo \
  --model claude-sonnet-4-5 \
  --channels cli

# Start chatting
pnpm --filter @agentik-os/cli exec panda chat Demo

> User: Hello!
> Demo: Hi! I'm your AI assistant. How can I help you today?
```

### Option 2: Web Dashboard

```bash
# Terminal 1: Start backend
cd packages/dashboard
npx convex dev

# Terminal 2: Start frontend (new terminal window)
cd packages/dashboard
pnpm dev
```

Then open: **http://localhost:3000**

---

## Troubleshooting

### "pnpm: command not found"

```bash
npm install -g pnpm
```

### "Node version too old"

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node 20
nvm install 20
nvm use 20
```

### "Build failed"

```bash
# Clean and reinstall
pnpm clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### "Type check errors"

```bash
# Should show 0 errors
pnpm type-check

# If errors persist, check:
# 1. Node version >= 20
# 2. pnpm version >= 9
# 3. All dependencies installed: pnpm install
```

---

## What Gets Installed

```
panda-ai/
├── node_modules/        # Dependencies (~500MB)
├── packages/
│   ├── runtime/dist/    # Compiled runtime
│   ├── cli/dist/        # Compiled CLI
│   ├── dashboard/       # Next.js app
│   └── ...
└── .turbo/              # Turbo cache
```

**Total disk space:** ~1-2GB after build

---

## Next Steps

1. ✅ Read the [README.md](README.md) for features
2. ✅ Explore available skills in `skills/`
3. ✅ Check out example agents in `packages/agents/`
4. ✅ Join the community discussions

---

## Quick Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm build` | Build all packages |
| `pnpm type-check` | Verify TypeScript |
| `pnpm test` | Run tests |
| `pnpm dev` | Start dev servers |
| `pnpm clean` | Clean build artifacts |

---

**Need help?** Open an issue on GitHub!
