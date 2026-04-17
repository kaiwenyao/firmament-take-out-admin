import { useEffect, useRef, useState, useCallback } from "react";

export const WebSocketStatus = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

export type WebSocketStatus = typeof WebSocketStatus[keyof typeof WebSocketStatus];

export interface WebSocketOptions {
  url?: string;
  sid: string;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: string) => void;
  autoConnect?: boolean;
}


// Get current protocol (wss for https, ws for http)
const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';

// Get current domain
const domain = window.location.host;

// Assemble address -> wss://firmament-admin.kaiwen.dev/api/ws
export const WS_URL = `${protocol}${domain}/api`;

export function useWebSocket(options: WebSocketOptions) {
  const {
    url = WS_URL,
    // url = "ws://localhost:8080",
    sid,
    onOpen,
    onClose,
    onError,
    onMessage,
    autoConnect = true,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>(WebSocketStatus.CLOSED);
  const ws = useRef<WebSocket | null>(null);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 10;
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<(() => void) | null>(null);

  // Track component mount state to prevent state updates after unmount
  const isUnmountedRef = useRef(false);

  const callbacksRef = useRef({ onOpen, onClose, onError, onMessage });
  useEffect(() => {
    callbacksRef.current = { onOpen, onClose, onError, onMessage };
  }, [onOpen, onClose, onError, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (ws.current) {
      try {
        if (
          ws.current.readyState === WebSocket.OPEN ||
          ws.current.readyState === WebSocket.CONNECTING
        ) {
          // Optimization: If actively disconnecting, can remove onclose listener
          // This prevents CLOSED state update (optional if you want to keep CLOSED state after disconnect)
          // For state sync, keep close call but check in onclose
          ws.current.close(1000, "Client initiated close");
        }
      } catch (error) {
        console.warn("[WebSocket] Error disconnecting:", error);
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (!sid) {
      // Fix: Check if unmounted
      if (!isUnmountedRef.current) setStatus(WebSocketStatus.CLOSED);
      return;
    }

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (ws.current) {
      const oldSocket = ws.current;
      oldSocket.onopen = null;
      oldSocket.onmessage = null;
      oldSocket.onerror = null;
      oldSocket.onclose = null;

      try {
        oldSocket.close(1000, "Taken over by new connection");
      } catch {
        // ignore
      }
      ws.current = null;
    }

    const wsUrl = `${url}/ws/${sid}`;

    try {
      // Fix: Check if unmounted
      if (!isUnmountedRef.current) setStatus(WebSocketStatus.CONNECTING);

      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        // Fix: Add !isUnmountedRef.current check
        if (ws.current === socket && !isUnmountedRef.current) {
          setStatus(WebSocketStatus.OPEN);
          retryCountRef.current = 0;
          callbacksRef.current.onOpen?.();
        }
      };

      socket.onmessage = (event) => {
        if (ws.current === socket && !isUnmountedRef.current) {
          callbacksRef.current.onMessage?.(event.data);
        }
      };

      socket.onclose = (event) => {
        // Key point: Even if socket matches, if component is unmounted, must NOT setStatus
        if (ws.current === socket) {
          ws.current = null;

          if (!isUnmountedRef.current) {
            setStatus(WebSocketStatus.CLOSED);
            callbacksRef.current.onClose?.();
          }

          if (
            event.code !== 1000 &&
            retryCountRef.current < maxRetries &&
            !isUnmountedRef.current
          ) {
            const delay = Math.min(
              1000 * Math.pow(2, retryCountRef.current),
              30000
            );
            retryCountRef.current += 1;

            if (reconnectTimerRef.current)
              clearTimeout(reconnectTimerRef.current);

            reconnectTimerRef.current = setTimeout(() => {
              // Check unmount state again
              if (!isUnmountedRef.current && connectRef.current) {
                connectRef.current();
              }
            }, delay);
          }
        }
      };

      socket.onerror = (error) => {
        if (ws.current === socket && !isUnmountedRef.current) {
          callbacksRef.current.onError?.(error);
        }
      };
    } catch (error) {
      console.error("[WebSocket] Connection creation failed:", error);
      if (!isUnmountedRef.current) setStatus(WebSocketStatus.CLOSED);
      ws.current = null;
    }
  }, [url, sid]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const send = useCallback((message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
      return true;
    }
    return false;
  }, []);

  const reconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    retryCountRef.current = 0;
    connect();
  }, [connect]);

  // Lifecycle management
  useEffect(() => {
    isUnmountedRef.current = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (autoConnect) {
      timer = setTimeout(() => {
        if (!isUnmountedRef.current) {
          connect();
        }
      }, 0);
    }

    return () => {
      isUnmountedRef.current = true;

      if (timer !== undefined) clearTimeout(timer);

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      retryCountRef.current = maxRetries + 1;

      if (ws.current) {
        try {
          ws.current.close(1000, "Component unmounted");
        } catch {
          // ignore
        }
      }
    };
  }, [connect, autoConnect]);

  return {
    status,
    isConnected: status === WebSocketStatus.OPEN,
    send,
    disconnect,
    reconnect,
    connect,
  };
}
