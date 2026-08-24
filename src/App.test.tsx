import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSetNavigate: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastWarning: vi.fn(),
  mockToastError: vi.fn(),
  wsOptions: [] as any[],
  audioPlays: [] as any[],
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.mockNavigate,
  Outlet: () => <div data-testid="outlet" />,
}));

vi.mock("@/utils/navigation", () => ({
  setNavigate: (...a: any[]) => mocks.mockSetNavigate(...a),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...a: any[]) => mocks.mockToastSuccess(...a),
    warning: (...a: any[]) => mocks.mockToastWarning(...a),
    error: (...a: any[]) => mocks.mockToastError(...a),
  },
}));

vi.mock("@/hooks/useWebSocket", () => ({
  useWebSocket: (opts: any) => {
    mocks.wsOptions.push(opts);
    return {
      status: 0,
      isConnected: false,
      send: vi.fn(),
      disconnect: vi.fn(),
      reconnect: vi.fn(),
      connect: vi.fn(),
    };
  },
}));

vi.mock("@/components/Header", () => ({
  default: ({ onToggleSidebar }: any) => (
    <button data-testid="toggle-sidebar" onClick={onToggleSidebar}>
      Header
    </button>
  ),
}));

vi.mock("@/components/Sidebar", () => ({
  default: ({ isCollapsed }: any) => (
    <div data-testid="sidebar" data-collapsed={String(isCollapsed)}>
      Sidebar
    </div>
  ),
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

// Fake Audio used by App to play notification sounds. A shared module-level
// mock is exposed so tests can drive its success/failure behaviour.
const playMock = vi.fn().mockResolvedValue(undefined);
class FakeAudio {
  currentTime = 0;
  play = playMock;
}
const OriginalAudio = globalThis.Audio;

import App from "./App";

const getOnMessage = () => {
  expect(mocks.wsOptions.length).toBeGreaterThan(0);
  return mocks.wsOptions[0].onMessage as (msg: string) => void;
};

beforeEach(() => {
  mocks.mockNavigate.mockClear();
  mocks.mockSetNavigate.mockClear();
  mocks.mockToastSuccess.mockClear();
  mocks.mockToastWarning.mockClear();
  mocks.mockToastError.mockClear();
  mocks.wsOptions = [];
  playMock.mockReset();
  playMock.mockResolvedValue(undefined);
  (globalThis as any).Audio = FakeAudio;
});

afterEach(() => {
  (globalThis as any).Audio = OriginalAudio;
});

describe("App", () => {
  it("renders the header, sidebar, outlet and toaster", () => {
    render(<App />);
    expect(screen.getByTestId("toggle-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
    expect(screen.getByTestId("toaster")).toBeInTheDocument();
  });

  it("registers the navigate function for use outside React", () => {
    render(<App />);
    expect(mocks.mockSetNavigate).toHaveBeenCalledWith(mocks.mockNavigate);
  });

  it("starts with the sidebar expanded and toggles on click", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByTestId("sidebar").dataset.collapsed).toBe("false");
    await user.click(screen.getByTestId("toggle-sidebar"));
    expect(screen.getByTestId("sidebar").dataset.collapsed).toBe("true");
    await user.click(screen.getByTestId("toggle-sidebar"));
    expect(screen.getByTestId("sidebar").dataset.collapsed).toBe("false");
  });

  it("shows a success toast and plays preview audio on a new-order message", async () => {
    render(<App />);
    await act(async () => {
      getOnMessage()(JSON.stringify({ type: 1 }));
      await Promise.resolve();
    });
    expect(mocks.mockToastSuccess).toHaveBeenCalledWith("New order received");
    expect(playMock).toHaveBeenCalled();
  });

  it("shows a warning toast and plays reminder audio for an order reminder", async () => {
    render(<App />);
    await act(async () => {
      getOnMessage()(JSON.stringify({ type: 2, content: "Hurry" }));
      await Promise.resolve();
    });
    expect(mocks.mockToastWarning).toHaveBeenCalledWith(
      "Order reminder: customer is asking for a faster delivery — Hurry"
    );
  });

  it("handles a reminder without content", async () => {
    render(<App />);
    await act(async () => {
      getOnMessage()(JSON.stringify({ type: 2 }));
      await Promise.resolve();
    });
    expect(mocks.mockToastWarning).toHaveBeenCalledWith(
      "Order reminder: customer is asking for a faster delivery"
    );
  });

  it("shows an error toast when audio playback fails", async () => {
    playMock.mockRejectedValue(new Error("blocked"));
    render(<App />);
    await act(async () => {
      getOnMessage()(JSON.stringify({ type: 1 }));
      await Promise.resolve();
    });
    expect(mocks.mockToastSuccess).toHaveBeenCalled();
    expect(mocks.mockToastError).toHaveBeenCalledWith(
      "Could not play notification sound. Click anywhere on the page to enable audio."
    );
  });

  it("ignores malformed JSON messages", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<App />);
    await act(async () => {
      getOnMessage()("{not json");
    });
    expect(mocks.mockToastSuccess).not.toHaveBeenCalled();
    expect(mocks.mockToastWarning).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("connects the WebSocket with the persisted client id", () => {
    render(<App />);
    expect(mocks.wsOptions.length).toBe(1);
    expect(mocks.wsOptions[0].sid).toMatch(/^client_/);
  });
});
