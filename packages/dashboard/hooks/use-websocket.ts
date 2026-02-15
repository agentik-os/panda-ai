/**
 * React Hook for WebSocket Real-Time Updates
 *
 * Provides easy-to-use React hooks for subscribing to WebSocket channels.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type {
  WebSocketChannel,
  WebSocketEventType,
  WebSocketMessage,
  MessageHandler,
} from "../lib/websocket-client";

/**
 * WebSocket context (to be provided by WebSocketProvider)
 */
let globalWebSocketClient: any = null;

export function setGlobalWebSocketClient(client: any) {
  globalWebSocketClient = client;
}

export function getGlobalWebSocketClient() {
  return globalWebSocketClient;
}

/**
 * Hook to subscribe to a WebSocket channel
 *
 * @param channel - Channel to subscribe to (e.g., "agent:abc123")
 * @param onMessage - Callback when message received
 * @param enabled - Whether subscription is active (default: true)
 *
 * @example
 * ```tsx
 * function AgentStatus({ agentId }: { agentId: string }) {
 *   const { data, isConnected } = useWebSocketChannel(
 *     `agent:${agentId}`,
 *     (message) => {
 *       console.log('Agent update:', message);
 *     }
 *   );
 *
 *   return <div>Connected: {isConnected ? 'Yes' : 'No'}</div>;
 * }
 * ```
 */
export function useWebSocketChannel<T = unknown>(
  channel: WebSocketChannel,
  onMessage?: MessageHandler<T>,
  enabled = true
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage<T> | null>(
    null
  );
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const client = getGlobalWebSocketClient();
    if (!client || !enabled) {
      setIsConnected(false);
      return;
    }

    setIsConnected(client.isConnected());

    // Subscribe to channel
    const handler: MessageHandler<T> = (message) => {
      setLastMessage(message as WebSocketMessage<T>);
      onMessage?.(message as WebSocketMessage<T>);
    };

    unsubscribeRef.current = client.subscribe(channel, handler);

    // Cleanup on unmount or channel change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [channel, enabled, onMessage]);

  return {
    isConnected,
    lastMessage,
    data: lastMessage?.payload,
  };
}

/**
 * Hook to subscribe to a WebSocket event type
 *
 * Listens for specific event types across all channels.
 *
 * @param eventType - Event type to subscribe to (e.g., "cost:new")
 * @param onMessage - Callback when message received
 * @param enabled - Whether subscription is active (default: true)
 *
 * @example
 * ```tsx
 * function CostMonitor() {
 *   const { data: costEvent } = useWebSocketEvent('cost:new');
 *
 *   return <div>Latest cost: ${costEvent?.totalCost}</div>;
 * }
 * ```
 */
export function useWebSocketEvent<T = unknown>(
  eventType: WebSocketEventType,
  onMessage?: MessageHandler<T>,
  enabled = true
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage<T> | null>(
    null
  );
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const client = getGlobalWebSocketClient();
    if (!client || !enabled) {
      setIsConnected(false);
      return;
    }

    setIsConnected(client.isConnected());

    // Subscribe to event type
    const handler: MessageHandler<T> = (message) => {
      setLastMessage(message as WebSocketMessage<T>);
      onMessage?.(message as WebSocketMessage<T>);
    };

    unsubscribeRef.current = client.subscribeToEvent(eventType, handler);

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [eventType, enabled, onMessage]);

  return {
    isConnected,
    lastMessage,
    data: lastMessage?.payload,
  };
}

/**
 * Hook for WebSocket connection status
 *
 * @example
 * ```tsx
 * function ConnectionIndicator() {
 *   const { connected, reconnectAttempts } = useWebSocketConnection();
 *
 *   return (
 *     <div>
 *       {connected ? '🟢 Connected' : '🔴 Disconnected'}
 *       {reconnectAttempts > 0 && ` (${reconnectAttempts} attempts)`}
 *     </div>
 *   );
 * }
 * ```
 */
export function useWebSocketConnection() {
  const [state, setState] = useState({
    connected: false,
    reconnectAttempts: 0,
    subscribedChannels: 0,
  });

  useEffect(() => {
    const client = getGlobalWebSocketClient();
    if (!client) {
      return;
    }

    // Poll connection state
    const interval = setInterval(() => {
      setState(client.getState());
    }, 1000);

    // Initial state
    setState(client.getState());

    return () => clearInterval(interval);
  }, []);

  return state;
}

/**
 * Hook to manually subscribe/unsubscribe
 *
 * Provides subscribe/unsubscribe functions for dynamic channel management.
 *
 * @example
 * ```tsx
 * function DynamicSubscriber() {
 *   const { subscribe, unsubscribe, isConnected } = useWebSocket();
 *
 *   const handleSubscribe = () => {
 *     const unsub = subscribe('agent:abc123', (msg) => {
 *       console.log(msg);
 *     });
 *
 *     // Later: unsub();
 *   };
 *
 *   return <button onClick={handleSubscribe}>Subscribe</button>;
 * }
 * ```
 */
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = getGlobalWebSocketClient();
    if (!client) {
      return;
    }

    setIsConnected(client.isConnected());

    const interval = setInterval(() => {
      setIsConnected(client.isConnected());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const subscribe = useCallback(
    (channel: WebSocketChannel, handler: MessageHandler) => {
      const client = getGlobalWebSocketClient();
      if (!client) {
        console.warn("[useWebSocket] Client not available");
        return () => {};
      }
      return client.subscribe(channel, handler);
    },
    []
  );

  const subscribeToEvent = useCallback(
    (eventType: WebSocketEventType, handler: MessageHandler) => {
      const client = getGlobalWebSocketClient();
      if (!client) {
        console.warn("[useWebSocket] Client not available");
        return () => {};
      }
      return client.subscribeToEvent(eventType, handler);
    },
    []
  );

  const unsubscribe = useCallback(
    (channel: WebSocketChannel, handler: MessageHandler) => {
      const client = getGlobalWebSocketClient();
      if (client) {
        client.unsubscribe(channel, handler);
      }
    },
    []
  );

  return {
    isConnected,
    subscribe,
    subscribeToEvent,
    unsubscribe,
  };
}
