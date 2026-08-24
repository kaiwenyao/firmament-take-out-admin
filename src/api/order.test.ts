import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./request", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import request from "./request";
import {
  conditionSearchOrderAPI,
  getOrderListAPI,
  getOrderStatisticsAPI,
  getOrderDetailsAPI,
  confirmOrderAPI,
  rejectOrderAPI,
  cancelOrderAPI,
  deliveryOrderAPI,
  completeOrderAPI,
} from "./order";

const mockGet = vi.mocked(request.get);
const mockPut = vi.mocked(request.put);

afterEach(() => vi.clearAllMocks());

describe("order API", () => {
  it("conditionSearchOrderAPI builds full query", async () => {
    mockGet.mockResolvedValue({ total: "1", records: [] });
    await conditionSearchOrderAPI({
      number: "N1",
      phone: "138",
      status: 2,
      beginTime: "2024-01-01T08:00",
      endTime: "2024-01-02T18:30",
      userId: "u1",
      page: 1,
      pageSize: 10,
    });
    expect(mockGet).toHaveBeenCalledWith(
      "/order/conditionSearch?number=N1&phone=138&status=2&beginTime=2024-01-01+08%3A00%3A00&endTime=2024-01-02+18%3A30%3A00&userId=u1&page=1&pageSize=10"
    );
  });

  it("conditionSearchOrderAPI omits optional fields and converts empty times", async () => {
    mockGet.mockResolvedValue({ total: "0", records: [] });
    await conditionSearchOrderAPI({ page: 2, pageSize: 20 });
    expect(mockGet).toHaveBeenCalledWith(
      "/order/conditionSearch?page=2&pageSize=20"
    );
  });

  it("conditionSearchOrderAPI handles empty-string time fields", async () => {
    mockGet.mockResolvedValue({ total: "0", records: [] });
    await conditionSearchOrderAPI({ beginTime: "", endTime: "", page: 1, pageSize: 10 });
    expect(mockGet).toHaveBeenCalledWith(
      "/order/conditionSearch?page=1&pageSize=10"
    );
  });

  it("getOrderListAPI delegates to conditionSearchOrderAPI", async () => {
    mockGet.mockResolvedValue({ total: "5", records: [] });
    await getOrderListAPI({ page: 1, pageSize: 10 });
    expect(mockGet).toHaveBeenCalledWith(
      "/order/conditionSearch?page=1&pageSize=10"
    );
  });

  it("getOrderStatisticsAPI gets statistics", async () => {
    mockGet.mockResolvedValue({ toBeConfirmed: 1, confirmed: 2, deliveryInProgress: 0 });
    await getOrderStatisticsAPI();
    expect(mockGet).toHaveBeenCalledWith("/order/statistics");
  });

  it("getOrderDetailsAPI gets details", async () => {
    mockGet.mockResolvedValue({ id: "o1" });
    await getOrderDetailsAPI("o1");
    expect(mockGet).toHaveBeenCalledWith("/order/details/o1");
  });

  it("confirmOrderAPI puts confirm data", async () => {
    mockPut.mockResolvedValue(undefined);
    await confirmOrderAPI({ id: 1, status: 2 });
    expect(mockPut).toHaveBeenCalledWith("/order/confirm", { id: 1, status: 2 });
  });

  it("rejectOrderAPI puts rejection data", async () => {
    mockPut.mockResolvedValue(undefined);
    await rejectOrderAPI({ id: "2", rejectionReason: "out of stock" });
    expect(mockPut).toHaveBeenCalledWith("/order/rejection", {
      id: "2",
      rejectionReason: "out of stock",
    });
  });

  it("cancelOrderAPI puts cancellation data", async () => {
    mockPut.mockResolvedValue(undefined);
    await cancelOrderAPI({ id: 3, cancelReason: "user request" });
    expect(mockPut).toHaveBeenCalledWith("/order/cancel", {
      id: 3,
      cancelReason: "user request",
    });
  });

  it("deliveryOrderAPI puts delivery", async () => {
    mockPut.mockResolvedValue(undefined);
    await deliveryOrderAPI("o2");
    expect(mockPut).toHaveBeenCalledWith("/order/delivery/o2");
  });

  it("completeOrderAPI puts completion", async () => {
    mockPut.mockResolvedValue(undefined);
    await completeOrderAPI("o3");
    expect(mockPut).toHaveBeenCalledWith("/order/complete/o3");
  });
});
