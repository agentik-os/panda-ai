# Agentik OS - MCP-Native Architecture (Research Results)

> Every plugin IS an MCP server. This is proven and production-ready in 2026.

---

## KEY FINDING: Convex IS Open-Source (Self-Hostable)

Since early 2025, Convex open-sourced the full backend.
Docker Compose, runs on PostgreSQL/MySQL/SQLite.
Zero cloud dependency. Self-hosting docs are solid.

---

## MCP as Plugin System - Why It Works

| Plugin System Need | MCP Gives You |
|---|---|
| Discovery | Official MCP Registry (live) |
| API contract | Tool schemas (JSON Schema) |
| Lifecycle | Session init/shutdown |
| Isolation | 1:1 client-server, servers can't see each other |
| Versioning | Protocol version negotiation |
| Communication | JSON-RPC 2.0 over stdio or HTTP |
| Hot-reload | `tools/list_changed` notification |

---

## MCP-Native vs MCP-as-Addon

```
MCP-as-Addon (most platforms):
  Platform Core → REST API (primary)
                → Webhooks
                → MCP Server (wrapper)  ← afterthought

MCP-Native (Agentik OS):
  Agent Kernel → MCP Client Pool
                  → [MCP] Filesystem (built-in)
                  → [MCP] Database (built-in)
                  → [MCP] Slack (third-party)
                  → [MCP] Custom logic (user-built)
```

Built-in and third-party have SAME power. No internal shortcuts.

---

## Composio = 500+ Integrations Instantly

```
Agent → MCP Gateway (Composio) → Gmail, Slack, GitHub,
                                  Linear, Notion, 500+ more
```

- Handles OAuth flows, token refresh, rate limiting
- One MCP server = 500 integrations
- We don't build integrations, we use Composio

---

## MCP Server Composition (Proven Patterns)

### Pattern 1: Mount (live)
```typescript
main.mount(auth_server, namespace="auth")     // live link
main.mount(db_server, namespace="db")         // live link
// Agent sees: auth_login, db_query, etc.
```

### Pattern 2: Proxy (remote)
```typescript
main.mount(
  FastMCP.from_client("http://api.example.com/mcp"),
  namespace="remote"
)
```

### Pattern 3: Gateway aggregation
One proxy connects to N backend MCP servers, exposes combined tools.

---

## Security: Sandbox Everything

CoSAI whitepaper identifies 12 threat categories, ~40 distinct threats.

### Required Layers

| Layer | Technology | Purpose |
|---|---|---|
| Process isolation | Separate OS process per MCP server | Fault isolation |
| Syscall filtering | seccomp-bpf | Restrict system calls |
| Container sandbox | gVisor | Host never exposed |
| MicroVM | Kata Containers | Full VM, <2ms startup |
| Network policy | iptables | Restrict outbound access |
| Filesystem | Read-only rootfs | No persistent writes |

### Sandbox Config Per Skill
```yaml
sandbox:
  runtime: gvisor
  network:
    allow_outbound: false
    allowlist:
      - "api.github.com:443"
  filesystem:
    read_only: true
  resources:
    memory_limit: 256Mi
    cpu_limit: 0.5
    timeout: 30s
```

### Auth: OAuth 2.1 (Mandatory in MCP spec)
- PKCE required
- Token passthrough forbidden
- Per-server credentials

---

## Hot-Reload MCP Servers

```
File change → Server reloads tools
           → Sends tools/list_changed notification
           → Client re-discovers tools
           → Agent sees new tools immediately
```

Multiple production tools exist:
- mcp-reloader (TypeScript)
- mcp-server-hmr (proxy with buffering)
- Dynamic tool registration at runtime

---

## MCP Registries (Discovery)

| Registry | Role |
|---|---|
| Official MCP Registry | Source of truth, namespace-authenticated |
| Smithery | Browse/search marketplace |
| Glama | Hosted MCP servers (runs them for you) |
| Private registry | Our own for internal extensions |

---

## Agentik OS Architecture (Final)

```
                    MCP Registry (discovery)
                          |
                          v
  +-------------------+
  | AGENTIK OS KERNEL |
  |                   |
  | Agent Loop        |
  | Model Router      |     +------------------+
  | Event Bus ◄───────────►| MCP Server       |
  | (append-only log) |     | (sandboxed in    |
  |                   |     |  gVisor/Kata)    |
  | MCP Client Pool ◄────►| filesystem, DB   |
  |                   |     +------------------+
  | Projections:      |
  | - Cost tracking   |     +------------------+
  | - Audit log       |◄──►| MCP Gateway      |
  | - Replay/debug    |     | (Composio)       |
  | - Analytics       |     | 500+ SaaS tools  |
  +-------------------+     +------------------+

                            +------------------+
                       ◄──►| MCP Server       |
                            | (user-built)     |
                            | custom skills    |
                            +------------------+
```

### Key Principles

1. MCP is the ONLY extension interface
2. Every agent action is an immutable event
3. CQRS separates write (events) and read (projections)
4. Sandbox everything (gVisor/Kata)
5. Registry for discovery (private + public)
6. Hot-reload in dev, blue/green in prod
7. Composio for common integrations

---

*Research completed: 2026-02-13*
*Sources: MCP Spec, CoSAI whitepaper, FastMCP docs, Composio, Akka, Graphite*
