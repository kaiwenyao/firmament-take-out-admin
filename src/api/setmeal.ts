import request from "./request";
import { uploadImage } from "@/utils/upload";

// Setmeal data type definition
export interface Setmeal {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  price: number;
  image?: string;
  description?: string;
  status: number; // 0: Off sale, 1: On sale
  updateTime?: string;
  createTime?: string;
  createUser?: string;
  updateUser?: string;
  setmealDishes?: SetmealDish[];
}

// Setmeal-dish association
export interface SetmealDish {
  id?: string;
  setmealId?: string;
  dishId: string;
  name?: string;
  price?: number;
  copies: number; // Number of copies
}

// Paginated query request parameters
export interface SetmealPageQuery {
  name?: string;
  categoryId?: number;
  status?: number; // 0: Off sale, 1: On sale
  page: number;
  pageSize: number;
}

// Paginated query response data
export interface SetmealPageResponse {
  total: string;
  records: Setmeal[];
}

// Setmeal form data type
export interface SetmealFormData {
  id?: string;
  name: string;
  categoryId: number;
  price: number;
  image?: string;
  description?: string;
  status: number; // 0: Off sale, 1: On sale
  setmealDishes?: SetmealDish[];
}

/**
 * Setmeal paginated query
 * @param params Query parameters
 * @returns Paginated data
 */
export const getSetmealListAPI = async (
  params: SetmealPageQuery
): Promise<SetmealPageResponse> => {
  const queryParams = new URLSearchParams();
  if (params.name) {
    queryParams.append("name", params.name);
  }
  if (params.categoryId !== undefined) {
    queryParams.append("categoryId", params.categoryId.toString());
  }
  if (params.status !== undefined) {
    queryParams.append("status", params.status.toString());
  }
  queryParams.append("page", params.page.toString());
  queryParams.append("pageSize", params.pageSize.toString());

  return request.get(`/setmeal/page?${queryParams.toString()}`);
};

/**
 * Add new setmeal
 * @param data Setmeal form data
 * @returns Operation result
 */
export const saveSetmealAPI = async (data: SetmealFormData): Promise<string> => {
  return request.post("/setmeal", data);
};

/**
 * Update setmeal
 * @param data Setmeal form data
 * @returns Operation result
 */
export const updateSetmealAPI = async (data: SetmealFormData): Promise<void> => {
  return request.put("/setmeal", data);
};

/**
 * Delete setmeal
 * @param setmealIds Setmeal ID array
 * @returns Operation result
 */
export const deleteSetmealAPI = async (setmealIds: string[]): Promise<void> => {
  return request.delete(`/setmeal?ids=${setmealIds.join(",")}`);
};

/**
 * Enable/Disable setmeal
 * @param status Status: 1-On sale, 0-Off sale
 * @param setmealId Setmeal ID
 * @returns Operation result
 */
export const enableOrDisableSetmealAPI = async (
  status: number,
  setmealId: string
): Promise<void> => {
  return request.post(`/setmeal/status/${status}?id=${setmealId}`);
};

/**
 * Query setmeal by ID
 * @param id Setmeal ID
 * @returns Setmeal information
 */
export const getSetmealByIdAPI = async (id: string): Promise<Setmeal> => {
  return request.get(`/setmeal/${id}`);
};

/**
 * Upload image
 * @param file Image file
 * @returns Image URL
 * @deprecated Use uploadImage from @/utils/upload instead
 */
export { uploadImage };
