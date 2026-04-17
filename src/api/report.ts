import request from "./request";
import axios from "axios";

// Turnover statistics response data
export interface TurnoverReportVO {
  dateList: string; // Dates, comma-separated, e.g.: 2022-10-01,2022-10-02,2022-10-03
  turnoverList: string; // Turnover, comma-separated, e.g.: 406.0,1520.0,75.0
}

// User statistics response data
export interface UserReportVO {
  dateList: string; // Dates, comma-separated, e.g.: 2022-10-01,2022-10-02,2022-10-03
  totalUserList: string; // Total users, comma-separated, e.g.: 200,210,220
  newUserList: string; // New users, comma-separated, e.g.: 20,21,10
}

// Order statistics response data
export interface OrderReportVO {
  dateList: string; // Dates, comma-separated, e.g.: 2022-10-01,2022-10-02,2022-10-03
  orderCountList: string; // Daily order count, comma-separated, e.g.: 260,210,215
  validOrderCountList: string; // Daily valid order count, comma-separated, e.g.: 20,21,10
  totalOrderCount: number; // Total order count
  validOrderCount: number; // Valid order count
  orderCompletionRate: number; // Order completion rate
}

// Sales TOP10 response data
export interface SalesTop10ReportVO {
  nameList: string; // Product name list, comma-separated, e.g.: Fish-flavored pork, Kung Pao chicken, Boiled fish
  numberList: string; // Sales count list, comma-separated, e.g.: 260,215,200
}

/**
 * Turnover statistics
 * @param begin Start date (yyyy-MM-dd)
 * @param end End date (yyyy-MM-dd)
 * @returns Turnover statistics data
 */
export const getTurnoverStatisticsAPI = async (
  begin: string,
  end: string
): Promise<TurnoverReportVO> => {
  const params = new URLSearchParams();
  params.append("begin", begin);
  params.append("end", end);
  return request.get(`/report/turnoverStatistics?${params.toString()}`);
};

/**
 * User statistics
 * @param begin Start date (yyyy-MM-dd)
 * @param end End date (yyyy-MM-dd)
 * @returns User statistics data
 */
export const getUserStatisticsAPI = async (
  begin: string,
  end: string
): Promise<UserReportVO> => {
  const params = new URLSearchParams();
  params.append("begin", begin);
  params.append("end", end);
  return request.get(`/report/userStatistics?${params.toString()}`);
};

/**
 * Order statistics
 * @param begin Start date (yyyy-MM-dd)
 * @param end End date (yyyy-MM-dd)
 * @returns Order statistics data
 */
export const getOrdersStatisticsAPI = async (
  begin: string,
  end: string
): Promise<OrderReportVO> => {
  const params = new URLSearchParams();
  params.append("begin", begin);
  params.append("end", end);
  return request.get(`/report/ordersStatistics?${params.toString()}`);
};

/**
 * Sales TOP10
 * @param begin Start date (yyyy-MM-dd)
 * @param end End date (yyyy-MM-dd)
 * @returns Sales TOP10 data
 */
export const getSalesTop10API = async (
  begin: string,
  end: string
): Promise<SalesTop10ReportVO> => {
  const params = new URLSearchParams();
  params.append("begin", begin);
  params.append("end", end);
  return request.get(`/report/top10?${params.toString()}`);
};

/**
 * Export data report for the last 30 days
 */
export const exportReportAPI = async (): Promise<Blob> => {
  // Use axios directly because blob response is needed
  const token = localStorage.getItem("token");

  const response = await axios.get("/api/report/export", {
    responseType: "blob",
    headers: token ? { token } : {},
  });

  return response.data;
};
