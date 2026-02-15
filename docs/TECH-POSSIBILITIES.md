# AGENTIK OS - Technology Possibilities

> Bleeding-edge technologies that could make Agentik OS 10x more powerful.
> Each evaluated for real-world readiness, not hype. Research date: February 2026.

---

## Table of Contents

1. [WebAssembly (WASM) Skills](#1-webassembly-wasm-skills)
2. [Edge Deployment](#2-edge-deployment)
3. [Local LLM Integration](#3-local-llm-integration)
4. [P2P Agent Network](#4-p2p-agent-network)
5. [Voice-First Interface](#5-voice-first-interface)
6. [Browser Extension](#6-browser-extension)
7. [Mobile Native](#7-mobile-native)
8. [Streaming Architecture](#8-streaming-architecture)
9. [Vector Database Options](#9-vector-database-options)
10. [AI Model Innovations](#10-ai-model-innovations)
11. [Observability Stack](#11-observability-stack)
12. [Plugin Distribution](#12-plugin-distribution)
13. [Offline Sync](#13-offline-sync)
14. [Security Innovations](#14-security-innovations)

---

## 1. WebAssembly (WASM) Skills

**What it is:** Run agent skills as sandboxed WebAssembly modules instead of Docker containers, achieving microsecond cold starts with true memory isolation.

**Current state:** Production-ready. The ecosystem has matured significantly.

### Runtime Landscape

| Runtime | Language | Cold Start | Steady-State vs Native | Memory | Best For |
|---------|----------|-----------|------------------------|--------|----------|
| **Wasmtime** | Rust | ~1ms | 88% of native C++ | ~15 MB | Server-side, JIT compilation, reference implementation |
| **WasmEdge** | Rust/C++ | ~2ms | 85-90% of native | ~20 MB | Edge/IoT, AI workloads, AOT compilation |
| **Wasmer** | Rust | ~1ms | 85% of native | ~18 MB | Cross-platform, package registry (wapm) |
| **Extism** | Rust (wraps Wasmtime) | ~1ms | Same as Wasmtime | Same | **Plugin systems** -- this is what we want |

### Why Extism is the Answer for Agentik OS

Extism is not a runtime. It is a plugin framework built on top of Wasmtime that solves exactly the problem Agentik OS has: running untrusted user-provided code safely. It provides 15+ Host SDKs (including JavaScript/TypeScript) and 7+ Plugin Development Kits so skills can be written in Rust, Go, Python, C, AssemblyScript, or Zig and compiled to WASM.

Key Extism features relevant to Agentik OS:
- **Host functions**: The runtime can expose capabilities (MCP tool calls, memory access, event emission) to WASM plugins
- **Persistent memory**: Module-scope variables survive across calls within a session
- **HTTP control**: Sandboxed HTTP without full WASI -- the host decides what network access the plugin gets
- **Runtime limiters**: CPU time limits, memory caps, execution timeouts
- **Manifest-driven**: Plugins declare their capabilities and requirements

### How It Fits Agentik OS

```
Current: Skill = Docker container (seconds to cold start, hundreds of MB)
Future:  Skill = WASM module via Extism (~1ms cold start, ~1-5 MB)
```

A skill written in any language compiles to `.wasm`, gets uploaded to the marketplace, and runs inside the Agentik OS runtime with zero container overhead. The runtime exposes MCP tool access, event bus, and memory through Extism host functions. Each skill runs in its own linear memory space -- one skill cannot read another skill's data.

The Docker path remains for skills that need filesystem access, long-running processes, or native dependencies that cannot compile to WASM (e.g., FFmpeg, Puppeteer).

### What Cannot Run in WASM (Today)

- Direct filesystem access beyond WASI Preview 2 basics
- Raw network sockets (TCP/UDP listeners)
- GPU compute (no CUDA/Metal from WASM)
- Native OS APIs (clipboard, notifications)
- Heavy binary dependencies (ImageMagick, Chrome, etc.)

| Aspect | Value |
|--------|-------|
| **Implementation complexity** | Medium -- Extism's JS SDK handles the hard parts, but designing the host function API for MCP/events takes care |
| **Priority** | **P1** -- massive UX improvement (instant skill loading), critical for marketplace scalability |

---

## 2. Edge Deployment

**What it is:** Run lightweight agent logic on globally distributed edge nodes (Cloudflare Workers, Deno Deploy, Vercel Edge Functions) for sub-50ms response times worldwide.

**Current state:** Partially ready. Edge runtimes are mature, but AI agent workloads push their limits.

### Platform Comparison

| Platform | Runtime | Memory Limit | CPU Time | WebSocket | State | AI Models |
|----------|---------|-------------|----------|-----------|-------|-----------|
| **Cloudflare Workers** | V8 isolates | 128 MB | 30s (paid) | Yes (Durable Objects) | Durable Objects, KV, R2 | Workers AI (on-platform) |
| **Deno Deploy** | Deno/V8 | 512 MB | 5 min | Yes | Deno KV | None native |
| **Vercel Edge Functions** | V8 isolates | 128 MB | 30s | No (use serverless) | None persistent | None native |

### What Can Run at the Edge

- **Channel bridges**: Telegram/Discord/Slack webhook handlers (parse incoming, route to core)
- **Agent router**: Fast intent classification, agent selection, request validation
- **Response streaming**: SSE proxy that streams from core runtime to client
- **Rate limiting and auth**: Token validation, per-user rate limiting, abuse detection
- **Cache layer**: Frequently asked questions, static agent responses, embedding cache
- **Lightweight agents**: Simple Q&A agents that call a single model API with minimal context

### What Cannot Run at the Edge

- **Full agent orchestration**: Multi-step tool use chains exceed CPU/memory limits
- **MCP server management**: Long-lived server processes cannot run in ephemeral isolates
- **Vector search**: Embedding + retrieval workloads need persistent storage and compute
- **Local LLM inference**: No GPU, not enough memory
- **Event sourcing write path**: Needs transactional guarantees against a real database

### Recommended Architecture

```
Edge (Cloudflare Workers)              Core (VPS/Cloud)
+---------------------------+          +---------------------------+
| - Webhook receiver        |          | - Agent runtime           |
| - Auth/rate limit         |  =====>  | - MCP servers             |
| - Intent classification   |  WebSocket| - Model router           |
| - Response SSE proxy      |  <====== | - Event store (Convex)    |
| - Static cache (KV)       |          | - Memory layers           |
+---------------------------+          +---------------------------+
```

Cloudflare's Agents SDK (built on Durable Objects) is the most interesting option here. Each agent gets a Durable Object with persistent state, WebSocket support, and scheduled tasks. The 128 MB memory limit is the real constraint -- fine for routing, insufficient for RAG or complex orchestration.

| Aspect | Value |
|--------|-------|
| **Implementation complexity** | Medium -- edge layer is straightforward, the hard part is deciding the split between edge and core |
| **Priority** | **P2** -- nice latency improvement for channel handling, but the core runtime must work first |

---

## 3. Local LLM Integration

**What it is:** First-class support for running LLMs on user hardware (Ollama, llama.cpp, MLX, vLLM) so Agentik OS works without any API keys.

**Current state:** Production-ready. Local inference is fast enough for real-time conversation.

### Runtime Comparison

| Runtime | Platform | Best For | Speed (7B model) | GPU Required |
|---------|----------|----------|-------------------|--------------|
| **Ollama** | Cross-platform | Simplest setup, REST API out of box | ~30-60 tok/s (GPU) | Optional (CPU fallback) |
| **llama.cpp** | Cross-platform | Maximum control, GGUF quantization | ~40-80 tok/s (GPU) | Optional |
| **MLX** | Apple Silicon only | Mac-native, unified memory | ~230 tok/s (M4 Pro) | Uses Apple GPU |
| **vLLM** | Linux (CUDA) | Production serving, batching, PagedAttention | ~100-200 tok/s | Required (NVIDIA) |

### MLX is a Monster

Apple's MLX framework on M-series chips achieves remarkable throughput. The M5 chip pushes time-to-first-token under 10 seconds for dense 14B architectures and under 3 seconds for 30B Mixture-of-Experts models. MLX achieves approximately 230 tokens/sec sustained generation with stable per-token latency. The unified memory architecture means no CPU-GPU data transfer bottleneck.

### How It Fits Agentik OS

The Model Router already abstracts providers. Local models become just another provider:

```typescript
// Model router config
{
  providers: {
    claude: { type: "anthropic", apiKey: "..." },
    gpt: { type: "openai", apiKey: "..." },
    local: { type: "ollama", baseUrl: "http://localhost:11434" },
    local_mlx: { type: "mlx", modelPath: "~/.agentik/models/qwen-7b-q4" }
  },
  routing: {
    "budget-conscious": "local",
    "high-quality": "claude",
    "apple-user": "local_mlx"
  }
}
```

### Required Components

1. **Model download manager**: Pull models from HuggingFace/Ollama registry, show progress, manage disk space
2. **GPU detection**: Auto-detect NVIDIA CUDA, Apple Metal, AMD ROCm, or CPU-only
3. **Quantization selector**: Recommend Q4_K_M for constrained hardware, Q8 for plenty of VRAM, FP16 for accuracy
4. **Health monitor**: Track VRAM usage, inference speed, queue depth
5. **Automatic fallback**: If local model is slow or unavailable, route to cloud API

| Aspect | Value |
|--------|-------|
| **Implementation complexity** | Low for Ollama (REST API), Medium for MLX/vLLM (native bindings) |
| **Priority** | **P0** -- this is a core differentiator. "Works with zero API keys" is a killer feature for self-hosted users |

---

## 4. P2P Agent Network

**What it is:** Connect Agentik OS instances directly using libp2p or WebRTC, forming a mesh network where agents can collaborate across installations without a central server.

**Current state:** Experimental. js-libp2p v3.1 is stable, but agent-specific protocols need to be designed.

### Technology Options

| Technology | Transport | NAT Traversal | Browser Support | Maturity |
|------------|-----------|---------------|-----------------|----------|
| **libp2p** | TCP, QUIC, WebSocket, WebRTC | Built-in (relay, hole-punching) | Yes (via WebRTC/WebSocket) | High (used by IPFS, Filecoin) |
| **WebRTC** | UDP (DTLS/SRTP) | ICE/STUN/TURN | Native | High |
| **Nostr** | WebSocket relays | Relay-based (simpler) | Yes | Medium (growing fast) |

### Use Cases for Agentik OS

1. **Shared agent marketplace**: Discover and invoke agents running on other people's Agentik OS instances
2. **Distributed tool execution**: Agent A on Node 1 needs a tool that only Node 2 has installed
3. **Collaborative memory**: Shared knowledge bases across a team's Agentik OS instances
4. **Federated agent orchestration**: Complex tasks split across multiple nodes

### Architecture Sketch

```
Node A (Developer)          Node B (DevOps)          Node C (Designer)
+------------------+       +------------------+       +------------------+
| Agent: CodeReview|<----->| Agent: Deploy    |<----->| Agent: UIAudit   |
| Tools: GitHub    | libp2p| Tools: K8s, AWS  | libp2p| Tools: Figma     |
| Model: Claude    |       | Model: Ollama    |       | Model: GPT       |
+------------------+       +------------------+       +------------------+
```

### Honest Assessment

This is architecturally exciting but has real challenges:
- **NAT traversal** remains painful. Corporate firewalls block most P2P connections. You need relay nodes as fallback.
- **Discovery** requires either a bootstrap node (semi-centralized) or DHT (slow initial discovery).
- **Trust**: Invoking a remote agent means trusting its output. Verification is unsolved.
- **js-libp2p maintenance concern**: The previous primary maintainer stepped away in September 2025. The project continues but with reduced bus factor.

| Aspect | Value |
|--------|-------|
| **Implementation complexity** | High -- protocol design, NAT traversal, trust model, discovery all need solving |
| **Priority** | **P3** -- visionary feature, but Agentik OS needs to work perfectly as a single node first |

---

## 5. Voice-First Interface

**What it is:** Real-time voice conversations with agents using local or cloud STT/TTS, enabling hands-free agent interaction.

**Current state:** Production-ready. Open-source models match commercial quality.

### STT (Speech-to-Text) Options

| Model | Size | Speed | Quality | Local? | License |
|-------|------|-------|---------|--------|---------|
| **Whisper Large V3 Turbo** | 809M params | 6x faster than V3 | Within 1-2% of V3 | Yes | MIT |
| **Whisper Large V3** | 1.5B params | Baseline | Gold standard multilingual | Yes | MIT |
| **Moonshine** | 31M params | Real-time on CPU | Good for English | Yes | MIT |
| **Deepgram Nova-3** | Cloud | ~200ms latency | Excellent | No | Commercial |

### TTS (Text-to-Speech) Options

| Model | Size | Speed | Quality | Local? | License |
|-------|------|-------|---------|--------|---------|
| **Kokoro** | 82M params | 97ms TTFB, 96x real-time on GPU | Near-commercial quality | Yes | Apache 2.0 |
| **Piper** | ~50M params | Real-time on CPU | Good, robotic at times | Yes | MIT |
| **ElevenLabs** | Cloud | ~300ms latency | Best quality | No | Commercial |
| **OpenAI TTS** | Cloud | ~400ms latency | Very good | No | Commercial |

### Kokoro Changes the Game

Kokoro is a lightweight TTS model with just 82 million parameters that delivers speech quality comparable to much larger commercial models. At 97ms baseline time-to-first-byte and 96x real-time throughput on a basic cloud GPU, it is fast enough for natural conversation. Apache 2.0 license means full commercial use with no API costs.

### Architecture for Agentik OS

```
Microphone → Whisper Turbo (local) → Agent Runtime → Kokoro (local) → Speaker
                 ~200ms                  ~1-5s              ~100ms
                                    Total: ~1.5-5.5s end-to-end
```

For the dashboard, use the Web Audio API + WebSocket:
1. Browser captures audio chunks via MediaRecorder
2. Chunks stream to Agentik OS runtime over WebSocket
3. Whisper processes incrementally (streaming transcription)
4. Agent processes text, streams response tokens
5. Kokoro converts response chunks to audio
6. Audio chunks stream back to browser

### Voice Rooms

Multiple users can join a voice channel where agents participate alongside humans. This uses the same architecture as the channel bridge -- a "voice channel" is just another channel adapter. LiveKit (open-source WebRTC SFU) is ideal for the media server component.

| Aspect | Value |
|--------|-------|
| **Implementation complexity** | Medium -- individual components are mature, the integration pipeline needs careful latency optimization |
| **Priority** | **P1** -- voice is the most natural interface. "Talk to your agents" is immediately compelling |

---

## 6. Browser Extension

**What it is:** A Chrome/Firefox extension that connects to your Agentik OS instance, providing agent assistance on any webpage.

**Current state:** Ready to build. Chrome Extension Manifest V3 is stable, and content script injection is well-understood.

### Capabilities

| Feature | How | Complexity |
|---------|-----|------------|
| **Page context extraction** | Content script reads DOM, sends to agent | Low |
| **Screenshot capture** | `chrome.tabs.captureVisibleTab` + vision model | Low |
| **Form filling** | Agent generates fill instructions, content script executes | Medium |
| **Page interaction** | Click, scroll, type via content script | Medium |
| **Tab management** | `chrome.tabs` API for multi-tab workflows | Low |
| **Side panel chat** | Chrome Side Panel API for persistent agent UI | Low |
| **Network interception** | `chrome.webRequest` for API monitoring | Medium |

### Architecture

```
+-------------------+     WebSocket     +-------------------+
| Browser Extension |<================>| Agentik OS Runtime |
|                   |                   |                    |
| - Content scripts |  Page context     | - Agent processes  |
| - Side panel UI   |  Screenshots      | - MCP servers      |
| - Background SW   |  User actions     | - Model router     |
+-------------------+  Agent commands   +-------------------+
```

The extension becomes an MCP server itself -- it exposes tools like `browser.getPageContent`, `browser.screenshot`, `browser.click`, `browser.fillForm` that agents can invoke through the standard MCP protocol.

### Limitations

- Manifest V3 service workers have limited lifespan (Chrome kills them after ~5 minutes of inactivity)
- Cannot access browser internals (bookmarks sync, password manager, etc. require explicit permissions)
- Cross-origin restrictions limit what content scripts can read on certain pages
- Firefox and Safari have different extension APIs, requiring abstraction

| Aspect | Value |
|--------|-------|
| **Implementation complexity** | Medium -- extension development is well-documented, real complexity is in the agent-browser interaction protocol |
| **Priority** | **P2** -- excellent power-user feature, but requires the core platform to be solid first |

---

## 7. Mobile Native

**What it is:** A mobile client for Agentik OS that provides agent access from phone/tablet.

**Current state:** Multiple viable paths, each with clear trade-offs.

### Comparison

| Approach | Time to MVP | Native Feel | Offline | Push Notifications | App Store | Maintenance |
|----------|-------------|------------|---------|-------------------|-----------|-------------|
| **PWA** | 2 weeks | 70% | Service Worker cache | Web Push (limited iOS) | No install needed | Low |
| **Expo/React Native** | 6 weeks | 95% | SQLite + sync | Full native | Yes | Medium |
| **Native (Swift/Kotlin)** | 12+ weeks | 100% | Full | Full | Yes | High (2 codebases) |
| **Capacitor (web wrapper)** | 3 weeks | 80% | Service Worker | Native plugin | Yes | Low-Medium |

### Recommendation: PWA First, Expo Later

**Phase 1 (PWA)**: The Agentik OS dashboard is already Next.js. Making it a PWA requires:
- `next-pwa` plugin for service worker generation
- Web app manifest with icons
- Responsive design (already have shadcn/ui)
- WebSocket connection for real-time agent responses

This gets 80% of the value with 10% of the effort. Users install from browser, get home screen icon, push notifications (Android, limited iOS).

**Phase 2 (Expo)**: When mobile-specific features become necessary:
- Voice input with always-on microphone (requires native audio)
- Background agent processing
- Deep OS integration (Shortcuts, Widgets, Share extension)
- Local model inference via MLX (iOS) or llama.cpp (Android)

Agentik OS already has Expo expertise in the ecosystem (LifePixels, SagaForge use Expo + Convex + Clerk). The stack is proven.

| Aspect | Value |
|--------|-------|
| **Implementation complexity** | Low (PWA), Medium (Expo) |
| **Priority** | **P1** (PWA) / **P2** (Expo native) -- mobile access to agents is essential |

---

## 8. Streaming Architecture

**What it is:** The real-time transport layer for streaming agent responses, tool call progress, and dashboard updates to clients.

**Current state:** WebSockets are the correct choice for 2026. WebTransport is the future.

### Protocol Comparison

| Protocol | Browser Support | Bidirectional | Multiplexed Streams | Head-of-Line Blocking | Maturity |
|----------|----------------|--------------|---------------------|----------------------|----------|
| **Server-Sent Events** | 100% | No (server-to-client only) | No | Yes (HTTP/1.1) | Stable |
| **WebSocket** | 100% | Yes | No (single connection) | Yes (TCP) | Stable, production standard |
| **WebTransport** | ~75% (no Safari) | Yes | Yes (multiple streams) | No (QUIC/UDP) | Experimental |

### Why WebSocket Wins (For Now)

WebTransport provides multiplexed streams over QUIC and eliminates head-of-line blocking, but Safari does not support it and server infrastructure is immature. WebSockets are the practical choice for production real-time web applications in 2026 and likely for the next 2-3 years.

### Recommended Architecture

```typescript
// Dual-layer streaming
{
  // Layer 1: WebSocket for real-time agent interaction
  agentStream: "WebSocket",  // Bidirectional, token-by-token streaming

  // Layer 2: SSE for dashboard updates (simpler, auto-reconnect)
  dashboardUpdates: "SSE",   // One-way: event store changes, agent status, metrics

  // Layer 3 (future): WebTransport when Safari ships support
  futureTransport: "WebTransport"  // Multiplexed agent streams over single connection
}
```

For the agent-to-agent internal communication (runtime-to-runtime), use raw TCP or Unix domain sockets via Hono. No need for browser protocols internally.

### Convex Integration

Convex already provides real-time subscriptions. The dashboard can subscribe to Convex queries for state changes (agent list, conversation history, metrics) without custom WebSocket management. Use WebSocket only for the active streaming response during a conversation.

| Aspect | Value |
|--------|-------|
| **Implementation complexity** | Low -- WebSocket + SSE are well-understood, Convex handles most dashboard reactivity |
| **Priority** | **P0** -- streaming is foundational infrastructure, required for any real-time agent interaction |

---

## 9. Vector Database Options

**What it is:** The storage layer for agent memory embeddings, RAG knowledge bases, and semantic search.

**Current state:** Mature ecosystem with clear winners per use case.

### Comparison for Agentik OS

| Database | Type | Embedding Scale | Query Latency | Disk Usage | Self-Hosted | Best For |
|----------|------|----------------|---------------|------------|-------------|----------|
| **LibSQL (Turso)** | Embedded (SQLite fork) | <1M vectors | ~5-20ms | Minimal | Yes (single binary) | **Default choice** -- zero setup, vectors are a column type |
| **Qdrant** | Dedicated vector DB | 10M-1B vectors | <10ms at scale | Moderate | Yes (Docker) | Production scale, filtered search, metadata-heavy |
| **ChromaDB** | Embedded/Client-server | <10M vectors | ~10-50ms | Low | Yes | Prototyping, Python-heavy stacks |
| **pgvector** | PostgreSQL extension | 10-100M vectors | ~70-100ms (optimized) | Moderate | Yes | Teams already on PostgreSQL |
| **Milvus** | Distributed vector DB | 1B+ vectors | <10ms | High | Yes (K8s recommended) | Enterprise scale, multi-tenant |

### Recommendation: LibSQL Default, Qdrant at Scale

**LibSQL is the optimal default** for Agentik OS. It is a fork of SQLite maintained by Turso with native vector search built in -- no extensions, no separate process, no network latency. Vectors are just a column type. It works in every build including fully offline with zero network connectivity. It uses the DiskANN algorithm for approximate nearest neighbors on larger datasets.

This aligns perfectly with Agentik OS's self-hosted philosophy: one binary, zero dependencies, vectors included.

**Qdrant becomes the upgrade path** when users hit millions of embeddings or need advanced filtering. It runs as a single Docker container and has excellent TypeScript client support.

```typescript
// Memory layer abstraction
interface VectorStore {
  upsert(id: string, embedding: number[], metadata: Record<string, any>): Promise<void>;
  search(embedding: number[], topK: number, filter?: Filter): Promise<SearchResult[]>;
  delete(id: string): Promise<void>;
}

// Default: LibSQL (embedded, zero config)
class LibSQLVectorStore implements VectorStore { ... }

// Scale: Qdrant (when >1M embeddings)
class QdrantVectorStore implements VectorStore { ... }
```

| Aspect | Value |
|--------|-------|
| **Implementation complexity** | Low (LibSQL), Medium (Qdrant integration) |
| **Priority** | **P0** -- agent memory is a core system, and the vector store powers RAG, long-term memory, and semantic search |

---

## 10. AI Model Innovations

**What it is:** Emerging model capabilities that change what agents can do, arriving in 2026 models.

**Current state:** Rapidly evolving. Every quarter brings new capabilities.

### Key Developments

| Innovation | Status | Impact on Agentik OS |
|-----------|--------|---------------------|
| **Reliable tool use** | Production (Claude, GPT-4o) | Agents can chain 10+ tool calls without derailing. Model Router can trust tool call formatting. |
| **Multi-modal input** | Production (vision), Beta (audio) | Agents can process screenshots, documents, voice simultaneously. Browser extension sends page screenshots for visual understanding. |
| **Structured output (JSON mode)** | Production | Agent responses can be guaranteed-valid JSON. Eliminates parsing failures in tool call chains. |
| **Extended thinking / chain-of-thought** | Production (Claude) | Agents can reason through complex multi-step problems before acting. Critical for planning agents. |
| **Computer use** | Beta (Claude, GPT) | Agents can directly control desktop/browser. Overlaps with browser extension but more powerful. |
| **Real-time streaming APIs** | Production | Token-by-token streaming with tool call deltas. Enables progressive UI updates during long agent runs. |
| **Sub-1s TTFT for small models** | Production (local) | Ollama/MLX models respond faster than cloud APIs for simple tasks. Smart routing becomes critical. |
| **200K+ context windows** | Production (Claude, Gemini) | Agents can ingest entire codebases or document sets. Changes RAG strategy -- sometimes "just stuff it in context" beats retrieval. |
| **Multi-agent native protocols** | Emerging (A2A, ACP) | Google's Agent-to-Agent protocol and IBM/BeeAI's Agent Communication Protocol standardize how agents talk to each other. Agentik OS should adopt or interoperate. |

### Model Router Intelligence

The real innovation for Agentik OS is not any single model capability but the **smart routing** between them:

```
User message → Classify complexity → Route to optimal model

"What time is it?" → Simple → Ollama Qwen 0.5B (free, 50ms)
"Summarize this PDF" → Medium → Claude Haiku (cheap, fast)
"Architect a microservice" → Complex → Claude Opus (expensive, best)
"What's in this image?" → Vision → GPT-4o (best vision)
"Write and run this code" → Tool-heavy → Claude Sonnet (best tool use)
```

| Aspect | Value |
|--------|-------|
| **Implementation complexity** | Low-Medium -- model providers already have SDKs, the routing logic is the differentiator |
| **Priority** | **P0** -- multi-model routing is a stated core feature of Agentik OS |

---

## 11. Observability Stack

**What it is:** Monitoring, tracing, and debugging infrastructure for understanding what agents are doing, why they fail, and how much they cost.

**Current state:** Production-ready. OpenTelemetry GenAI semantic conventions are stabilizing.

### OpenTelemetry for AI Agents

The OpenTelemetry project has a dedicated Generative AI SIG (Special Interest Group) that has defined semantic conventions for LLM/GenAI applications. These conventions standardize attributes like model parameters, response metadata, token usage, and tool invocations into structured spans.

Every agent action in Agentik OS should emit a span:

```
[Agent Run: "Research task"]
  ├── [Model Call: claude-sonnet] tokens_in=1200, tokens_out=800, cost=$0.006
  │   └── [Tool Call: web_search] duration=1.2s, status=ok
  ├── [Model Call: claude-sonnet] tokens_in=3400, tokens_out=1200, cost=$0.012
  │   ├── [Tool Call: read_file] duration=0.05s, status=ok
  │   └── [Tool Call: write_file] duration=0.08s, status=ok
  └── [Model Call: claude-haiku] tokens_in=500, tokens_out=200, cost=$0.0004
      summary generation
```

### Recommended Stack

| Layer | Tool | Why |
|-------|------|-----|
| **Instrumentation** | OpenTelemetry JS SDK + GenAI semantic conventions | Industry standard, vendor-neutral |
| **Collection** | OpenTelemetry Collector | Receives, processes, exports telemetry |
| **Trace Storage** | Grafana Tempo (or Jaeger) | Free, self-hosted, integrates with Grafana |
| **Metrics Storage** | Prometheus (or VictoriaMetrics) | Time-series for cost tracking, token usage, latency |
| **Dashboards** | Grafana | Customizable, free, self-hosted |
| **Logs** | Grafana Loki | Log aggregation correlated with traces |
| **AI-specific** | Langfuse (optional) | Purpose-built LLM observability with OpenTelemetry native support |

### Custom Dashboard in Agentik OS

Rather than requiring users to set up Grafana, Agentik OS should have built-in observability in the dashboard:

- **Cost tracker**: Real-time spend per agent, per model, per user (the "Cost X-Ray" feature)
- **Trace viewer**: Visual timeline of agent actions (like Chrome DevTools Network tab but for agent runs)
- **Error feed**: Failed tool calls, model errors, timeout events
- **Token analytics**: Usage trends, context window utilization, cache hit rates

Export to OpenTelemetry for users who want Grafana/Datadog integration.

| Aspect | Value |
|--------|-------|
| **Implementation complexity** | Medium -- OTel SDK integration is straightforward, building the custom dashboard takes effort |
| **Priority** | **P1** -- observability is critical for debugging agents and managing costs. The built-in dashboard is a differentiator |

---

## 12. Plugin Distribution

**What it is:** How users install, update, and share MCP server plugins and agent skills for Agentik OS.

**Current state:** Multiple viable paths, with WASM + OCI emerging as the most interesting.

### Distribution Channel Comparison

| Channel | Cold Install | Size | Isolation | Versioning | Existing Ecosystem |
|---------|-------------|------|-----------|------------|-------------------|
| **npm/JSR** | `npm install` (~5s) | Variable | None (runs in-process) | semver | Massive (millions of packages) |
| **Docker/OCI** | `docker pull` (~30s) | 50-500 MB | Full container | Tags + digests | Large |
| **WASM modules (OCI registry)** | Pull + instantiate (~1s) | 0.1-5 MB | Memory sandbox | Tags + digests | Growing |
| **Git clone** | `git clone` (~10s) | Variable | None | Commits/tags | Universal |

### WASM via OCI is the Future

The most compelling approach for Agentik OS is distributing MCP server plugins as WASM components via OCI registries. Projects like Hyper-MCP and wasmcp already demonstrate this: MCP servers compiled to WASM, distributed via OCI registries (ghcr.io, Docker Hub), and loaded in milliseconds. Full servers can weigh under 1 MB.

```yaml
# agentik-os skill manifest
name: "code-reviewer"
version: "1.2.0"
runtime: "wasm"                    # or "docker" or "node"
source: "oci://ghcr.io/agentik/code-reviewer:1.2.0"
permissions:
  - mcp:github.read
  - mcp:github.write
  - model:claude-sonnet
```

### Recommended Strategy

1. **npm for TypeScript MCP servers** (lowest friction for JS ecosystem developers)
2. **OCI for WASM plugins** (portable, tiny, sandboxed, versioned)
3. **Docker for heavy-weight skills** (when WASM cannot support the dependency)
4. **Built-in marketplace registry** (Agentik OS hosts its own OCI-compatible registry for community plugins)

| Aspect | Value |
|--------|-------|
| **Implementation complexity** | Medium -- OCI client library exists, WASM loading via Extism works, but marketplace UX/trust/review pipeline is significant |
| **Priority** | **P1** -- plugin distribution is the backbone of the marketplace. Start with npm, add OCI+WASM as the ecosystem matures |

---

## 13. Offline Sync

**What it is:** Allow agents to work offline (local model, local tools) and sync state when connectivity returns, using CRDTs for conflict-free merging.

**Current state:** Production-ready libraries exist. Integration with event-sourced systems requires careful design.

### CRDT Library Options

| Library | Language | Size | Performance | Best For |
|---------|----------|------|-------------|----------|
| **Yjs** | TypeScript | ~30 KB | Best for large documents, binary encoding | Collaborative editing, real-time sync |
| **Automerge 3** | Rust + WASM bindings | ~200 KB | 10x memory reduction from v2 | Rich data types, offline-first apps |
| **SyncedStore** | TypeScript (Yjs wrapper) | ~35 KB | Same as Yjs | Simpler API, reactive bindings |

### How It Fits Agentik OS

Agentik OS is event-sourced. Every action is an immutable event. This actually makes offline sync simpler than CRDT-over-mutable-state:

```
Online:  Event A → Event B → Event C → (server)
Offline: Event A → Event B → Event D → Event E → (local queue)
Sync:    Merge by timestamp + causal ordering → A, B, C, D, E
```

Since events are immutable and append-only, there are no "conflicts" in the traditional sense. The challenge is **ordering** and **deduplication**:
- Events from offline period get logical timestamps (Hybrid Logical Clocks)
- On reconnect, local events are sent to the server, server events are received
- The event store reconciles ordering
- Projections (current state views) are rebuilt from the merged event log

### Where CRDTs Are Still Needed

For collaborative agent memory (multiple users updating the same knowledge base), CRDTs handle the mutable shared state:
- Shared context documents (Yjs Y.Doc)
- Agent configuration (last-write-wins register)
- Conversation threads (append-only log -- naturally a CRDT)

### Implementation Path

1. **Local event queue**: SQLite (or LibSQL) stores events when offline
2. **Sync protocol**: On reconnect, exchange event ranges with server (similar to Automerge sync protocol)
3. **Convex integration**: Convex mutations become the online write path, local SQLite is the offline buffer
4. **Conflict resolution**: Event timestamps + agent ID for ordering, idempotency keys for deduplication

| Aspect | Value |
|--------|-------|
| **Implementation complexity** | High -- offline sync is always harder than it looks, especially with an event-sourced system and external tool calls |
| **Priority** | **P2** -- important for mobile and intermittent connectivity, but not blocking for the initial release |

---

## 14. Security Innovations

**What it is:** Hardware and cryptographic protections for agent memory, model interactions, and user data that go beyond standard application security.

**Current state:** Maturing rapidly. TEEs are production-ready. Homomorphic encryption remains impractical for real-time AI.

### Trusted Execution Environments (TEEs)

TEEs are hardware-isolated environments within a CPU where data is encrypted in memory and invisible to the OS, hypervisor, or cloud provider. The Confidential Computing Consortium specifically addresses agentic AI workloads: agents from multiple owners can execute and interact on the same infrastructure without any party seeing the other's data.

| TEE Technology | Vendor | Status | Use Case |
|---------------|--------|--------|----------|
| **Intel TDX** | Intel | Production (2026 completion) | Full VM isolation, largest enclave boundary |
| **AMD SEV-SNP** | AMD | Production | VM-level confidential computing |
| **Arm TrustZone** | Arm | Production | Mobile/embedded trusted execution |
| **NVIDIA Confidential Computing** | NVIDIA (Hopper/Blackwell) | Production | GPU memory encryption for model weights |

### How TEEs Fit Agentik OS

For multi-tenant Agentik OS deployments (SaaS mode), TEEs solve the trust problem:

```
User A's agent memory ──┐
                        ├── TEE Enclave (encrypted in memory)
User B's agent memory ──┘   Neither user nor the host can see the other's data
```

Agent memory (conversation history, tool credentials, personal context) runs inside a TEE. Even the Agentik OS host operator cannot read user data. This enables a hosted marketplace where agents handle sensitive data (medical, legal, financial) with verifiable privacy.

### Practical Security Layers for Agentik OS

| Layer | Technology | Complexity | Priority |
|-------|-----------|-----------|----------|
| **Skill sandboxing** | WASM linear memory isolation (Extism) | Low (built-in) | P0 |
| **Secret management** | Encrypted at rest (AES-256), in-memory only during use | Low | P0 |
| **MCP tool permissions** | Per-agent capability grants, principle of least privilege | Medium | P0 |
| **Audit log** | Immutable event log of all agent actions (already event-sourced) | Low | P0 |
| **Network isolation** | Skills cannot make arbitrary network calls, host-controlled HTTP | Medium | P1 |
| **TEE for multi-tenant** | Intel TDX / AMD SEV-SNP for memory encryption | High (requires specific hardware) | P2 |
| **Homomorphic encryption** | Compute on encrypted agent memory without decryption | Impractical (1000x+ overhead) | P3 (research) |

### Honest Assessment of Homomorphic Encryption

Fully homomorphic encryption (FHE) for agent memory is theoretically beautiful but practically impossible for real-time AI in 2026. FHE operations are 1000-10000x slower than plaintext operations. It may become viable for specific narrow use cases (encrypted search over memory) by 2028, but it is not a near-term option for Agentik OS.

| Aspect | Value |
|--------|-------|
| **Implementation complexity** | Low (WASM sandboxing, secrets), Medium (permissions), High (TEE) |
| **Priority** | **P0** for foundational security (sandboxing, secrets, permissions), **P2** for TEE, **P3** for FHE |

---

## Priority Summary

### P0 -- Must Have (Core Architecture)

| Technology | Why |
|-----------|-----|
| Local LLM Integration | "Works with zero API keys" is the self-hosted killer feature |
| Streaming Architecture | WebSocket + SSE for real-time agent responses |
| Vector Database (LibSQL) | Agent memory and RAG require vector search |
| AI Model Router | Multi-model routing is a stated core feature |
| Security Foundations | WASM sandboxing, secrets management, MCP permissions |

### P1 -- Should Have (Major Differentiators)

| Technology | Why |
|-----------|-----|
| WASM Skills (Extism) | Instant skill loading, marketplace scalability |
| Voice-First Interface | Most natural way to interact with agents |
| Mobile PWA | Agents accessible from phone |
| Observability Dashboard | Cost tracking and debugging are essential |
| Plugin Distribution (npm + OCI) | Marketplace backbone |

### P2 -- Nice to Have (Power Features)

| Technology | Why |
|-----------|-----|
| Edge Deployment | Latency optimization for global users |
| Browser Extension | Agents that help everywhere |
| Expo Native Mobile | Deep OS integration, local inference |
| Offline Sync | Mobile and intermittent connectivity |
| TEE Multi-Tenant | Enterprise privacy guarantees |

### P3 -- Future Vision (Research)

| Technology | Why |
|-----------|-----|
| P2P Agent Network | Decentralized agent mesh |
| WebTransport | Next-gen streaming (when Safari supports it) |
| Homomorphic Encryption | Compute on encrypted memory (impractical today) |

---

## Implementation Roadmap Suggestion

```
Month 1-2:  P0 foundations (streaming, vector DB, model router, local LLM)
Month 3-4:  P0 security + P1 starts (WASM skills, voice prototype, PWA)
Month 5-6:  P1 completion (observability, plugin distribution, voice production)
Month 7-9:  P2 features (edge, browser extension, offline sync)
Month 10+:  P3 research (P2P, WebTransport, advanced crypto)
```

---

## Sources and References

- [Extism - Universal Plugin System](https://extism.org/)
- [Hyper-MCP - WASM MCP Servers](https://github.com/hyper-mcp-rs/hyper-mcp)
- [wasmcp - Build MCP Servers with WebAssembly](https://github.com/wasmcp/wasmcp)
- [WebAssembly Runtime Benchmarks 2026](https://wasmruntime.com/en/benchmarks)
- [WebSockets vs WebTransport: Current Reality](https://websocket.org/comparisons/webtransport/)
- [WebTransport at FOSDEM 2026](https://fosdem.org/2026/schedule/event/9DEU7E-intro_to_webtransport_-_the_next_websocket/)
- [Cloudflare Agents Documentation](https://developers.cloudflare.com/agents/)
- [js-libp2p v3.0.0 Release](https://blog.libp2p.io/2025-09-30-js-libp2p/)
- [Best Open Source STT Models 2026 (Northflank)](https://northflank.com/blog/best-open-source-speech-to-text-stt-model-in-2026-benchmarks)
- [Best Open Source TTS Models 2026 (BentoML)](https://www.bentoml.com/blog/exploring-the-world-of-open-source-text-to-speech-models)
- [Local Voice AI with Ollama + Kokoro + Whisper + LiveKit](https://github.com/ShayneP/local-voice-ai)
- [MLX on Apple M5 (Apple ML Research)](https://machinelearning.apple.com/research/exploring-llms-mlx-m5)
- [Production-Grade Local LLM Inference on Apple Silicon (arXiv)](https://arxiv.org/abs/2511.05502)
- [LibSQL Native Vector Search (Turso)](https://turso.tech/vector)
- [Best Vector Databases 2026 (Redis)](https://redis.io/blog/best-open-source-vector-databases-comparison/)
- [pgvector vs Qdrant Comparison](https://www.tigerdata.com/blog/pgvector-vs-qdrant)
- [OpenTelemetry for Generative AI](https://opentelemetry.io/blog/2024/otel-generative-ai/)
- [AG2 OpenTelemetry Tracing for Multi-Agent Systems](https://docs.ag2.ai/latest/docs/blog/2026/02/08/AG2-OpenTelemetry-Tracing/)
- [Langfuse OpenTelemetry Integration](https://langfuse.com/integrations/native/opentelemetry)
- [Automerge - CRDT Library](https://automerge.org/docs/hello/)
- [Yjs - Shared Data Types for Collaborative Software](https://github.com/yjs/yjs)
- [Local-First Track at FOSDEM 2026](https://fosdem.org/2026/schedule/track/local-first/)
- [Protecting Agentic AI with Confidential Computing](https://confidentialcomputing.io/2026/01/20/protecting-agentic-ai-workloads-with-confidential-computing/)
- [NVIDIA Confidential Computing for AI](https://www.nvidia.com/en-us/data-center/solutions/confidential-computing/)

---

*Last updated: 2026-02-13*
*Author: Agentik OS Architecture Team*
