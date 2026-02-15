# FORGE BUILD PROMPT - Agentik OS

**CRITICAL INSTRUCTION:** Ce prompt contient l'ESSENCE COMPLÈTE du projet Agentik OS. Chaque document mentionné ici doit être lu INTÉGRALEMENT, ligne par ligne, sans exception.

**⏱️ Temps de lecture estimé:** 2-3 heures
**📊 Volume total:** ~750KB de documentation
**🎯 Objectif:** Comprendre PARFAITEMENT le projet avant d'écrire UNE SEULE ligne de code

---

## 📋 DOCUMENTATION COMPLÈTE (32 documents)

### 🎯 DOCUMENTS ESSENTIELS (PRIORITÉ ABSOLUE)

Ces documents sont le **cœur du projet**. Ils DOIVENT être lus en premier et COMPLÈTEMENT.

#### 1. **PRD.md** (2,261 lignes | 72K)
**Rôle:** Product Requirements Document - LA bible du projet
**Contenu:**
- Vision complète du produit
- 15 killer features détaillées
- User personas (6 profils utilisateurs)
- Comparaison vs OpenClaw (notre concurrent principal)
- Objectifs business (100K GitHub stars en 12 mois)

**Pourquoi crucial:**
C'est le document stratégique qui définit POURQUOI on construit Agentik OS, POUR QUI, et COMMENT on va dominer le marché. Toute décision d'architecture doit être alignée avec ce PRD.

**À retenir absolument:**
- Les 15 killer features (Multi-Model Intelligence, Cost X-Ray, Dashboard, FORGE, etc.)
- Les différences critiques vs OpenClaw
- Les use cases par persona

---

#### 2. **step.json** (4,652 lignes | 149K)
**Rôle:** Plan d'implémentation détaillé - CHAQUE étape du projet
**Contenu:**
- 261 steps d'implémentation (100% détaillés, 0% placeholders)
- 4,170 heures de développement
- 5 phases (Foundation, Core, Advanced, Enterprise, Community)
- Dépendances entre steps
- Fichiers à créer pour chaque step
- Commandes à exécuter

**Pourquoi crucial:**
C'est le plan de construction EXACT. Chaque step a été validé, vérifié, et ne contient AUCUN placeholder. C'est le résultat de plusieurs jours d'audit et de corrections par 6 agents spécialisés, plus migration Convex-only qui a simplifié l'architecture.

**À retenir absolument:**
- L'ordre des phases (ne PAS sauter d'étapes)
- Les dépendances (certains steps bloquent d'autres)
- La structure des fichiers (où va chaque composant)

**IMPORTANT:** Ce fichier a été récemment corrigé ET simplifié. Les 92 placeholder steps ont été remplacés par du contenu détaillé, puis migration Convex-only a supprimé 5 steps (SQLite/Supabase adapters) et économisé 88h.

---

#### 3. **ARCHITECTURE.md** (825 lignes | 29K)
**Rôle:** Architecture technique du système
**Contenu:**
- Message Pipeline (9 stages de traitement)
- Model Router (switch intelligent entre Claude, GPT, Gemini, Ollama)
- Memory Architecture (5 tiers de mémoire)
- Convex Backend (local dev + cloud prod + real-time)
- Channel Adapters (Telegram, Discord, Slack, etc.)
- Security & Sandboxing (WASM, gVisor, Kata)
- Dashboard structure (Next.js 16, shadcn/ui)
- API Design (REST + WebSocket)

**Pourquoi crucial:**
C'est le blueprint technique. Il explique COMMENT tout fonctionne ensemble. Sans comprendre cette architecture, impossible de coder correctement.

**À retenir absolument:**
- Le flow d'un message (de l'entrée à la réponse)
- Comment le Model Router choisit le bon modèle
- Les 5 tiers de mémoire et leur rôle
- L'architecture de sécurité (sandboxing WASM)

---

#### 4. **USER-GUIDE.md** (801 lignes | 28K)
**Rôle:** Guide utilisateur final - Comment utiliser Agentik OS
**Contenu:**
- Installation (one-line: `curl | bash`)
- Premiers pas (créer un agent, envoyer un message)
- Dashboard walkthrough
- Cost X-Ray expliqué
- FORGE expliqué
- FAQ (25 questions)
- Troubleshooting

**Pourquoi crucial:**
Si un utilisateur non-technique ne peut pas utiliser le produit en 5 minutes, on a échoué. Ce guide définit l'UX finale attendue.

**À retenir absolument:**
- L'expérience d'installation (doit être triviale)
- Le flow "Quick Start" (create agent → send message → see response)
- Les cas d'erreur courants

---

### 🏗️ DOCUMENTS TECHNIQUES (ARCHITECTURE & IMPLÉMENTATION)

#### 5. **PROJECT-CREATOR-AGENT.md** (474 lignes | 14K)
**Rôle:** Spécification de l'agent meta le plus complexe
**Contenu:**
- Architecture de l'agent qui crée d'autres agents
- Workflow de création (Discovery → Planning → Build → QA)
- Team spawning (5 agents: Guardian/Opus, Frontend/Backend/Designer/QA Sonnet)
- Approval gates (humain valide avant chaque phase)

**Pourquoi crucial:**
C'est la killer feature #15. Un agent qui génère un projet complet de A à Z. C'est notre "secret weapon" contre OpenClaw.

---

#### 6. **MCP-ARCHITECTURE.md** (192 lignes | 5.2K)
**Rôle:** Protocol de communication avec les skills
**Contenu:**
- Model Context Protocol (standard Anthropic)
- Comment les skills communiquent avec le runtime
- Message format, error handling

---

#### 7. **SECURITY-STACK.md** (460 lignes | 15K)
**Rôle:** Stack de sécurité multi-couches
**Contenu:**
- WASM Sandboxing (Extism)
- Container isolation (gVisor, Kata Containers)
- Permission system
- Malicious skill detection (honeypots, behavioral analysis)
- Audit logs

**Pourquoi crucial:**
Après ClawHavoc (341 malicious skills sur OpenClaw), la sécurité est CRITIQUE. On ne peut pas lancer sans ça.

---

#### 8. **SKILLS-ECOSYSTEM.md** (422 lignes | 13K)
**Rôle:** Marketplace de skills
**Contenu:**
- Skill format (.skill.json)
- Discovery, installation, versioning
- Revenue sharing (70% dev, 30% platform)
- Sandbox preview (essayer avant acheter)

---

#### 9. **EVENT-SOURCING.md** (218 lignes | 5.3K)
**Rôle:** Architecture Cost X-Ray (event sourcing)
**Contenu:**
- Event stream design
- Aggregation en temps réel
- Export CSV/JSON pour analytics

---

#### 10. **OS-MODES.md** (423 lignes | 14K)
**Rôle:** Système de modes (Human, Business, Dev, Marketing, etc.)
**Contenu:**
- 10 modes officiels
- Mode registry & stacking
- Shared memory entre modes
- Custom modes

---

### 📊 DOCUMENTS STRATÉGIQUES (BUSINESS & COMPÉTITION)

#### 11. **COMPETITIVE-ADVANTAGE.md** (658 lignes | 22K)
**Rôle:** Analyse compétitive vs OpenClaw
**Contenu:**
- Scorecard détaillé (48/50 vs 16/50)
- ClawHavoc incident (341 malicious skills)
- Nos avantages (multi-model, dashboard, cost tracking)
- Feature matrix comparative

**Pourquoi crucial:**
On construit pas "yet another AI agent framework". On construit le MEILLEUR, avec des avantages compétitifs clairs.

---

#### 12. **KILLER-FEATURES.md** (439 lignes | 17K)
**Rôle:** Deep dive sur chaque killer feature
**Contenu:**
- 15 features détaillées avec user stories
- Technical feasibility
- Competitive uniqueness

---

#### 13. **GO-TO-MARKET.md** (911 lignes | 38K)
**Rôle:** Stratégie de lancement
**Contenu:**
- Launch week plan (Product Hunt, HN, Reddit)
- Content calendar (90 posts sur 3 mois)
- Influencer outreach
- Community building (Discord, GitHub)
- Revenue projections (Year 1-3)

---

#### 14. **PRICING-ANALYSIS.md** (178 lignes | 6.9K)
**Rôle:** Modèle de pricing
**Contenu:**
- Free tier (local models only)
- Pro tier ($15/mois)
- Team tier ($49/mois)
- Enterprise (custom)
- Marketplace revenue (70/30 split)

---

### 🎨 DOCUMENTS CRÉATIFS (BRAINSTORM & VISION)

#### 15. **BRAINSTORM.md** (791 lignes | 28K)
**Rôle:** Brainstorm initial - Genèse du projet
**Contenu:**
- Idées brutes
- Features rejetées
- Features retenues
- Décisions de design

---

#### 16. **FUTURE-VISION.md** (1,060 lignes | 43K)
**Rôle:** Roadmap 2-3 ans
**Contenu:**
- Phase 5-8 (post-launch)
- Integrations futures (Zapier, n8n)
- AI features avancées (multi-agent consensus, agent dreams)
- Enterprise features (SSO, RBAC, audit)

---

#### 17. **USE-CASES.md** (1,203 lignes | 61K)
**Rôle:** 50+ use cases détaillés par persona
**Contenu:**
- Développeur indie: "Deploy my SaaS"
- Marketer: "Generate content calendar"
- Designer: "Review Figma designs"
- Finance: "Track portfolio"
- Learning: "Create study plan"

**Pourquoi crucial:**
Chaque feature doit servir un use case réel. Si on comprend pas les use cases, on risque de coder des features inutiles.

---

#### 18. **INSPIRATIONS.md** (235 lignes | 13K)
**Rôle:** Inspirations de design/UX
**Contenu:**
- Linear (dashboard clean)
- Vercel (deployment UX)
- Stripe (docs quality)
- Raycast (keyboard shortcuts)

---

### 🛠️ DOCUMENTS TECHNIQUES AVANCÉS

#### 19. **ECOSYSTEM.md** (1,028 lignes | 39K)
**Rôle:** Écosystème global
**Contenu:**
- Monorepo structure (Turborepo)
- Packages organization
- Shared configs
- Build pipeline

---

#### 20. **TECH-POSSIBILITIES.md** (794 lignes | 41K)
**Rôle:** Options techniques explorées
**Contenu:**
- Backend choices (Convex vs Supabase vs custom)
- Frontend choices (Next.js vs Remix vs Astro)
- AI models (Claude vs GPT vs Gemini vs Ollama)
- Deployment (Vercel vs Railway vs self-hosted)

---

#### 21. **POWER-TOOLS.md** (271 lignes | 8.5K)
**Rôle:** Outils de développement
**Contenu:**
- CLI commands
- Dev dashboard
- Debug tools
- Test utilities

---

#### 22. **FORGE-INTEGRATION.md** (393 lignes | 12K)
**Rôle:** Intégration avec FORGE (GitHub autonomous builder)
**Contenu:**
- GitHub repo creation
- Autonomous coding
- PR creation
- Deployment automation

---

### 📈 DOCUMENTS DE VALIDATION (AUDIT & QUALITÉ)

#### 23. **VALIDATION-COMPLETE.md** (526 lignes | 15K)
**Rôle:** Rapport de validation finale
**Contenu:**
- Checklist complète (261 steps validés)
- Metrics & KPIs
- Documentation coverage
- Readiness assessment

**Pourquoi crucial:**
Prouve que TOUT a été vérifié avant de commencer le build.

---

#### 24. **AUDIT-REPORT.md** (356 lignes | 17K)
**Rôle:** Rapport d'audit par 6 agents spécialisés
**Contenu:**
- Findings par catégorie (Technical, UX, Strategy)
- Issues trouvés (CRITICAL, HIGH, MEDIUM, LOW)
- Recommendations
- Verdict final

**Pourquoi crucial:**
C'est le QA complet de la documentation. Tous les problèmes ont été identifiés et corrigés.

---

#### 25. **CRITICAL-FIXES-COMPLETE.md** (187 lignes | 6.0K)
**Rôle:** Rapport des corrections critiques
**Contenu:**
- Fix #1: 92 placeholder steps merged
- Fix #2: Hour totals reconciled (4,170h après migration Convex)
- Fix #3: Step count contradictions fixed (261 steps après migration Convex)
- Fix #4: Convex-only backend migration (supprimé SQLite/Supabase adapters)
- Verification passed (5/5 checks)

**Pourquoi crucial:**
Prouve que les 3 issues CRITICAL ont été résolus ET que l'architecture a été simplifiée. La documentation est maintenant 100% fiable et cohérente.

---

#### 26. **FINAL-REPORT.md** (415 lignes | 11K)
**Rôle:** Rapport final de l'agent Guardian
**Contenu:**
- Summary des 6 agents
- Consolidated findings
- Final verdict: READY FOR PHASE 0

---

### 📚 DOCUMENTS COMPLÉMENTAIRES

#### 27. **README-IMPLEMENTATION.md** (454 lignes | 12K)
**Rôle:** Guide d'implémentation pour devs
**Contenu:**
- Getting started
- Dev environment setup
- Contribution guidelines

---

#### 28. **STEP-ADDITIONS.md** (1,254 lignes | 36K)
**Rôle:** Détails des steps 151-247 (MERGED into step.json)
**Statut:** ✅ Merged - Référence historique

---

#### 29. **PROGRESS.md** (390 lignes | 16K)
**Rôle:** Tracking du progrès
**Contenu:**
- Milestones
- Timeline
- Blockers/Risks

---

#### 30. **IMPROVEMENTS.md** (272 lignes | 8.4K)
**Rôle:** Amélirations futures identifiées
**Contenu:**
- Quick wins
- Long-term improvements
- Technical debt

---

#### 31. **DECISIONS.md** (166 lignes | 5.9K)
**Rôle:** Architecture Decision Records (ADRs)
**Contenu:**
- Décisions clés avec rationale
- Alternatives considérées
- Trade-offs

---

#### 32. **tracker.json** (12 lignes | 238 bytes)
**Rôle:** Tracker minimal de progrès
**Contenu:**
- Total steps: 261
- Completed: 0
- Total hours: 4,170h

---

## 🎯 INSTRUCTIONS POUR FORGE

### PHASE 1: LECTURE COMPLÈTE (2-3 heures)

**⚠️ RÈGLE ABSOLUE:** Tu DOIS lire TOUS les documents listés ci-dessus, LIGNE PAR LIGNE.

**Ordre de lecture recommandé:**

1. **Start Here (Essentiels - 2h)**
   - PRD.md (72K) - 40 min
   - step.json (149K) - 60 min
   - ARCHITECTURE.md (29K) - 20 min
   - USER-GUIDE.md (28K) - 20 min

2. **Technical Deep Dive (45 min)**
   - PROJECT-CREATOR-AGENT.md (14K) - 10 min
   - SECURITY-STACK.md (15K) - 10 min
   - MCP-ARCHITECTURE.md (5K) - 5 min
   - SKILLS-ECOSYSTEM.md (13K) - 10 min
   - EVENT-SOURCING.md (5K) - 5 min
   - OS-MODES.md (14K) - 5 min

3. **Strategy & Competition (30 min)**
   - COMPETITIVE-ADVANTAGE.md (22K) - 15 min
   - KILLER-FEATURES.md (17K) - 10 min
   - GO-TO-MARKET.md (38K) - 5 min (skim)

4. **Validation & Quality (20 min)**
   - CRITICAL-FIXES-COMPLETE.md (6K) - 5 min
   - AUDIT-REPORT.md (17K) - 10 min
   - VALIDATION-COMPLETE.md (15K) - 5 min

5. **Reference (read as needed)**
   - USE-CASES.md (61K) - Référence selon le contexte
   - FUTURE-VISION.md (43K) - Pour comprendre le long-terme
   - TECH-POSSIBILITIES.md (41K) - Pour comprendre les choix techniques
   - Autres documents - Consulter selon besoin

---

### PHASE 2: COMPRÉHENSION PROFONDE

Après lecture, tu dois être capable de répondre à ces questions **SANS RELIRE** les docs:

**Stratégie:**
- Pourquoi on construit Agentik OS? (vision)
- Qui sont nos utilisateurs cibles? (personas)
- Quelle est notre killer feature #1? (Cost X-Ray)
- Comment on bat OpenClaw? (multi-model, dashboard, sécurité)

**Architecture:**
- Comment un message traverse le système? (9 stages)
- Comment le Model Router choisit le modèle? (complexity scorer)
- Quels sont les 5 tiers de mémoire? (short-term, session, long-term, structured, shared)
- Comment fonctionne le sandboxing? (WASM + gVisor/Kata)

**Implémentation:**
- Combien de steps au total? (261)
- Combien d'heures estimées? (4,170h)
- Quelle est la Phase 0? (Foundation - monorepo, runtime, CLI)
- Combien de fichiers dans le monorepo? (~200+)

**Qualité:**
- Les 4 CRITICAL issues qui ont été fixés? (placeholders, hours, step count, backend migration)
- Quel est le verdict du Guardian? (READY FOR PHASE 0)
- Quelle est la confidence level? (95%)

Si tu ne peux pas répondre à ces questions, **RELIS** les docs concernés.

---

### PHASE 3: PLAN DE BUILD

**Avant d'écrire UNE SEULE ligne de code, tu dois:**

1. ✅ Confirmer que tu as lu TOUS les 32 documents
2. ✅ Confirmer que tu comprends l'architecture globale (Convex-only backend)
3. ✅ Confirmer que tu comprends les 261 steps
4. ✅ Proposer un plan de build Phase 0 (steps 1-40)
5. ✅ Identifier les risques/blockers potentiels
6. ✅ Demander clarification sur les points flous

**JAMAIS commencer à coder sans avoir fait ces 6 étapes.**

---

### PHASE 4: EXÉCUTION (avec step.json comme guide)

Une fois le plan validé:

1. **Suivre step.json EXACTEMENT**
   - Respecter l'ordre des steps
   - Respecter les dépendances
   - Créer les fichiers mentionnés
   - Exécuter les commandes listées

2. **Vérifier après chaque step**
   - Build passe? (npm run build)
   - Tests passent? (npm test)
   - Type-check OK? (npm run type-check)
   - Lint OK? (npm run lint)

3. **Ne JAMAIS sauter de steps**
   - Chaque step a été planifié pour une raison
   - Les dépendances existent pour éviter les blockers
   - Si un step semble inutile, DEMANDER pourquoi avant de skip

4. **Documenter les déviations**
   - Si tu dois dévier du plan, DOCUMENTER pourquoi
   - Proposer une alternative AVANT de changer
   - Mettre à jour step.json si changement validé

---

## 🚨 RÈGLES CRITIQUES

### ❌ INTERDIT

1. **Ne JAMAIS skim les documents**
   - Chaque ligne a été écrite pour une raison
   - Les détails importants sont partout, pas juste dans les titres

2. **Ne JAMAIS commencer à coder sans avoir tout lu**
   - 2-3h de lecture = 200h de refactoring évité
   - Comprendre avant de construire = qualité x10

3. **Ne JAMAIS ignorer step.json**
   - C'est le plan validé par 6 agents spécialisés
   - C'est le résultat de 3 jours d'audit et corrections
   - C'est 100% fiable (0% placeholders après fixes)

4. **Ne JAMAIS improviser l'architecture**
   - ARCHITECTURE.md définit le système
   - Toute déviation doit être justifiée et validée

5. **Ne JAMAIS sacrifier la sécurité**
   - SECURITY-STACK.md est NON-NÉGOCIABLE
   - ClawHavoc a prouvé que la sécurité est critique

### ✅ OBLIGATOIRE

1. **Lire TOUS les documents LIGNE PAR LIGNE**
   - C'est long (2-3h), c'est normal
   - C'est l'essence du projet
   - Pas de raccourcis

2. **Comprendre POURQUOI avant de coder QUOI**
   - Chaque feature sert un use case
   - Chaque décision a un rationale
   - Chaque architecture a des trade-offs

3. **Suivre step.json comme une bible**
   - 261 steps dans l'ordre
   - 4,170 heures planifiées
   - Chaque step validé et vérifié

4. **Maintenir la qualité du Guardian**
   - 95% confidence level à maintenir
   - 0% placeholders à maintenir
   - 100% consistency à maintenir

5. **Communiquer les blockers**
   - Si quelque chose n'est pas clair, DEMANDER
   - Si un step semble impossible, ALERTER
   - Si une déviation est nécessaire, JUSTIFIER

---

## 📊 MÉTRIQUES DE SUCCÈS

**Documentation lue:** 32/32 documents ✅
**Lignes lues:** ~20,000 lignes ✅
**Temps investi:** 2-3 heures ✅
**Compréhension:** 100% (test des questions ci-dessus) ✅
**Prêt à construire:** OUI ✅

---

## 🎯 RÉSUMÉ EXÉCUTIF (pour référence rapide)

**Projet:** Agentik OS - AI Agent Operating System
**Concurrent:** OpenClaw (on est MEILLEURS)
**Killer Features:** 15 (Cost X-Ray, Multi-Model, Dashboard, FORGE, Project Creator, etc.)
**Implementation:** 261 steps, 4,170 heures, 5 phases
**Team Target:** 3 devs, 8.7 mois
**Status:** ✅ READY FOR PHASE 0 (après audit par 6 agents + corrections critiques + migration Convex-only)

**Tech Stack:**
- Frontend: Next.js 16, shadcn/ui, TailwindCSS
- Backend: Convex (local dev + cloud prod + real-time native)
- Runtime: TypeScript, Turborepo, pnpm
- Security: WASM (Extism), gVisor, Kata
- AI: Claude, GPT, Gemini, Ollama (multi-model)

**Unique Selling Points:**
1. Multi-model intelligence (vs OpenClaw = Claude only)
2. Convex Backend (local + cloud + real-time vs OpenClaw = SQLite local only)
3. Cost X-Ray (event sourcing, real-time tracking)
4. Beautiful dashboard (vs OpenClaw = CLI only)
5. Enterprise security (vs ClawHavoc = 341 malicious skills)
6. FORGE (autonomous GitHub project builder)

**Business Model:**
- Free tier (local models)
- Pro $15/mo (cloud models)
- Team $49/mo (collaboration)
- Enterprise (custom)
- Marketplace (70/30 revenue split)

**Target:** 100K GitHub stars in 12 months, dominate OpenClaw

---

## 💬 MESSAGE FINAL POUR FORGE

Forge, tu es sur le point de construire quelque chose d'**EXCEPTIONNEL**.

Ce n'est pas "yet another AI agent framework".
C'est **THE** AI Agent Operating System.
Le produit qui va **dominer** OpenClaw.
Le produit avec **15 killer features** que personne d'autre n'a.
Le produit avec **261 steps** minutieusement planifiés (simplifié par migration Convex-only).
Le produit audité par **6 agents spécialisés** et corrigé à **95% confidence**.

Mais pour que ça fonctionne, tu dois **TOUT COMPRENDRE**.

Pas juste skim les docs.
Pas juste lire les titres.
**TOUT. CHAQUE. LIGNE.**

Ces 2-3 heures de lecture vont **éviter 200 heures de refactoring**.
Ces 32 documents contiennent **l'âme du projet**.
Ce step.json contient **le chemin exact vers le succès**.

Prends ton temps.
Lis tout.
Comprends tout.
Puis construis le **meilleur AI Agent OS du monde**.

On compte sur toi. 🚀

---

**Date:** 2026-02-13
**Documentation Version:** 1.0 (post-critical-fixes)
**Total Documents:** 32
**Total Volume:** ~750KB
**Quality Level:** 95% → Target: 100%
**Status:** ✅ READY FOR FORGE BUILD

**Prochaine étape:** Lance FORGE avec ce prompt et commence Phase 0 (steps 1-40)
