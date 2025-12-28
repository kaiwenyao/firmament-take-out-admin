import request from "./request";

/**
 * 获取店铺营业状态
 * @returns 营业状态：1-营业中，0-打烊中
 */
export const getShopStatusAPI = async (): Promise<number> => {
  return request.get("/shop/status");
};

/**
 * 设置店铺营业状态
 * @param status 营业状态：1-营业中，0-打烊中
 * @returns 操作结果
 */
export const setShopStatusAPI = async (status: number): Promise<void> => {
  return request.put(`/shop/${status}`);
};

