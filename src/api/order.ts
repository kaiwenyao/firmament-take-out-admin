import request from "./request";

// Order detail
export interface OrderDetail {
  id?: string;
  name?: string;
  image?: string;
  orderId?: string;
  dishId?: string;
  setmealId?: string;
  dishFlavor?: string;
  number: number; // Quantity
  amount: number; // Amount
}

// Order data type definition
export interface Order {
  id: string;
  number: string; // Order number
  status: number; // Order status: 1-Pending payment, 2-Pending delivery, 3-Delivered, 4-Completed, 5-Cancelled
  userId?: string;
  addressBookId?: string;
  orderTime?: string; // Order time
  checkoutTime?: string; // Checkout time
  payMethod?: number; // Payment method: 1-WeChat, 2-Alipay
  amount: number; // Actual amount received
  remark?: string; // Remark
  userName?: string; // Username
  phone?: string; // Phone number
  address?: string; // Address
  consignee?: string; // Consignee
  orderDishes?: string; // Order dish info (string format)
  orderDetailList?: OrderDetail[]; // Order detail list
}

// Paginated query request parameters
export interface OrderPageQuery {
  number?: string; // Order number
  phone?: string; // Phone number
  status?: number; // Order status
  beginTime?: string; // Start time
  endTime?: string; // End time
  userId?: string; // User ID
  page: number;
  pageSize: number;
}

// Paginated query response data
export interface OrderPageResponse {
  total: string;
  records: Order[];
}

// Order statistics
export interface OrderStatistics {
  toBeConfirmed: number; // Pending confirmation count
  confirmed: number; // Pending delivery count
  deliveryInProgress: number; // In delivery count
}

// Order confirmation request parameters
export interface OrderConfirmData {
  id: number | string; // Backend is Long, frontend can be number or string
  status: number;
}

// Order rejection request parameters
export interface OrderRejectionData {
  id: number | string; // Backend is Long, frontend can be number or string
  rejectionReason: string;
}

// Order cancellation request parameters
export interface OrderCancelData {
  id: number | string; // Backend is Long, frontend can be number or string
  cancelReason: string;
}

/**
 * Convert datetime-local format to backend required format
 * Input: "2024-01-01T12:00"
 * Output: "2024-01-01 12:00:00"
 */
const formatDateTimeForBackend = (dateTimeLocal: string): string => {
  if (!dateTimeLocal) return "";
  // Convert "2024-01-01T12:00" to "2024-01-01 12:00:00"
  return dateTimeLocal.replace("T", " ") + ":00";
};

/**
 * Order search (conditional search)
 * @param params Query parameters
 * @returns Paginated data
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
    // Convert time format: from "yyyy-MM-ddTHH:mm" to "yyyy-MM-dd HH:mm:ss"
    queryParams.append("beginTime", formatDateTimeForBackend(params.beginTime));
  }
  if (params.endTime) {
    // Convert time format: from "yyyy-MM-ddTHH:mm" to "yyyy-MM-dd HH:mm:ss"
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
 * Order paginated query (legacy interface compatible)
 * @param params Query parameters
 * @returns Paginated data
 */
export const getOrderListAPI = async (
  params: OrderPageQuery
): Promise<OrderPageResponse> => {
  // Use conditionSearch interface
  return conditionSearchOrderAPI(params);
};

/**
 * Order count by status
 * @returns Order statistics
 */
export const getOrderStatisticsAPI = async (): Promise<OrderStatistics> => {
  return request.get("/order/statistics");
};

/**
 * Query order details
 * @param id Order ID
 * @returns Order details
 */
export const getOrderDetailsAPI = async (id: string): Promise<Order> => {
  return request.get(`/order/details/${id}`);
};

/**
 * Confirm order
 * @param data Confirmation data
 * @returns Operation result
 */
export const confirmOrderAPI = async (data: OrderConfirmData): Promise<void> => {
  return request.put("/order/confirm", data);
};

/**
 * Reject order
 * @param data Rejection data
 * @returns Operation result
 */
export const rejectOrderAPI = async (data: OrderRejectionData): Promise<void> => {
  return request.put("/order/rejection", data);
};

/**
 * Cancel order
 * @param data Cancellation data
 * @returns Operation result
 */
export const cancelOrderAPI = async (data: OrderCancelData): Promise<void> => {
  return request.put("/order/cancel", data);
};

/**
 * Deliver order
 * @param id Order ID
 * @returns Operation result
 */
export const deliveryOrderAPI = async (id: string): Promise<void> => {
  return request.put(`/order/delivery/${id}`);
};

/**
 * Complete order
 * @param id Order ID
 * @returns Operation result
 */
export const completeOrderAPI = async (id: string): Promise<void> => {
  return request.put(`/order/complete/${id}`);
};
