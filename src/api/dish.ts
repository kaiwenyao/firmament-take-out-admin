import request from "./request";
import { uploadImage } from "@/utils/upload";

// Dish data type definition
export interface Dish {
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
  flavors?: DishFlavor[];
}

// Dish flavor
export interface DishFlavor {
  id?: string;
  dishId?: string;
  name: string;
  value: string;
}

// Paginated query request parameters
export interface DishPageQuery {
  name?: string;
  categoryId?: number;
  status?: number; // 0: Off sale, 1: On sale
  page: number;
  pageSize: number;
}

// Paginated query response data
export interface DishPageResponse {
  total: string;
  records: Dish[];
}

// Dish form data type
export interface DishFormData {
  id?: string;
  name: string;
  categoryId: number;
  price: number;
  image?: string;
  description?: string;
  status: number; // 0: Off sale, 1: On sale
  flavors?: DishFlavor[];
}

/**
 * Dish paginated query
 * @param params Query parameters
 * @returns Paginated data
 */
export const getDishListAPI = async (
  params: DishPageQuery
): Promise<DishPageResponse> => {
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

  return request.get(`/dish/page?${queryParams.toString()}`);
};

/**
 * Add new dish
 * @param data Dish form data
 * @returns Operation result
 */
export const saveDishAPI = async (data: DishFormData): Promise<string> => {
  return request.post("/dish", data);
};

/**
 * Update dish
 * @param data Dish form data
 * @returns Operation result
 */
export const updateDishAPI = async (data: DishFormData): Promise<void> => {
  return request.put("/dish", data);
};

/**
 * Delete dish
 * @param dishIds Dish ID array
 * @returns Operation result
 */
export const deleteDishAPI = async (dishIds: string[]): Promise<void> => {
  return request.delete(`/dish?ids=${dishIds.join(",")}`);
};

/**
 * Enable/Disable dish
 * @param status Status: 1-On sale, 0-Off sale
 * @param dishId Dish ID
 * @returns Operation result
 */
export const enableOrDisableDishAPI = async (
  status: number,
  dishId: string
): Promise<void> => {
  return request.post(`/dish/status/${status}?id=${dishId}`);
};

/**
 * Query dish by ID
 * @param id Dish ID
 * @returns Dish information
 */
export const getDishByIdAPI = async (id: string): Promise<Dish> => {
  return request.get(`/dish/${id}`);
};

/**
 * Upload image
 * @param file Image file
 * @returns Image URL
 * @deprecated Use uploadImage from @/utils/upload instead
 */
export { uploadImage };
