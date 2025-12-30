import { useEffect, useRef, useState, useCallback } from "react";

export enum WebSocketStatus {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

export interface WebSocketOptions {
  url?: string;
  sid: string;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: string) => void;
  autoConnect?: boolean;
}

export function useWebSocket(options: WebSocketOptions) {
  const {
    url = "ws://localhost:8080",
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
  
  // 1. 新增：追踪组件挂载状态，防止卸载后更新 State
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
          // 优化：如果是主动断开，其实可以移除 onclose 监听，
          // 这样就不会触发 CLOSED 状态更新（如果你希望断开后保持 CLOSED 状态，这步可选）
          // 但为了保持状态同步，这里保留 close 调用，但在 onclose 里做判断
          ws.current.close(1000, "前端主动关闭");
        }
      } catch (error) {
        console.warn("[WebSocket] 断开连接时出错:", error);
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (!sid) {
      // 修复：检查是否卸载
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
        oldSocket.close(1000, "被新连接接管");
      } catch {
        // ignore
      }
      ws.current = null;
    }

    const wsUrl = `${url}/ws/${sid}`;

    try {
      // 修复：检查是否卸载
      if (!isUnmountedRef.current) setStatus(WebSocketStatus.CONNECTING);
      
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        // 修复：增加 !isUnmountedRef.current 判断
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
        // 关键点：即使 socket 匹配，如果组件卸载了，也绝对不能 setStatus
        if (ws.current === socket) {
          ws.current = null;
          
          if (!isUnmountedRef.current) {
            setStatus(WebSocketStatus.CLOSED);
            callbacksRef.current.onClose?.();
          }

          if (event.code !== 1000 && retryCountRef.current < maxRetries && !isUnmountedRef.current) {
            const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
            retryCountRef.current += 1;
            
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            
            reconnectTimerRef.current = setTimeout(() => {
              // 再次检查卸载状态
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
      console.error("[WebSocket] 创建连接失败:", error);
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

  // --- 生命周期管理 ---
  useEffect(() => {
    // 每次副作用执行，重置卸载标记（应对 React 18 Strict Mode 的多次挂载）
    isUnmountedRef.current = false; 
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (autoConnect) {
      // 这里的 setTimeout 0 其实在 useEffect 里不是必须的，
      // 因为 useEffect 本身就在渲染提交后执行。不过留着也没坏处。
      timer = setTimeout(() => {
        if (!isUnmountedRef.current) {
          connect();
        }
      }, 0);
    }

    return () => {
      // 2. 标记组件已卸载
      isUnmountedRef.current = true;
      
      if (timer !== undefined) clearTimeout(timer);
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      retryCountRef.current = maxRetries + 1;

      // 3. 安全清理
      if (ws.current) {
        // 在这里，我们其实可以直接暴力 close，因为 isUnmountedRef 已经是 true 了，
        // 就算触发 onclose，上面的逻辑也会拦截 setStatus
        try {
            ws.current.close(1000, "组件卸载");
        } catch {
          // ignore
        }
        // 不必调用 disconnect()，因为 disconnect 内部逻辑比较多，
        // 直接 close 加上 isUnmountedRef=true 的拦截机制最安全
      }
    };
  }, [connect, autoConnect]); // 移除 disconnect 依赖，cleanup 里直接写逻辑更清晰

  return {
    status,
    isConnected: status === WebSocketStatus.OPEN,
    send,
    disconnect,
    reconnect,
    connect,
  };
}