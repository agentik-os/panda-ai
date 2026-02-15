/**
 * WebSocket Provider
 *
 * Initializes WebSocket client and makes it available globally.
 * Wraps app to enable real-time updates throughout dashboard.
 */

"use client";

import { useEffect, useRef } from "react";
import {
  createWebSocketClient,
  type WebSocketClient,
} from "@/lib/websocket-client";
import { setGlobalWebSocketClient } from "@/hooks/use-websocket";

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") {
      return;
    }

    // Create WebSocket client
    if (!clientRef.current) {
      console.log("[WebSocket Provider] Initializing WebSocket client");

      clientRef.current = createWebSocketClient({
        autoConnect: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 3000,
      });

      // Make client available to hooks
      setGlobalWebSocketClient(clientRef.current);
    }

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        console.log("[WebSocket Provider] Disconnecting WebSocket client");
        clientRef.current.disconnect();
        setGlobalWebSocketClient(null);
        clientRef.current = null;
      }
    };
  }, []);

  return <>{children}</>;
}
