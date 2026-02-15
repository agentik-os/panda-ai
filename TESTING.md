# 🧪 TESTING.md - Guide Complet de Tests

Guide complet pour tester Panda AI avant release/déploiement.

---

## 📋 Table des Matières

1. [Tests Pré-Requis](#tests-pré-requis)
2. [Tests Installation](#tests-installation)
3. [Tests CLI](#tests-cli)
4. [Tests Dashboard Web](#tests-dashboard-web)
5. [Tests Multi-Models](#tests-multi-models)
6. [Tests Skills](#tests-skills)
7. [Tests Performance](#tests-performance)
8. [Tests Sécurité](#tests-sécurité)
9. [Checklist Finale](#checklist-finale)

---

## Tests Pré-Requis

### 1. Environnement

```bash
# Node.js version
node --version
# Doit être >= v20.0.0

# pnpm version
pnpm --version
# Doit être >= 9.0.0

# Bun version (optionnel)
bun --version
# Doit être >= 1.0.0
```

**✅ PASS si:** Node 20+, pnpm 9+

---

## Tests Installation

### 2. Clone & Installation Propre

```bash
# Dans un dossier TEST séparé
mkdir -p /tmp/panda-test
cd /tmp/panda-test
git clone https://github.com/agentik-os/panda-ai.git
cd panda-ai

# Installer
pnpm install

# Vérifier qu'il n'y a pas d'erreurs
echo $?
# Doit afficher: 0
```

**✅ PASS si:** Installation sans erreurs, `node_modules/` créé

### 3. Build Tous les Packages

```bash
pnpm build
```

**Vérifier:**
- ✅ Aucune erreur TypeScript
- ✅ Message: "Tasks: 33 successful, 33 total"
- ✅ Temps < 3 minutes

```bash
# Type-check (doit afficher 0 erreurs)
pnpm type-check
```

**✅ PASS si:** 0 erreurs TypeScript, 33/33 packages compilés

---

## Tests CLI

### 4. Initialisation CLI

```bash
# Aller dans le package CLI
cd packages/cli

# Initialiser la config
pnpm exec panda init
```

**Vérifier:**
- ✅ Fichier créé: `~/.panda-ai/config.json`
- ✅ Pas d'erreur

### 5. Configuration API Keys

```bash
# Ajouter une clé Claude (exemple)
pnpm exec panda config set anthropic.apiKey "sk-ant-test123"

# Vérifier qu'elle est sauvegardée
pnpm exec panda config get anthropic.apiKey
```

**✅ PASS si:** La clé est bien affichée

### 6. Créer un Agent

```bash
# Créer un agent de test
pnpm exec panda agent create TestBot \
  --model claude-sonnet-4-5 \
  --channels cli

# Vérifier qu'il apparaît dans la liste
pnpm exec panda agent list
```

**✅ PASS si:** Agent "TestBot" apparaît dans la liste

### 7. Test Chat CLI

```bash
# Lancer un chat avec l'agent
pnpm exec panda chat TestBot
```

**Tester:**
1. Envoyer message: "Hello"
2. Vérifier réponse de l'agent
3. Envoyer: "exit" pour quitter

**✅ PASS si:** L'agent répond correctement

---

## Tests Dashboard Web

### 8. Lancer Convex Dev

```bash
# Terminal 1 - Backend Convex
cd packages/dashboard
npx convex dev
```

**Vérifier:**
- ✅ Message: "Dashboard URL: https://..."
- ✅ Pas d'erreur de connexion

### 9. Lancer Next.js Dev

```bash
# Terminal 2 - Frontend Next.js
cd packages/dashboard
pnpm dev
```

**Vérifier:**
- ✅ Server démarré sur `http://localhost:3000`
- ✅ Compilation réussie
- ✅ Pas d'erreur dans le terminal

### 10. Tests UI - Page d'Accueil

**Ouvrir:** http://localhost:3000

**Vérifier:**
- ✅ Page charge sans erreur
- ✅ Console browser: 0 erreurs JS
- ✅ Réseau: Toutes requêtes 200 OK
- ✅ Layout correct (header, sidebar, main)

### 11. Tests UI - Créer un Agent

1. Cliquer sur "New Agent" ou "Create Agent"
2. Remplir le formulaire:
   - Name: "DashboardBot"
   - Model: Claude Sonnet 4.5
   - Channel: Dashboard
3. Cliquer "Create"

**✅ PASS si:** Agent créé et apparaît dans la liste

### 12. Tests UI - Chat Dashboard

1. Cliquer sur l'agent "DashboardBot"
2. Envoyer message: "Hello, how are you?"
3. Attendre réponse

**✅ PASS si:** L'agent répond dans < 10s

### 13. Tests Responsive

**Tester 3 breakpoints:**

```bash
# Desktop: 1440px
# Tablet: 768px
# Mobile: 375px
```

**Vérifier sur chaque breakpoint:**
- ✅ Layout s'adapte correctement
- ✅ Texte lisible
- ✅ Boutons cliquables
- ✅ Pas de scroll horizontal

---

## Tests Multi-Models

### 14. Test Claude

```bash
cd packages/cli
pnpm exec panda agent create ClaudeTest \
  --model claude-sonnet-4-5 \
  --channels cli

pnpm exec panda chat ClaudeTest
# Message: "What is 2+2?"
```

**✅ PASS si:** Répond "4"

### 15. Test GPT (si clé configurée)

```bash
pnpm exec panda config set openai.apiKey "sk-..."

pnpm exec panda agent create GPTTest \
  --model gpt-4o \
  --channels cli

pnpm exec panda chat GPTTest
# Message: "What is 3+3?"
```

**✅ PASS si:** Répond "6"

### 16. Test Gemini (si clé configurée)

```bash
pnpm exec panda config set gemini.apiKey "..."

pnpm exec panda agent create GeminiTest \
  --model gemini-pro \
  --channels cli

pnpm exec panda chat GeminiTest
# Message: "What is 4+4?"
```

**✅ PASS si:** Répond "8"

### 17. Test Ollama Local (si installé)

```bash
# Vérifier qu'Ollama tourne
curl http://localhost:11434/api/tags

pnpm exec panda agent create OllamaTest \
  --model llama2 \
  --channels cli

pnpm exec panda chat OllamaTest
# Message: "What is 5+5?"
```

**✅ PASS si:** Répond "10"

---

## Tests Skills

### 18. Lister les Skills Disponibles

```bash
cd packages/cli
pnpm exec panda skill list
```

**✅ PASS si:** Affiche au moins 30 skills

### 19. Installer un Skill

```bash
# Installer le skill Slack (exemple)
pnpm exec panda skill install slack
```

**✅ PASS si:** Installation réussie, skill apparaît dans `~/.panda-ai/skills/`

### 20. Utiliser un Skill dans Chat

```bash
pnpm exec panda chat TestBot
# Message: "Use the slack skill to send a test message"
```

**✅ PASS si:** L'agent utilise le skill (peut échouer si pas configuré, mais doit tenter)

---

## Tests Performance

### 21. Test Latence Réponse

**Mesurer le temps de réponse:**

```bash
time pnpm exec panda chat TestBot --message "Hello"
```

**✅ PASS si:** Réponse en < 5 secondes

### 22. Test Charge Mémoire

**Pendant que le dashboard tourne:**

```bash
# Vérifier l'usage RAM
ps aux | grep node | grep -E "(convex|next)" | awk '{sum+=$6} END {print sum/1024 " MB"}'
```

**✅ PASS si:** < 500MB RAM total

### 23. Test Build Production

```bash
cd packages/dashboard
pnpm build
```

**Vérifier:**
- ✅ Build réussit sans erreur
- ✅ Dossier `.next/` créé
- ✅ Fichiers optimisés (< 1MB par chunk)

---

## Tests Sécurité

### 24. Test Injection XSS

**Dans le dashboard chat:**
1. Envoyer: `<script>alert('XSS')</script>`
2. Vérifier que le script n'est PAS exécuté

**✅ PASS si:** Le texte apparaît tel quel, pas d'alert()

### 25. Test API Keys Sécurisées

```bash
# Vérifier que les clés ne sont pas dans le code
grep -r "sk-ant-" packages/ --include="*.ts" --include="*.tsx" | grep -v "test" | wc -l
```

**✅ PASS si:** Résultat = 0 (aucune clé hardcodée)

### 26. Test Variables d'Environnement

```bash
# Vérifier que .env est dans .gitignore
grep ".env" .gitignore
```

**✅ PASS si:** `.env` et `.env.local` sont dans .gitignore

---

## Tests E2E Automatisés (Optionnel)

### 27. Playwright E2E

```bash
# Si tests E2E existent
pnpm test:e2e
```

**✅ PASS si:** Tous les tests passent

---

## Checklist Finale

### Build & Type-Check

- [ ] `pnpm install` → 0 erreurs
- [ ] `pnpm build` → 33/33 packages OK
- [ ] `pnpm type-check` → 0 erreurs TypeScript
- [ ] `pnpm lint` → 0 erreurs critiques

### CLI

- [ ] `panda init` → Config créée
- [ ] `panda config set` → Clés sauvegardées
- [ ] `panda agent create` → Agent créé
- [ ] `panda chat` → Chat fonctionne
- [ ] `panda skill list` → 30+ skills affichés

### Dashboard

- [ ] Convex dev → Connecté
- [ ] Next.js dev → Server démarré
- [ ] UI charge → 0 erreurs console
- [ ] Créer agent → Succès
- [ ] Chat → Réponses < 10s
- [ ] Responsive → 3 breakpoints OK

### Multi-Models

- [ ] Claude → Répond correctement
- [ ] GPT → Répond correctement (si configuré)
- [ ] Gemini → Répond correctement (si configuré)
- [ ] Ollama → Répond correctement (si installé)

### Sécurité

- [ ] XSS → Pas d'exécution de script
- [ ] API Keys → Pas hardcodées
- [ ] .env → Dans .gitignore

### Performance

- [ ] Réponse chat < 5s
- [ ] RAM usage < 500MB
- [ ] Build prod → Chunks < 1MB

---

## Rapport de Test

Après avoir complété tous les tests, remplir ce rapport:

```
# RAPPORT DE TEST PANDA AI

Date: [DATE]
Version: 1.0.0
Testeur: [NOM]

## Résultats

| Catégorie | Tests Passés | Tests Échoués | Status |
|-----------|--------------|---------------|--------|
| Installation | X/3 | 0 | ✅ |
| CLI | X/7 | 0 | ✅ |
| Dashboard | X/6 | 0 | ✅ |
| Multi-Models | X/4 | 0 | ✅ |
| Skills | X/3 | 0 | ✅ |
| Performance | X/3 | 0 | ✅ |
| Sécurité | X/3 | 0 | ✅ |

## Verdict Final

✅ GO / ❌ NO-GO

## Notes

[Ajouter notes ici]
```

---

## Troubleshooting

### Erreur: "pnpm: command not found"

```bash
npm install -g pnpm
```

### Erreur: Build TypeScript échoue

```bash
# Clean et rebuild
pnpm clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### Erreur: Convex ne connecte pas

```bash
# Vérifier la connexion internet
# Re-login Convex
cd packages/dashboard
npx convex dev
# Suivre les instructions
```

### Dashboard: Console errors

1. Ouvrir DevTools (F12)
2. Aller dans l'onglet Console
3. Noter les erreurs
4. Vérifier que les API keys sont configurées

---

**Temps Total de Test Complet:** ~45 minutes

**Temps Minimal (Tests Critiques):** ~15 minutes
- Installation (3 tests)
- Build (1 test)
- CLI Chat (1 test)
- Dashboard UI (3 tests)

---

*Dernière mise à jour: 2026-02-15*
