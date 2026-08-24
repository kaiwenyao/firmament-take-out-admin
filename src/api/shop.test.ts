import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./request", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import request from "./request";
import {
  getShopStatusAPI,
  setShopStatusAPI,
} from "./shop";

const mockGet = vi.mocked(request.get);
const mockPut = vi.mocked(request.put);

afterEach(() => vi.clearAllMocks());

describe("shop API", () => {
  it("getShopStatusAPI calls GET /shop/status", async () => {
    mockGet.mockResolvedValue(1);
    await expect(getShopStatusAPI()).resolves.toBe(1);
    expect(mockGet).toHaveBeenCalledWith("/shop/status");
  });

  it("setShopStatusAPI calls PUT /shop/:status", async () => {
    mockPut.mockResolvedValue(undefined);
    await setShopStatusAPI(0);
    expect(mockPut).toHaveBeenCalledWith("/shop/0");
  });
});
