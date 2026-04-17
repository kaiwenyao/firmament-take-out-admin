import request from "./request";

// Category data type definition
export interface Category {
  id: string;
  name: string;
  type: number; // 1: Dish category, 2: Setmeal category
  sort: number;
  status: number; // 1: Enabled, 0: Disabled
  createTime?: string;
  updateTime?: string;
  createUser?: string;
  updateUser?: string;
}

// Paginated query request parameters
export interface CategoryPageQuery {
  name?: string;
  type?: number; // 1: Dish category, 2: Setmeal category
  page: number;
  pageSize: number;
}

// Paginated query response data
export interface CategoryPageResponse {
  total: string;
  records: Category[];
}

// Query categories by type request parameters
export interface CategoryListQuery {
  type: number; // 1: Dish category, 2: Setmeal category
}

// Category form data type
export interface CategoryFormData {
  id?: string;
  name: string;
  type: number; // 1: Dish category, 2: Setmeal category
  sort: number;
}

/**
 * Category paginated query
 * @param params Query parameters
 * @returns Paginated data
 */
export const getCategoryListAPI = async (
  params: CategoryPageQuery
): Promise<CategoryPageResponse> => {
  // GET request, parameters as query string
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
 * Enable/Disable category
 * @param status Status: 1-Enabled, 0-Disabled
 * @param categoryId Category ID
 * @returns Operation result
 */
export const enableOrDisableCategoryAPI = async (
  status: number,
  categoryId: string
): Promise<void> => {
  return request.post(`/category/status/${status}?id=${categoryId}`);
};

/**
 * Query category list by type
 * @param params Query parameters
 * @returns Category list
 */
export const getCategoryListByTypeAPI = async (
  params: CategoryListQuery
): Promise<Category[]> => {
  const queryParams = new URLSearchParams();
  queryParams.append("type", params.type.toString());

  return request.get(`/category/list?${queryParams.toString()}`);
};

/**
 * Add new category
 * @param data Category form data
 * @returns Operation result
 */
export const saveCategoryAPI = async (data: CategoryFormData): Promise<string> => {
  return request.post("/category", data);
};

/**
 * Update category
 * @param data Category form data
 * @returns Operation result
 */
export const updateCategoryAPI = async (data: CategoryFormData): Promise<void> => {
  return request.put("/category", data);
};

/**
 * Delete category
 * @param categoryId Category ID
 * @returns Operation result
 */
export const deleteCategoryAPI = async (categoryId: string): Promise<void> => {
  return request.delete(`/category?id=${categoryId}`);
};
