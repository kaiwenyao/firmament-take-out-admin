import { describe, expect, it, vi } from "vitest";
import type { NavigateFunction } from "react-router-dom";
import { setNavigate, getNavigate } from "./navigation";

describe("navigation utils", () => {
  it("returns null before a navigate instance is set", () => {
    expect(getNavigate()).toBeNull();
  });

  it("setNavigate stores the navigate instance and getNavigate returns it", () => {
    const nav = vi.fn() as unknown as NavigateFunction;
    setNavigate(nav);
    expect(getNavigate()).toBe(nav);
  });

  it("setNavigate can overwrite the stored instance", () => {
    const first = vi.fn() as unknown as NavigateFunction;
    const second = vi.fn() as unknown as NavigateFunction;
    setNavigate(first);
    expect(getNavigate()).toBe(first);
    setNavigate(second);
    expect(getNavigate()).toBe(second);
  });
});
