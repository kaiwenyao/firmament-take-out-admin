import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useWebSocket, WebSocketStatus, WS_URL } from "./useWebSocket";

type FakeSocket = any;

// A fake WebSocket class. Every created instance is pushed into instances.
let instances: FakeSocket[] = [];
let WebSocketCtor: any;

class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: FakeSocket[] = [];

  url: string;
  readyState = WebSocket.CONNECTING;
  onopen: any = null;
  onmessage: any = null;
  onerror: any = null;
  onclose: any = null;
  sent: string[] = [];
  closedCalls: Array<{ code?: number; reason?: string }> = [];

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }
  send(msg: string) {
    this.sent.push(msg);
  }
  close(code?: number, reason?: string) {
    this.closedCalls.push({ code, reason });
    this.readyState = WebSocket.CLOSED;
  }
}

const last = () => FakeWebSocket.instances[FakeWebSocket.instances.length - 1];

beforeEach(() => {
  instances = [];
  FakeWebSocket.instances = [];
  WebSocketCtor = globalThis.WebSocket;
  (globalThis as any).WebSocket = FakeWebSocket;
  (window as any).WebSocket = FakeWebSocket;
  cleanup();
});

afterEach(() => {
  (globalThis as any).WebSocket = WebSocketCtor;
  (window as any).WebSocket = WebSocketCtor;
});


const flush = async () => {
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
};

describe("useWebSocket", () => {
  it("exports a WS_URL and the status enum", () => {
    expect(WebSocketStatus.CONNECTING).toBe(0);
    expect(WebSocketStatus.OPEN).toBe(1);
    expect(WebSocketStatus.CLOSED).toBe(3);
    expect(WS_URL).toMatch(/^ws:\/\/|^wss:\/\//);
  });

  it("connects on mount (autoConnect) and reports OPEN when the socket opens", async () => {
    const onOpen = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket({ sid: "s1", onOpen })
    );
    await flush();

    expect(FakeWebSocket.instances.length).toBe(1);
    expect(last().url).toContain("/ws/s1");

    await act(async () => {
      last().readyState = WebSocket.OPEN;
      last().onopen();
    });
    expect(result.current.status).toBe(WebSocketStatus.OPEN);
    expect(result.current.isConnected).toBe(true);
    expect(onOpen).toHaveBeenCalled();
  });

  it("forwards messages, errors and calls send() when open", async () => {
    const onMessage = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket({ sid: "s2", onMessage, onError })
    );
    await flush();

    await act(async () => {
      last().readyState = WebSocket.OPEN;
      last().onopen();
    });
    await act(async () => { last().onmessage({ data: "hi" }); });
    expect(onMessage).toHaveBeenCalledWith("hi");

    let sent = false;
    await act(async () => { sent = result.current.send("ping"); });
    expect(sent).toBe(true);
    expect(last().sent).toEqual(["ping"]);

    await act(async () => { last().onerror({ type: "error" }); });
    expect(onError).toHaveBeenCalled();
  });

  it("send() returns false when not open", async () => {
    const { result } = renderHook(() => useWebSocket({ sid: "s3" }));
    await flush();
    let sent: boolean | undefined;
    await act(async () => { sent = result.current.send("ping"); });
    expect(sent).toBe(false);
  });

  it("handles a clean close (code 1000) without retrying", async () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useWebSocket({ sid: "s4", onClose }));
    await flush();

    await act(async () => {
      last().readyState = WebSocket.OPEN;
      last().onopen();
      last().onclose({ code: 1000 });
    });
    expect(result.current.status).toBe(WebSocketStatus.CLOSED);
    expect(onClose).toHaveBeenCalled();
    expect(result.current.isConnected).toBe(false);
  });

  it("retries with backoff on an abnormal close", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useWebSocket({ sid: "s5" }));
    await act(async () => { vi.advanceTimersByTime(0); });

    await act(async () => {
      last().readyState = WebSocket.OPEN;
      last().onopen();
      last().onclose({ code: 1006 });
    });

    const countAfterClose = FakeWebSocket.instances.length;
    // Backoff for retryCount 0 is 1000ms.
    await act(async () => {
      vi.advanceTimersByTime(1100);
      await Promise.resolve();
    });
    expect(FakeWebSocket.instances.length).toBeGreaterThan(countAfterClose);
    vi.useRealTimers();
  });

  it("does not reconnect when there is no sid", async () => {
    const { result } = renderHook(() =>
      useWebSocket({ sid: "" as string, autoConnect: true })
    );
    await flush();
    expect(FakeWebSocket.instances.length).toBe(0);
    expect(result.current.status).toBe(WebSocketStatus.CLOSED);
  });

  it("disconnect() closes the socket and clears any reconnect timer", async () => {
    const { result } = renderHook(() => useWebSocket({ sid: "s7" }));
    await flush();
    await act(async () => {
      last().readyState = WebSocket.OPEN;
      last().onopen();
      result.current.disconnect();
    });
    expect(last().closedCalls.length).toBeGreaterThan(0);
  });

  it("reconnect() resets retry count and opens a fresh socket", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useWebSocket({ sid: "s8" }));
    await act(async () => { vi.advanceTimersByTime(0); });
    const countBefore = FakeWebSocket.instances.length;
    await act(async () => {
      result.current.reconnect();
      await Promise.resolve();
    });
    expect(FakeWebSocket.instances.length).toBeGreaterThan(countBefore);
    vi.useRealTimers();
  });
});
