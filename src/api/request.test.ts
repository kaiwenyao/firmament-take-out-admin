import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Shared mutable mock state accessible both to the vi.mock factory (hoisted)
// and to the test bodies.
const mockState = vi.hoisted(() => {
  // Axios instances are callable (instance(config)). We mimic that so the
  // 401 retry path (`instance(originalRequest)`) resolves to a raw response.
  const fakeInstance: any = Object.assign(
    () => Promise.resolve({ code: 1, data: { id: 7 } }),
    {
      interceptors: {
        request: {
          use: (fn: any) => {
            mockState.requestHandler = fn;
          },
        },
        response: {
          use: (ok: any, err: any) => {
            mockState.responseResolveHandler = ok;
            mockState.responseRejectHandler = err;
          },
        },
      },
      request: vi.fn().mockResolvedValue({ code: 1, data: { id: 7 } }),
    }
  );

  const create = vi.fn(() => fakeInstance);
  const post = vi.fn().mockResolvedValue({
    data: { code: 1, data: { token: "newToken", refreshToken: "newRefresh" } },
  });

  return {
    create,
    post,
    requestHandler: undefined as ((c: any) => any) | undefined,
    responseResolveHandler: undefined as ((r: any) => any) | undefined,
    responseRejectHandler: undefined as ((e: any) => any) | undefined,
  };
});

vi.mock("axios", () => ({
  default: { create: mockState.create, post: mockState.post },
}));

import instance from "./request";

// IMPORTANT: `instance` (the request.ts module) is referenced in the first
// test below. Its import runs side-effects (axios.create + interceptor
// registration), which is what the mock state relies on.
beforeEach(() => {
  // mockState.create is invoked exactly once when request.ts is evaluated, so
  // it is never reset. Only `post` (whose behaviour changes per test) resets.
  mockState.post.mockReset();
  mockState.post.mockResolvedValue({
    data: { code: 1, data: { token: "newToken", refreshToken: "newRefresh" } },
  });
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

const getRequestHandler = () => {
  expect(mockState.requestHandler).toBeDefined();
  return mockState.requestHandler!;
};
const getResolve = () => {
  expect(mockState.responseResolveHandler).toBeDefined();
  return mockState.responseResolveHandler!;
};
const getReject = () => {
  expect(mockState.responseRejectHandler).toBeDefined();
  return mockState.responseRejectHandler!;
};

describe("request instance setup", () => {
  it("evaluates the module and creates the axios instance with /api baseURL", () => {
    expect(instance).toBeDefined();
    expect(mockState.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: "/api" })
    );
  });

  it("attaches the token from localStorage to the request headers", async () => {
    localStorage.setItem("token", "secret-token");
    const config = await getRequestHandler()({ headers: {} });
    expect(config.headers.token).toBe("secret-token");
  });

  it("leaves headers unchanged when no token is stored", async () => {
    const config = await getRequestHandler()({ headers: {} });
    expect(config.headers.token).toBeUndefined();
  });
});

describe("request instance response interceptor (success)", () => {
  it("unwraps data when code === 1", () => {
    const result = getResolve()({ data: { code: 1, data: { id: 42 } } });
    expect(result).toEqual({ id: 42 });
  });

  it("rejects with the backend msg when code !== 1", () => {
    const result = getResolve()({ data: { code: 0, msg: "Taken" } });
    return expect(result).rejects.toThrow("Taken");
  });

  it("rejects with a generic message when msg is missing", () => {
    const result = getResolve()({ data: { code: 400 } });
    return expect(result).rejects.toThrow("Operation failed");
  });
});

describe("request instance response interceptor (error)", () => {
  it("handles a non-401 error using its response msg", () => {
    const err = { response: { status: 500, data: { msg: "Server exploded" } } };
    return expect(getReject()(err)).rejects.toThrow("Server exploded");
  });

  it("falls back to error.message when no response msg is available", () => {
    const err = { response: { status: 500, data: {} }, message: "Network error" };
    return expect(getReject()(err)).rejects.toThrow("Network error");
  });

  it("refreshes the token and retries on 401", async () => {
    localStorage.setItem("refreshToken", "refresh-me");
    const err = { response: { status: 401 }, config: { headers: {} } };

    await getReject()(err);

    expect(mockState.post).toHaveBeenCalledWith("/api/employee/refresh", {
      refreshToken: "refresh-me",
    });
    expect(localStorage.getItem("token")).toBe("newToken");
    expect(localStorage.getItem("refreshToken")).toBe("newRefresh");
  });

  it("logs out when the refresh call itself fails on 401", async () => {
    vi.useFakeTimers();
    localStorage.setItem("refreshToken", "refresh-me");
    mockState.post.mockRejectedValue(new Error("refresh down"));

    const err = { response: { status: 401 }, config: { headers: {} } };

    await expect(getReject()(err)).rejects.toThrow("Session expired");

    vi.advanceTimersByTime(2000);
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("queues concurrent 401 requests and retries them after the token refresh", async () => {
    localStorage.setItem("refreshToken", "refresh-me");
    const firstErr = { response: { status: 401 }, config: { headers: {} } };
    const secondErr = { response: { status: 401 }, config: { headers: {} } };

    // First 401 begins refreshing (isRefreshing = true) synchronously, so the
    // second 401 lands in the queue instead of starting another refresh.
    const first = getReject()(firstErr);
    const second = getReject()(secondErr);

    await expect(Promise.all([first, second])).resolves.toEqual([
      { code: 1, data: { id: 7 } },
      { code: 1, data: { id: 7 } },
    ]);
    expect(localStorage.getItem("token")).toBe("newToken");
    expect(localStorage.getItem("refreshToken")).toBe("newRefresh");
  });

  it("rejects queued requests and logs out when the token refresh fails", async () => {
    vi.useFakeTimers();
    localStorage.setItem("refreshToken", "refresh-me");
    mockState.post.mockRejectedValue(new Error("refresh down"));
    const firstErr = { response: { status: 401 }, config: { headers: {} } };
    const secondErr = { response: { status: 401 }, config: { headers: {} } };

    const first = getReject()(firstErr);
    const second = getReject()(secondErr);

    await expect(first).rejects.toThrow("Session expired");
    await expect(second).rejects.toThrow("Token refresh failed");

    vi.advanceTimersByTime(2000);
    expect(localStorage.getItem("token")).toBeNull();
  });
});
