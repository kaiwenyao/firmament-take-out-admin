import request from "./request";

// 分类数据类型定义
export interface Category {
  id: string;
  name: string;
  type: number; // 1: 菜品分类, 2: 套餐分类
  sort: number;
  status: number; // 1: 启用, 0: 禁用
  createTime?: string;
  updateTime?: string;
  createUser?: string;
  updateUser?: string;
}

// 分页查询请求参数
export interface CategoryPageQuery {
  name?: string;
  type?: number; // 1: 菜品分类, 2: 套餐分类
  page: number;
  pageSize: number;
}

// 分页查询响应数据
export interface CategoryPageResponse {
  total: string;
  records: Category[];
}

// 根据类型查询分类请求参数
export interface CategoryListQuery {
  type: number; // 1: 菜品分类, 2: 套餐分类
}

// 分类表单数据类型
export interface CategoryFormData {
  id?: string;
  name: string;
  type: number; // 1: 菜品分类, 2: 套餐分类
  sort: number;
}

/**
 * 分类分页查询
 * @param params 查询参数
 * @returns 分页数据
 */
export const getCategoryListAPI = async (
  params: CategoryPageQuery
): Promise<CategoryPageResponse> => {
  // GET 请求，将参数作为 query string
  const queryParams = new URLSearchParams();
  if (params.name) {
    queryParams.append("name", params.name);
  }
  if (params.type !== undefined) {
    queryParams.append("type", params.type.toString());
  }
  queryParams.append("page", params.page.toString());
  queryParams.append("pageSize", params.pageSize.toString());
  
  return request.get(`/category/page?${queryParams.toString()}`);
};

/**
 * 启用/禁用分类
 * @param status 状态：1-启用，0-禁用
 * @param categoryId 分类ID
 * @returns 操作结果
 */
export const enableOrDisableCategoryAPI = async (
  status: number,
  categoryId: string
): Promise<void> => {
  return request.post(`/category/status/${status}?id=${categoryId}`);
};

/**
 * 根据类型查询分类列表
 * @param params 查询参数
 * @returns 分类列表
 */
export const getCategoryListByTypeAPI = async (
  params: CategoryListQuery
): Promise<Category[]> => {
  const queryParams = new URLSearchParams();
  queryParams.append("type", params.type.toString());
  
  return request.get(`/category/list?${queryParams.toString()}`);
};

/**
 * 新增分类
 * @param data 分类表单数据
 * @returns 操作结果
 */
export const saveCategoryAPI = async (data: CategoryFormData): Promise<string> => {
  return request.post("/category", data);
};

/**
 * 修改分类
 * @param data 分类表单数据
 * @returns 操作结果
 */
export const updateCategoryAPI = async (data: CategoryFormData): Promise<void> => {
  return request.put("/category", data);
};

/**
 * 删除分类
 * @param categoryId 分类ID
 * @returns 操作结果
 */
export const deleteCategoryAPI = async (categoryId: string): Promise<void> => {
  return request.delete(`/category?id=${categoryId}`);
};

