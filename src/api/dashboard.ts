import request from "./request";

// Today's data response
export interface BusinessDataVO {
  turnover: number; // Turnover
  validOrderCount: number; // Valid order count
  orderCompletionRate: number; // Order completion rate
  unitPrice: number; // Average unit price
  newUsers: number; // New users count
}

// Order overview response
export interface OrderOverViewVO {
  waitingOrders: number; // Pending orders count
  deliveredOrders: number; // Waiting for delivery count
  completedOrders: number; // Completed count
  cancelledOrders: number; // Cancelled count
  allOrders: number; // All orders
}

// Dish overview response
export interface DishOverViewVO {
  sold: number; // Enabled count
  discontinued: number; // Disabled count
}

// Setmeal overview response
export interface SetmealOverViewVO {
  sold: number; // Enabled count
  discontinued: number; // Disabled count
}

/**
 * Get today's business data overview
 * @returns Today's data
 */
export const getBusinessDataAPI = async (): Promise<BusinessDataVO> => {
  return request.get("/workspace/businessData");
};

/**
 * Get order overview
 * @returns Order overview data
 */
export const getOrderOverViewAPI = async (): Promise<OrderOverViewVO> => {
  return request.get("/workspace/overviewOrders");
};

/**
 * Get dish overview
 * @returns Dish overview data
 */
export const getDishOverViewAPI = async (): Promise<DishOverViewVO> => {
  return request.get("/workspace/overviewDishes");
};

/**
 * Get setmeal overview
 * @returns Setmeal overview data
 */
export const getSetmealOverViewAPI = async (): Promise<SetmealOverViewVO> => {
  return request.get("/workspace/overviewSetmeals");
};
