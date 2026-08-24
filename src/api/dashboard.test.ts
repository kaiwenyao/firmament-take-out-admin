import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./request", () => ({
  default: {
    get: vi.fn(),
  },
}));

import request from "./request";
import {
  getBusinessDataAPI,
  getOrderOverViewAPI,
  getDishOverViewAPI,
  getSetmealOverViewAPI,
} from "./dashboard";

const mockGet = vi.mocked(request.get);

afterEach(() => vi.clearAllMocks());

describe("dashboard API", () => {
  it.each([
    ["getBusinessDataAPI", getBusinessDataAPI, "/workspace/businessData"],
    ["getOrderOverViewAPI", getOrderOverViewAPI, "/workspace/overviewOrders"],
    ["getDishOverViewAPI", getDishOverViewAPI, "/workspace/overviewDishes"],
    ["getSetmealOverViewAPI", getSetmealOverViewAPI, "/workspace/overviewSetmeals"],
  ] as const)("%s calls GET %s", async (_name, fn, url) => {
    mockGet.mockResolvedValue({});
    await fn();
    expect(mockGet).toHaveBeenCalledWith(url);
  });
});
