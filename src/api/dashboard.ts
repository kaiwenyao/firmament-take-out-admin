import request from "./request";

// 今日数据响应
export interface BusinessDataVO {
  turnover: number; // 营业额
  validOrderCount: number; // 有效订单数
  orderCompletionRate: number; // 订单完成率
  unitPrice: number; // 平均客单价
  newUsers: number; // 新增用户数
}

// 订单概览响应
export interface OrderOverViewVO {
  waitingOrders: number; // 待接单数量
  deliveredOrders: number; // 待派送数量
  completedOrders: number; // 已完成数量
  cancelledOrders: number; // 已取消数量
  allOrders: number; // 全部订单
}

// 菜品总览响应
export interface DishOverViewVO {
  sold: number; // 已启售数量
  discontinued: number; // 已停售数量
}

// 套餐总览响应
export interface SetmealOverViewVO {
  sold: number; // 已启售数量
  discontinued: number; // 已停售数量
}

/**
 * 获取今日数据概览
 * @returns 今日数据
 */
export const getBusinessDataAPI = async (): Promise<BusinessDataVO> => {
  return request.get("/workspace/businessData");
};

/**
 * 获取订单概览
 * @returns 订单概览数据
 */
export const getOrderOverViewAPI = async (): Promise<OrderOverViewVO> => {
  return request.get("/workspace/overviewOrders");
};

/**
 * 获取菜品总览
 * @returns 菜品总览数据
 */
export const getDishOverViewAPI = async (): Promise<DishOverViewVO> => {
  return request.get("/workspace/overviewDishes");
};

/**
 * 获取套餐总览
 * @returns 套餐总览数据
 */
export const getSetmealOverViewAPI = async (): Promise<SetmealOverViewVO> => {
  return request.get("/workspace/overviewSetmeals");
};

