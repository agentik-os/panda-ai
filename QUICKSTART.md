# 🚀 Quick Start - Panda AI

Guide complet pour installer et utiliser Panda AI en 15 minutes.

---

## ⚡ Installation Ultra-Rapide (3 commandes)

```bash
# 1. Cloner
git clone https://github.com/agentik-os/panda-ai.git
cd panda-ai

# 2. Installer
pnpm install

# 3. Build
pnpm build
```

**C'est tout!** 🎉

---

## 📋 Prérequis

### 1. Node.js 20+

```bash
# Vérifier la version
node --version  # Doit être >= v20.0.0

# Si besoin, installer:
# Télécharger depuis: https://nodejs.org/
# Ou avec nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### 2. pnpm 9+

```bash
# Installer pnpm
npm install -g pnpm

# Vérifier
pnpm --version  # Doit être >= 9.0.0
```

### 3. API Key (au moins 1)

Tu as besoin d'au moins **UNE** clé API:

| Provider                | Où l'obtenir                                            | Prix             |
| ----------------------- | ------------------------------------------------------- | ---------------- |
| **Claude** (recommandé) | [console.anthropic.com](https://console.anthropic.com/) | $3/M tokens      |
| **OpenAI**              | [platform.openai.com](https://platform.openai.com/)     | $5/M tokens      |
| **Gemini**              | [ai.google.dev](https://ai.google.dev/)                 | Gratuit (limité) |

---

## 🎯 Installation Complète

### Étape 1: Cloner le Repo

```bash
git clone https://github.com/agentik-os/panda-ai.git
cd panda-ai
```

### Étape 2: Installer les Dépendances

```bash
pnpm install
```

**Durée:** 3-5 minutes
**Taille:** ~500MB de node_modules

### Étape 3: Build All Packages

```bash
pnpm build
```

**Durée:** 2-3 minutes
**Ce qui est compilé:** 33 packages TypeScript → JavaScript

### Étape 4: Vérifier l'Installation

```bash
# Type-check (doit afficher 0 erreurs)
pnpm type-check

# Output attendu:
# ✓ Tasks: 33 successful, 33 total
# ✓ Time: < 1s >>> FULL TURBO
```

---

## ⚙️ Configuration

### Option 1: Via CLI (Recommandé)

```bash
# Initialiser la config
pnpm --filter @agentik-os/cli exec panda init

# Ajouter ta clé API Claude
pnpm --filter @agentik-os/cli exec panda config set anthropic.apiKey "sk-ant-..."

# Ou OpenAI
pnpm --filter @agentik-os/cli exec panda config set openai.apiKey "sk-..."
```

### Option 2: Fichier .env (Alternatif)

Créer `.env.local` à la racine:

```bash
cat > .env.local << 'EOF'
# Provider principal
ANTHROPIC_API_KEY=sk-ant-...

# Optionnel
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
EOF
```

---

## 🎮 Premier Usage - CLI

### Créer ton Premier Agent

```bash
# Créer un agent nommé "Demo"
pnpm --filter @agentik-os/cli exec panda agent create Demo \
  --model claude-sonnet-4-5 \
  --channels cli
```

### Commencer à Chatter

```bash
pnpm --filter @agentik-os/cli exec panda chat Demo
```

**Exemple de conversation:**

```
> User: Hello! What can you do?
> Demo: Hi! I'm your AI assistant. I can help you with:
        - Coding tasks (TypeScript, Python, etc.)
        - Research and analysis
        - Writing and content creation
        - Problem-solving
        - And much more! What do you need help with?

> User: Write a function to calculate fibonacci
> Demo: [Écrit le code complet avec explications]

> User: exit
Goodbye!
```

---

## 🌐 Dashboard Web (Interface Graphique)

### Lancer le Dashboard

**Terminal 1 - Backend Convex:**

```bash
cd packages/dashboard
npx convex dev
```

**Terminal 2 - Frontend Next.js:**

```bash
cd packages/dashboard
pnpm dev
```

**Ouvrir dans le navigateur:**

```
http://localhost:3000
```

### Ce que tu verras:

- 🎨 Interface Next.js moderne
- 💬 Chat avec tes agents
- 📊 Statistiques de coût
- 🧠 Historique de mémoire
- ⚙️ Paramètres et configuration
- 🛍️ Marketplace de skills

---

## 🔧 Commandes Utiles

### Build & Test

```bash
# Build tous les packages
pnpm build

# Type-check (0 erreurs requis)
pnpm type-check

# Tests
pnpm test

# Tests E2E
pnpm test:e2e

# Lint & format
pnpm lint
pnpm format
```

### Dev

```bash
# Lancer tous les dev servers
pnpm dev

# Dev d'un package spécifique
pnpm --filter @agentik-os/cli dev
pnpm --filter @agentik-os/dashboard dev
pnpm --filter @agentik-os/runtime dev
```

### Clean

```bash
# Nettoyer les builds
pnpm clean

# Réinstaller complètement
pnpm clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

---

## 🎯 Cas d'Usage Typiques

### 1. Assistant de Code

```bash
pnpm --filter @agentik-os/cli exec panda agent create CodeHelper \
  --model claude-sonnet-4-5 \
  --channels cli

pnpm --filter @agentik-os/cli exec panda chat CodeHelper
```

```
> User: Review this React component for bugs
> CodeHelper: [Analyse détaillée + suggestions]
```

### 2. Recherche & Analyse

```bash
pnpm --filter @agentik-os/cli exec panda agent create Researcher \
  --model claude-sonnet-4-5 \
  --channels cli

# Avec MCP tools activés
pnpm --filter @agentik-os/cli exec panda chat Researcher
```

```
> User: Research the latest trends in AI
> Researcher: [Recherche + sources + analyse]
```

### 3. Multi-Model Consensus

```bash
# Créer un agent qui utilise plusieurs modèles
pnpm --filter @agentik-os/cli exec panda agent create MultiAI \
  --model claude-sonnet-4-5,gpt-4,gemini-pro \
  --channels cli
```

```
> User: Should I use React or Vue for my project?
> MultiAI: [3 modèles votent, consensus présenté]
```

---

## 📦 Skills Disponibles (30+)

Les skills sont des intégrations pré-construites:

### Communication

- `slack` - Envoyer des messages Slack
- `discord` - Bot Discord
- `email` - Envoyer des emails
- `twilio` - SMS via Twilio

### Développement

- `github` - API GitHub
- `linear` - Gestion de projets
- `jira` - Tickets Jira
- `e2b` - Exécution de code

### Business

- `stripe` - Paiements
- `hubspot` - CRM
- `salesforce` - CRM

### Productivité

- `notion` - Base de données
- `airtable` - Tableurs
- `google-drive` - Stockage
- `google-calendar` - Calendrier

### Utiliser un Skill

```bash
# Installer un skill
pnpm --filter @agentik-os/cli exec panda skill install slack

# L'utiliser dans un agent
pnpm --filter @agentik-os/cli exec panda chat MyAgent
> User: Send a message to #general on Slack: "Hello team!"
> MyAgent: [Envoie le message via le skill Slack]
```

---

## 🔍 Troubleshooting

### Erreur: "pnpm: command not found"

```bash
npm install -g pnpm
```

### Erreur: "Node version too old"

```bash
nvm install 20
nvm use 20
```

### Erreur: "Build failed"

```bash
# Clean install
pnpm clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### Erreur: "Type check errors"

```bash
pnpm type-check

# Si des erreurs persistent:
# 1. Vérifier Node >= 20
node --version

# 2. Vérifier pnpm >= 9
pnpm --version

# 3. Réinstaller
pnpm install
```

### Dashboard ne se lance pas

```bash
# Vérifier que Convex est démarré
cd packages/dashboard
npx convex dev

# Dans un autre terminal
cd packages/dashboard
pnpm dev
```

### API Key non reconnue

```bash
# Vérifier la config
pnpm --filter @agentik-os/cli exec panda config get anthropic.apiKey

# Re-configurer si nécessaire
pnpm --filter @agentik-os/cli exec panda config set anthropic.apiKey "sk-ant-..."
```

---

## 📚 Prochaines Étapes

### Après l'Installation

1. **Lire la doc complète:** [README.md](README.md)
2. **Essayer les exemples:** `docs/examples/`
3. **Explorer les skills:** `skills/`
4. **Créer ton propre skill:** `docs/api/sdk.md`

### Pour Contribuer

1. Fork le repo
2. Créer une branche: `git checkout -b feature/ma-feature`
3. Développer avec: `pnpm dev`
4. Tester avec: `pnpm test`
5. Commit: `git commit -m "Add amazing feature"`
6. Push: `git push origin feature/ma-feature`
7. Ouvrir une Pull Request

---

## 💡 Conseils

### Performance

- **Cache Turbo:** Après le premier build, les suivants sont instantanés
- **Parallel Builds:** Turborepo compile tous les packages en parallèle
- **Type-check rapide:** Utilise le cache TypeScript

### Développement

- **Hot Reload:** Next.js dashboard recharge automatiquement
- **CLI Watch:** Modifications CLI prises en compte en temps réel
- **Tests Watch:** `pnpm test --watch`

### Production

```bash
# Build production
pnpm build

# Vérifier avant deploy
pnpm type-check
pnpm test
pnpm lint

# Deploy (Vercel recommandé)
vercel deploy --prod
```

---

## 🆘 Besoin d'Aide?

- **Issues:** [github.com/agentik-os/panda-ai/issues](https://github.com/agentik-os/panda-ai/issues)
- **Discussions:** [github.com/agentik-os/panda-ai/discussions](https://github.com/agentik-os/panda-ai/discussions)
- **Docs complètes:** [docs/](docs/)

---

## ⏱️ Résumé du Temps

| Étape                  | Durée           |
| ---------------------- | --------------- |
| Installer Node + pnpm  | 2-5 min         |
| Cloner le repo         | 30 sec          |
| `pnpm install`         | 3-5 min         |
| `pnpm build`           | 2-3 min         |
| Config + premier agent | 2 min           |
| **TOTAL**              | **~15 minutes** |

---

**Tu es prêt! 🚀**

Commence avec:

```bash
pnpm --filter @agentik-os/cli exec panda chat Demo
```

Et amuse-toi bien! 🐼
