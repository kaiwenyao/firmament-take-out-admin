import request from "./request";

// 订单详情
export interface OrderDetail {
  id?: string;
  name?: string;
  image?: string;
  orderId?: string;
  dishId?: string;
  setmealId?: string;
  dishFlavor?: string;
  number: number; // 数量
  amount: number; // 金额
}

// 订单数据类型定义
export interface Order {
  id: string;
  number: string; // 订单号
  status: number; // 订单状态 1待付款，2待派送，3已派送，4已完成，5已取消
  userId?: string;
  addressBookId?: string;
  orderTime?: string; // 下单时间
  checkoutTime?: string; // 结账时间
  payMethod?: number; // 支付方式 1微信，2支付宝
  amount: number; // 实收金额
  remark?: string; // 备注
  userName?: string; // 用户名
  phone?: string; // 手机号
  address?: string; // 地址
  consignee?: string; // 收货人
  orderDishes?: string; // 订单菜品信息（字符串格式）
  orderDetailList?: OrderDetail[]; // 订单详情列表
}

// 分页查询请求参数
export interface OrderPageQuery {
  number?: string; // 订单号
  phone?: string; // 手机号
  status?: number; // 订单状态
  beginTime?: string; // 开始时间
  endTime?: string; // 结束时间
  userId?: string; // 用户ID
  page: number;
  pageSize: number;
}

// 分页查询响应数据
export interface OrderPageResponse {
  total: string;
  records: Order[];
}

// 订单统计信息
export interface OrderStatistics {
  toBeConfirmed: number; // 待接单数量
  confirmed: number; // 待派送数量
  deliveryInProgress: number; // 派送中数量
}

// 接单请求参数
export interface OrderConfirmData {
  id: number | string; // 后端是 Long，前端可以是 number 或 string
  status: number;
}

// 拒单请求参数
export interface OrderRejectionData {
  id: number | string; // 后端是 Long，前端可以是 number 或 string
  rejectionReason: string;
}

// 取消订单请求参数
export interface OrderCancelData {
  id: number | string; // 后端是 Long，前端可以是 number 或 string
  cancelReason: string;
}

/**
 * 将 datetime-local 格式转换为后端需要的格式
 * 输入: "2024-01-01T12:00" 
 * 输出: "2024-01-01 12:00:00"
 */
const formatDateTimeForBackend = (dateTimeLocal: string): string => {
  if (!dateTimeLocal) return "";
  // 将 "2024-01-01T12:00" 转换为 "2024-01-01 12:00:00"
  return dateTimeLocal.replace("T", " ") + ":00";
};

/**
 * 订单搜索（条件搜索）
 * @param params 查询参数
 * @returns 分页数据
 */
export const conditionSearchOrderAPI = async (
  params: OrderPageQuery
): Promise<OrderPageResponse> => {
  const queryParams = new URLSearchParams();
  if (params.number) {
    queryParams.append("number", params.number);
  }
  if (params.phone) {
    queryParams.append("phone", params.phone);
  }
  if (params.status !== undefined) {
    queryParams.append("status", params.status.toString());
  }
  if (params.beginTime) {
    // 转换时间格式：从 "yyyy-MM-ddTHH:mm" 转换为 "yyyy-MM-dd HH:mm:ss"
    queryParams.append("beginTime", formatDateTimeForBackend(params.beginTime));
  }
  if (params.endTime) {
    // 转换时间格式：从 "yyyy-MM-ddTHH:mm" 转换为 "yyyy-MM-dd HH:mm:ss"
    queryParams.append("endTime", formatDateTimeForBackend(params.endTime));
  }
  if (params.userId) {
    queryParams.append("userId", params.userId);
  }
  queryParams.append("page", params.page.toString());
  queryParams.append("pageSize", params.pageSize.toString());
  
  return request.get(`/order/conditionSearch?${queryParams.toString()}`);
};

/**
 * 订单分页查询（兼容旧接口）
 * @param params 查询参数
 * @returns 分页数据
 */
export const getOrderListAPI = async (
  params: OrderPageQuery
): Promise<OrderPageResponse> => {
  // 使用 conditionSearch 接口
  return conditionSearchOrderAPI(params);
};

/**
 * 各个状态的订单数量统计
 * @returns 订单统计信息
 */
export const getOrderStatisticsAPI = async (): Promise<OrderStatistics> => {
  return request.get("/order/statistics");
};

/**
 * 查询订单详情
 * @param id 订单ID
 * @returns 订单详情
 */
export const getOrderDetailsAPI = async (id: string): Promise<Order> => {
  return request.get(`/order/details/${id}`);
};

/**
 * 接单
 * @param data 接单数据
 * @returns 操作结果
 */
export const confirmOrderAPI = async (data: OrderConfirmData): Promise<void> => {
  return request.put("/order/confirm", data);
};

/**
 * 拒单
 * @param data 拒单数据
 * @returns 操作结果
 */
export const rejectOrderAPI = async (data: OrderRejectionData): Promise<void> => {
  return request.put("/order/rejection", data);
};

/**
 * 取消订单
 * @param data 取消订单数据
 * @returns 操作结果
 */
export const cancelOrderAPI = async (data: OrderCancelData): Promise<void> => {
  return request.put("/order/cancel", data);
};

/**
 * 派送订单
 * @param id 订单ID
 * @returns 操作结果
 */
export const deliveryOrderAPI = async (id: string): Promise<void> => {
  return request.put(`/order/delivery/${id}`);
};

/**
 * 完成订单
 * @param id 订单ID
 * @returns 操作结果
 */
export const completeOrderAPI = async (id: string): Promise<void> => {
  return request.put(`/order/complete/${id}`);
};

