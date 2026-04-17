import request from "./request";

/**
 * Get shop business status
 * @returns Business status: 1-Open, 0-Closed
 */
export const getShopStatusAPI = async (): Promise<number> => {
  return request.get("/shop/status");
};

/**
 * Set shop business status
 * @param status Business status: 1-Open, 0-Closed
 * @returns Operation result
 */
export const setShopStatusAPI = async (status: number): Promise<void> => {
  return request.put(`/shop/${status}`);
};
