import request from "./request";
import { uploadImage } from "@/utils/upload";

// 套餐数据类型定义
export interface Setmeal {
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
  setmealDishes?: SetmealDish[];
}

// 套餐菜品关联
export interface SetmealDish {
  id?: string;
  setmealId?: string;
  dishId: string;
  name?: string;
  price?: number;
  copies: number; // 份数
}

// 分页查询请求参数
export interface SetmealPageQuery {
  name?: string;
  categoryId?: number;
  status?: number; // 0: 停售, 1: 起售
  page: number;
  pageSize: number;
}

// 分页查询响应数据
export interface SetmealPageResponse {
  total: string;
  records: Setmeal[];
}

// 套餐表单数据类型
export interface SetmealFormData {
  id?: string;
  name: string;
  categoryId: number;
  price: number;
  image?: string;
  description?: string;
  status: number; // 0: 停售, 1: 起售
  setmealDishes?: SetmealDish[];
}

/**
 * 套餐分页查询
 * @param params 查询参数
 * @returns 分页数据
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
 * 新增套餐
 * @param data 套餐表单数据
 * @returns 操作结果
 */
export const saveSetmealAPI = async (data: SetmealFormData): Promise<string> => {
  return request.post("/setmeal", data);
};

/**
 * 修改套餐
 * @param data 套餐表单数据
 * @returns 操作结果
 */
export const updateSetmealAPI = async (data: SetmealFormData): Promise<void> => {
  return request.put("/setmeal", data);
};

/**
 * 删除套餐
 * @param setmealIds 套餐ID数组
 * @returns 操作结果
 */
export const deleteSetmealAPI = async (setmealIds: string[]): Promise<void> => {
  return request.delete(`/setmeal?ids=${setmealIds.join(",")}`);
};

/**
 * 启用/禁用套餐
 * @param status 状态：1-起售，0-停售
 * @param setmealId 套餐ID
 * @returns 操作结果
 */
export const enableOrDisableSetmealAPI = async (
  status: number,
  setmealId: string
): Promise<void> => {
  return request.post(`/setmeal/status/${status}?id=${setmealId}`);
};

/**
 * 根据ID查询套餐
 * @param id 套餐ID
 * @returns 套餐信息
 */
export const getSetmealByIdAPI = async (id: string): Promise<Setmeal> => {
  return request.get(`/setmeal/${id}`);
};

/**
 * 上传图片
 * @param file 图片文件
 * @returns 图片URL
 * @deprecated 请使用 @/utils/upload 中的 uploadImage
 */
export { uploadImage };

