import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount rendered trees after each test to avoid DOM leakage between tests.
afterEach(() => {
  cleanup();
});

// jsdom does not implement matchMedia; Radix UI (used by dialogs, dropdowns,
// popovers) relies on it. Provide a stub so components render in tests.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// jsdom does not implement scrollIntoView, used by Radix Select / dialogs.
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Radix Dialog uses ResizeObserver.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = window.ResizeObserver || ResizeObserverMock;

// Radix Dialog / FocusScope sometimes references PointerEvent.
if (!window.PointerEvent) {
  class PointerEventMock extends Event {}
  window.PointerEvent = PointerEventMock as typeof PointerEvent;
}
