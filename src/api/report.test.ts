import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

vi.mock("./request", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("axios");

import request from "./request";
import {
  getTurnoverStatisticsAPI,
  getUserStatisticsAPI,
  getOrdersStatisticsAPI,
  getSalesTop10API,
  exportReportAPI,
} from "./report";

const mockGet = vi.mocked(request.get);
const mockAxiosGet = vi.mocked(axios.get);

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("report API", () => {
  it("getTurnoverStatisticsAPI builds begin/end query", async () => {
    mockGet.mockResolvedValue({ dateList: "2024-01-01", turnoverList: "10" });
    await getTurnoverStatisticsAPI("2024-01-01", "2024-01-31");
    expect(mockGet).toHaveBeenCalledWith(
      "/report/turnoverStatistics?begin=2024-01-01&end=2024-01-31"
    );
  });

  it("getUserStatisticsAPI builds begin/end query", async () => {
    mockGet.mockResolvedValue({ dateList: "", totalUserList: "", newUserList: "" });
    await getUserStatisticsAPI("2024-01-01", "2024-01-31");
    expect(mockGet).toHaveBeenCalledWith(
      "/report/userStatistics?begin=2024-01-01&end=2024-01-31"
    );
  });

  it("getOrdersStatisticsAPI builds begin/end query", async () => {
    mockGet.mockResolvedValue({});
    await getOrdersStatisticsAPI("2024-01-01", "2024-01-31");
    expect(mockGet).toHaveBeenCalledWith(
      "/report/ordersStatistics?begin=2024-01-01&end=2024-01-31"
    );
  });

  it("getSalesTop10API builds begin/end query", async () => {
    mockGet.mockResolvedValue({ nameList: "", numberList: "" });
    await getSalesTop10API("2024-01-01", "2024-01-31");
    expect(mockGet).toHaveBeenCalledWith(
      "/report/top10?begin=2024-01-01&end=2024-01-31"
    );
  });

  it("exportReportAPI fetches a blob with the token header", async () => {
    localStorage.setItem("token", "tok");
    const blob = new Blob(["x"]);
    mockAxiosGet.mockResolvedValue({ data: blob });

    const result = await exportReportAPI();

    expect(result).toBe(blob);
    expect(mockAxiosGet).toHaveBeenCalledWith("/api/report/export", {
      responseType: "blob",
      headers: { token: "tok" },
    });
  });

  it("exportReportAPI omits the token header when none is stored", async () => {
    const blob = new Blob(["y"]);
    mockAxiosGet.mockResolvedValue({ data: blob });

    await exportReportAPI();

    expect(mockAxiosGet).toHaveBeenCalledWith("/api/report/export", {
      responseType: "blob",
      headers: {},
    });
  });
});
