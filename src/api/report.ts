import request from "./request";
import axios from "axios";

// 营业额统计响应数据
export interface TurnoverReportVO {
  dateList: string; // 日期，以逗号分隔，例如：2022-10-01,2022-10-02,2022-10-03
  turnoverList: string; // 营业额，以逗号分隔，例如：406.0,1520.0,75.0
}

// 用户统计响应数据
export interface UserReportVO {
  dateList: string; // 日期，以逗号分隔，例如：2022-10-01,2022-10-02,2022-10-03
  totalUserList: string; // 用户总量，以逗号分隔，例如：200,210,220
  newUserList: string; // 新增用户，以逗号分隔，例如：20,21,10
}

// 订单统计响应数据
export interface OrderReportVO {
  dateList: string; // 日期，以逗号分隔，例如：2022-10-01,2022-10-02,2022-10-03
  orderCountList: string; // 每日订单数，以逗号分隔，例如：260,210,215
  validOrderCountList: string; // 每日有效订单数，以逗号分隔，例如：20,21,10
  totalOrderCount: number; // 订单总数
  validOrderCount: number; // 有效订单数
  orderCompletionRate: number; // 订单完成率
}

// 销量TOP10响应数据
export interface SalesTop10ReportVO {
  nameList: string; // 商品名称列表，以逗号分隔，例如：鱼香肉丝,宫保鸡丁,水煮鱼
  numberList: string; // 销量列表，以逗号分隔，例如：260,215,200
}

/**
 * 营业额统计
 * @param begin 开始日期 (yyyy-MM-dd)
 * @param end 结束日期 (yyyy-MM-dd)
 * @returns 营业额统计数据
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
 * 用户数据统计
 * @param begin 开始日期 (yyyy-MM-dd)
 * @param end 结束日期 (yyyy-MM-dd)
 * @returns 用户统计数据
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
 * 订单数据统计
 * @param begin 开始日期 (yyyy-MM-dd)
 * @param end 结束日期 (yyyy-MM-dd)
 * @returns 订单统计数据
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
 * 销量TOP10
 * @param begin 开始日期 (yyyy-MM-dd)
 * @param end 结束日期 (yyyy-MM-dd)
 * @returns 销量TOP10数据
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
 * 导出最近30天的数据报表
 */
export const exportReportAPI = async (): Promise<Blob> => {
  // 使用 axios 直接请求，因为需要 blob 响应
  const token = localStorage.getItem("token");
  
  const response = await axios.get("/api/report/export", {
    responseType: "blob",
    headers: token ? { token } : {},
  });
  
  return response.data;
};

