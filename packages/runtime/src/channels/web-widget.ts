import type {
  ChannelAdapter,
  ChannelConfig,
  RawMessage,
  ResponseContent,
  RichContent,
} from "@agentik-os/shared";
import { createServer, IncomingMessage, ServerResponse, Server } from "http";
import crypto from "crypto";

/**
 * Web Widget Channel Adapter
 *
 * Provides an embeddable chat widget for any website via HTTP + WebSocket-like
 * server-sent events pattern. Enables real-time bidirectional communication
 * between website visitors and AI agents.
 *
 * Features:
 * - REST API for message sending and session management
 * - Server-Sent Events (SSE) for real-time message delivery
 * - Session management with in-memory storage
 * - CORS handling for cross-origin embedding
 * - API key authentication
 * - Rate limiting (60 requests per minute per session)
 * - Embeddable widget script served at /api/widget.js
 */

interface WebWidgetSession {
  id: string;
  userId: string;
  agentId: string;
  messages: WebWidgetMessage[];
  connectedAt: Date;
}

interface WebWidgetMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  richContent?: RichContent[];
  timestamp: Date;
}

interface SSEClient {
  sessionId: string;
  response: ServerResponse;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class WebWidgetChannel implements ChannelAdapter {
  readonly name = "web" as const;

  private server?: Server;
  private messageHandler?: (msg: RawMessage) => Promise<void>;
  private connected = false;
  private sessions = new Map<string, WebWidgetSession>();
  private sseClients = new Map<string, SSEClient[]>();
  private rateLimits = new Map<string, RateLimitEntry>();
  private port = 3100;
  private corsOrigins: string[] = ["*"];
  private apiKey?: string;

  async connect(config: ChannelConfig): Promise<void> {
    this.port = (config.options.port as number) || 3100;
    this.corsOrigins = (config.options.corsOrigins as string[]) || ["*"];
    this.apiKey = config.options.apiKey as string | undefined;

    return await new Promise<void>((resolve, reject) => {
      try {
        this.server = createServer((req, res) => {
          this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
          console.log(`✅ Web Widget Channel listening on port ${this.port}`);
          this.connected = true;
          resolve();
        });

        this.server.on("error", (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    // Close all SSE connections
    for (const [, clients] of this.sseClients) {
      for (const client of clients) {
        try {
          client.response.end();
        } catch {
          // Client may already be disconnected
        }
      }
    }
    this.sseClients.clear();

    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server?.close(() => resolve());
      });
    }

    this.sessions.clear();
    this.rateLimits.clear();
    this.connected = false;
    console.log("👋 Web Widget Channel disconnected");
  }

  onMessage(handler: (msg: RawMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async send(to: string, content: ResponseContent): Promise<void> {
    if (!this.connected) {
      throw new Error("Web Widget channel not connected");
    }

    const session = this.sessions.get(to);
    if (!session) {
      console.log(`No session found for: ${to}`);
      return;
    }

    const message: WebWidgetMessage = {
      id: `msg_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      role: "agent",
      content: content.text,
      richContent: content.richContent,
      timestamp: new Date(),
    };

    session.messages.push(message);

    // Push to SSE clients for this session
    this.pushToSSEClients(to, {
      type: "message",
      sessionId: to,
      content: content.text,
      richContent: content.richContent,
      messageId: message.id,
      timestamp: message.timestamp.toISOString(),
    });
  }

  async sendFile(to: string, file: Buffer, caption?: string): Promise<void> {
    if (!this.connected) {
      throw new Error("Web Widget channel not connected");
    }

    const session = this.sessions.get(to);
    if (!session) {
      console.log(`No session found for: ${to}`);
      return;
    }

    const message: WebWidgetMessage = {
      id: `msg_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      role: "agent",
      content: caption || "File attachment",
      timestamp: new Date(),
    };

    session.messages.push(message);

    this.pushToSSEClients(to, {
      type: "file",
      sessionId: to,
      content: caption || "File attachment",
      file: {
        base64: file.toString("base64"),
        mimeType: "application/octet-stream",
      },
      messageId: message.id,
      timestamp: message.timestamp.toISOString(),
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get a session by ID (for testing and external access)
   */
  getSession(sessionId: string): WebWidgetSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * PRIVATE METHODS
   */

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url || "/", `http://localhost:${this.port}`);
    const pathname = url.pathname;
    const method = req.method?.toUpperCase() || "GET";

    // Set CORS headers
    this.setCORSHeaders(res, req);

    // Handle preflight
    if (method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Route matching
    if (method === "POST" && pathname === "/api/messages") {
      this.handleSendMessage(req, res);
    } else if (method === "GET" && pathname.startsWith("/api/messages/")) {
      const sessionId = pathname.replace("/api/messages/", "");
      this.handleGetMessages(sessionId, res);
    } else if (method === "POST" && pathname === "/api/sessions") {
      this.handleCreateSession(req, res);
    } else if (method === "GET" && pathname === "/api/widget.js") {
      this.handleWidgetScript(res);
    } else if (method === "GET" && pathname.startsWith("/api/events/")) {
      const sessionId = pathname.replace("/api/events/", "");
      this.handleSSE(sessionId, res);
    } else if (method === "GET" && pathname === "/api/health") {
      this.handleHealth(res);
    } else {
      this.sendJSON(res, 404, { error: "Not found" });
    }
  }

  private async handleSendMessage(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const body = await this.parseBody(req);
      const { sessionId, content, userId } = body;

      // Validation
      if (!sessionId || !content) {
        this.sendJSON(res, 400, { error: "Missing required fields: sessionId, content" });
        return;
      }

      // API key validation
      if (this.apiKey && !this.validateApiKey(req)) {
        this.sendJSON(res, 401, { error: "Invalid or missing API key" });
        return;
      }

      // Rate limiting
      if (this.isRateLimited(sessionId)) {
        this.sendJSON(res, 429, { error: "Rate limit exceeded. Max 60 requests per minute." });
        return;
      }

      // Get or create session
      let session = this.sessions.get(sessionId);
      if (!session) {
        session = {
          id: sessionId,
          userId: userId || `anon_${sessionId}`,
          agentId: "default",
          messages: [],
          connectedAt: new Date(),
        };
        this.sessions.set(sessionId, session);
      }

      const messageId = `msg_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

      // Store user message
      const userMessage: WebWidgetMessage = {
        id: messageId,
        role: "user",
        content,
        timestamp: new Date(),
      };
      session.messages.push(userMessage);

      // Create raw message for pipeline
      const rawMessage: RawMessage = {
        channel: "web",
        channelMessageId: messageId,
        userId: session.userId,
        agentId: session.agentId,
        content,
        timestamp: new Date(),
        metadata: { sessionId },
        raw: body,
      };

      if (!this.messageHandler) {
        this.sendJSON(res, 500, { error: "Message handler not configured" });
        return;
      }

      // Fire and forget to pipeline (response comes via SSE or send())
      this.messageHandler(rawMessage).catch((error) => {
        console.error("Pipeline error:", error);
      });

      this.sendJSON(res, 200, {
        messageId,
        sessionId,
        status: "received",
      });
    } catch (error) {
      console.error("Web Widget message error:", error);
      this.sendJSON(res, 500, {
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  private handleGetMessages(sessionId: string, res: ServerResponse): void {
    // API key validation
    if (this.apiKey) {
      // For GET requests we skip API key validation (widget needs access)
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      this.sendJSON(res, 404, { error: "Session not found" });
      return;
    }

    this.sendJSON(res, 200, {
      sessionId,
      messages: session.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        richContent: m.richContent,
        timestamp: m.timestamp.toISOString(),
      })),
    });
  }

  private async handleCreateSession(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const body = await this.parseBody(req);
      const { userId, agentId } = body;

      const sessionId = `ws_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;

      const session: WebWidgetSession = {
        id: sessionId,
        userId: userId || `anon_${sessionId}`,
        agentId: agentId || "default",
        messages: [],
        connectedAt: new Date(),
      };

      this.sessions.set(sessionId, session);

      this.sendJSON(res, 201, {
        sessionId,
        userId: session.userId,
        agentId: session.agentId,
        connectedAt: session.connectedAt.toISOString(),
      });
    } catch (error) {
      console.error("Session creation error:", error);
      this.sendJSON(res, 500, {
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  private handleWidgetScript(res: ServerResponse): void {
    res.writeHead(200, {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    });
    res.end(this.generateWidgetScript());
  }

  private handleSSE(sessionId: string, res: ServerResponse): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.sendJSON(res, 404, { error: "Session not found" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...this.getCORSHeadersObj(),
    });

    // Send initial connected event
    res.write(`data: ${JSON.stringify({ type: "connected", sessionId })}\n\n`);

    // Register SSE client
    const clients = this.sseClients.get(sessionId) || [];
    const client: SSEClient = { sessionId, response: res };
    clients.push(client);
    this.sseClients.set(sessionId, clients);

    // Remove client on disconnect
    res.on("close", () => {
      const remaining = (this.sseClients.get(sessionId) || []).filter((c) => c !== client);
      if (remaining.length > 0) {
        this.sseClients.set(sessionId, remaining);
      } else {
        this.sseClients.delete(sessionId);
      }
    });
  }

  private handleHealth(res: ServerResponse): void {
    this.sendJSON(res, 200, {
      status: "ok",
      channel: "web",
      connected: this.connected,
      sessions: this.sessions.size,
      sseClients: Array.from(this.sseClients.values()).reduce((acc, clients) => acc + clients.length, 0),
      timestamp: new Date().toISOString(),
    });
  }

  private pushToSSEClients(sessionId: string, data: Record<string, unknown>): void {
    const clients = this.sseClients.get(sessionId) || [];
    const payload = `data: ${JSON.stringify(data)}\n\n`;

    for (const client of clients) {
      try {
        client.response.write(payload);
      } catch {
        // Client disconnected, will be cleaned up
      }
    }
  }

  private setCORSHeaders(res: ServerResponse, req: IncomingMessage): void {
    const origin = req.headers.origin;

    let allowedOrigin: string;
    if (this.corsOrigins.includes("*")) {
      allowedOrigin = origin || "*";
    } else if (origin && this.corsOrigins.includes(origin)) {
      allowedOrigin = origin;
    } else {
      // No Origin header (same-origin / server-to-server) or not in allowed list
      // Still set wildcard for non-browser requests
      allowedOrigin = this.corsOrigins[0] || "*";
    }

    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  private getCORSHeadersObj(): Record<string, string> {
    return {
      "Access-Control-Allow-Origin": this.corsOrigins.includes("*") ? "*" : this.corsOrigins.join(", "),
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    };
  }

  private validateApiKey(req: IncomingMessage): boolean {
    const headerKey = req.headers["x-api-key"] as string | undefined;
    const authHeader = req.headers["authorization"] as string | undefined;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

    const providedKey = headerKey || bearerToken;

    if (!providedKey || !this.apiKey) return false;

    return providedKey === this.apiKey;
  }

  private isRateLimited(sessionId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimits.get(sessionId);

    if (!entry || now > entry.resetAt) {
      this.rateLimits.set(sessionId, { count: 1, resetAt: now + 60_000 });
      return false;
    }

    entry.count++;
    if (entry.count > 60) {
      return true;
    }

    return false;
  }

  private async parseBody(req: IncomingMessage): Promise<any> {
    return await new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
        // Limit body size to 1MB
        if (body.length > 1_048_576) {
          reject(new Error("Request body too large"));
        }
      });
      req.on("end", () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          reject(new Error("Invalid JSON body"));
        }
      });
      req.on("error", reject);
    });
  }

  private sendJSON(res: ServerResponse, status: number, data: unknown): void {
    const body = JSON.stringify(data);
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
  }

  private generateWidgetScript(): string {
    return `
(function() {
  'use strict';

  var WIDGET_SERVER = window.AGENTIK_WIDGET_URL || window.location.origin;
  var SESSION_KEY = 'agentik_session_id';

  function getSessionId() {
    var id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = 'ws_' + Date.now() + '_' + Math.random().toString(36).slice(2, 14);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  function createWidget() {
    var container = document.createElement('div');
    container.id = 'agentik-widget';
    container.innerHTML = '<div id="agentik-widget-btn" style="position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;background:#6366f1;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-size:24px;z-index:9999;">💬</div>';
    document.body.appendChild(container);
    return container;
  }

  window.AgentikWidget = {
    sessionId: getSessionId(),
    init: function(config) {
      if (config && config.serverUrl) WIDGET_SERVER = config.serverUrl;
      createWidget();
    },
    sendMessage: function(content) {
      return fetch(WIDGET_SERVER + '/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: this.sessionId, content: content })
      }).then(function(r) { return r.json(); });
    }
  };
})();
`.trim();
  }
}
