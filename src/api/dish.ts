import request from "./request";
import { uploadImage } from "@/utils/upload";

// 菜品数据类型定义
export interface Dish {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  price: number;
  image?: string;
  description?: string;
  status: number; // 0: 停售, 1: 起售
  updateTime?: string;
  createTime?: string;
  createUser?: string;
  updateUser?: string;
  flavors?: DishFlavor[];
}

// 菜品口味
export interface DishFlavor {
  id?: string;
  dishId?: string;
  name: string;
  value: string;
}

// 分页查询请求参数
export interface DishPageQuery {
  name?: string;
  categoryId?: number;
  status?: number; // 0: 停售, 1: 起售
  page: number;
  pageSize: number;
}

// 分页查询响应数据
export interface DishPageResponse {
  total: string;
  records: Dish[];
}

// 菜品表单数据类型
export interface DishFormData {
  id?: string;
  name: string;
  categoryId: number;
  price: number;
  image?: string;
  description?: string;
  status: number; // 0: 停售, 1: 起售
  flavors?: DishFlavor[];
}

/**
 * 菜品分页查询
 * @param params 查询参数
 * @returns 分页数据
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
 * 新增菜品
 * @param data 菜品表单数据
 * @returns 操作结果
 */
export const saveDishAPI = async (data: DishFormData): Promise<string> => {
  return request.post("/dish", data);
};

/**
 * 修改菜品
 * @param data 菜品表单数据
 * @returns 操作结果
 */
export const updateDishAPI = async (data: DishFormData): Promise<void> => {
  return request.put("/dish", data);
};

/**
 * 删除菜品
 * @param dishIds 菜品ID数组
 * @returns 操作结果
 */
export const deleteDishAPI = async (dishIds: string[]): Promise<void> => {
  return request.delete(`/dish?ids=${dishIds.join(",")}`);
};

/**
 * 启用/禁用菜品
 * @param status 状态：1-起售，0-停售
 * @param dishId 菜品ID
 * @returns 操作结果
 */
export const enableOrDisableDishAPI = async (
  status: number,
  dishId: string
): Promise<void> => {
  return request.post(`/dish/status/${status}?id=${dishId}`);
};

/**
 * 根据ID查询菜品
 * @param id 菜品ID
 * @returns 菜品信息
 */
export const getDishByIdAPI = async (id: string): Promise<Dish> => {
  return request.get(`/dish/${id}`);
};

/**
 * 上传图片
 * @param file 图片文件
 * @returns 图片URL
 * @deprecated 请使用 @/utils/upload 中的 uploadImage
 */
export { uploadImage };

