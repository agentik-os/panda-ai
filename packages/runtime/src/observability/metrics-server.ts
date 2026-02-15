/**
 * Prometheus Metrics HTTP Server
 *
 * Exposes metrics in Prometheus text format at GET /metrics
 * Used by Prometheus scraper and Grafana data source.
 */

import { formatPrometheusMetrics } from "./prometheus";

export interface MetricsServerConfig {
  port: number;
  path: string;
  enableCORS: boolean;
}

const DEFAULT_CONFIG: MetricsServerConfig = {
  port: 9090,
  path: "/metrics",
  enableCORS: true,
};

/**
 * Metrics HTTP server
 */
export class MetricsServer {
  private server: ReturnType<typeof Bun.serve> | null = null;
  private config: MetricsServerConfig;

  constructor(config: Partial<MetricsServerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start metrics HTTP server
   */
  public start(): void {
    if (this.server) {
      console.warn("[Metrics] Server already running");
      return;
    }

    this.server = Bun.serve({
      port: this.config.port,
      fetch: (req: Request) => this.handleRequest(req),
    });

    console.log(
      `[Metrics] Server started on http://localhost:${this.config.port}${this.config.path}`
    );
  }

  /**
   * Stop metrics server
   */
  public stop(): void {
    if (this.server) {
      this.server.stop();
      this.server = null;
      console.log("[Metrics] Server stopped");
    }
  }

  /**
   * Handle HTTP request
   */
  private handleRequest(req: Request): Response {
    const url = new URL(req.url);

    // CORS headers
    const headers: Record<string, string> = {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    };

    if (this.config.enableCORS) {
      headers["Access-Control-Allow-Origin"] = "*";
      headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
      headers["Access-Control-Allow-Headers"] = "Content-Type";
    }

    // Handle OPTIONS (CORS preflight)
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers,
      });
    }

    // Handle GET /metrics
    if (req.method === "GET" && url.pathname === this.config.path) {
      const metricsText = formatPrometheusMetrics();
      return new Response(metricsText, {
        status: 200,
        headers,
      });
    }

    // 404 for other paths
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  /**
   * Get server info
   */
  public getInfo() {
    return {
      running: this.server !== null,
      port: this.config.port,
      path: this.config.path,
      url: `http://localhost:${this.config.port}${this.config.path}`,
    };
  }
}

/**
 * Singleton instance
 */
let metricsServer: MetricsServer | null = null;

/**
 * Get or create metrics server instance
 */
export function getMetricsServer(
  config?: Partial<MetricsServerConfig>
): MetricsServer {
  if (!metricsServer) {
    metricsServer = new MetricsServer(config);
  }
  return metricsServer;
}

/**
 * Start metrics server (called on runtime startup)
 */
export function startMetricsServer(
  config?: Partial<MetricsServerConfig>
): void {
  const server = getMetricsServer(config);
  server.start();
}

/**
 * Stop metrics server (called on runtime shutdown)
 */
export function stopMetricsServer(): void {
  if (metricsServer) {
    metricsServer.stop();
    metricsServer = null;
  }
}
