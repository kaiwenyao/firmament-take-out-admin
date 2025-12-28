import request from "./request";

// 员工数据类型定义
// 对应后端的EmployeeVO
export interface Employee {
  id: string;
  username: string;
  name: string;
  phone: string;
  sex: string; // "1" 或 "0"
  idNumber: string;
  status: number;
  updateTime: string;
}

// 分页查询请求参数
export interface EmployeePageQuery {
  name?: string;
  page: number;
  pageSize: number;
}

// 分页查询响应数据
export interface EmployeePageResponse {
  total: string;
  records: Employee[];
}

/**
 * 员工分页查询
 * @param params 查询参数
 * @returns 分页数据
 */
export const getEmployeeListAPI = async (
  params: EmployeePageQuery
): Promise<EmployeePageResponse> => {
  // GET 请求，将参数作为 query string
  const queryParams = new URLSearchParams();
  if (params.name) {
    queryParams.append("name", params.name);
  }
  queryParams.append("page", params.page.toString());
  queryParams.append("pageSize", params.pageSize.toString());
  
  return request.get(`/employee/page?${queryParams.toString()}`);
};

/**
 * 启用/禁用员工账号
 * @param status 状态：1-启用，0-禁用
 * @param employeeId 员工ID
 * @returns 操作结果
 */
export const enableOrDisableEmployeeAPI = async (
  status: number,
  employeeId: string
): Promise<void> => {
  return request.post(`/employee/status/${status}?id=${employeeId}`);
};

// 员工表单数据类型
export interface EmployeeFormData {
  id: string;
  username: string;
  name: string;
  phone: string;
  sex: string; // "1" 或 "0"
  idNumber: string;
}

/**
 * 根据id查询员工信息
 * @param id 员工ID
 * @returns 员工信息
 */
export const getEmployeeByIdAPI = async (id: string): Promise<Employee> => {
  return request.get(`/employee/${id}`);
};

/**
 * 新增员工
 * @param data 员工表单数据
 * @returns 操作结果
 */
export const saveEmployeeAPI = async (data: EmployeeFormData): Promise<string> => {
  return request.post("/employee", data);
};

/**
 * 编辑员工信息
 * @param data 员工表单数据
 * @returns 操作结果
 */
export const updateEmployeeAPI = async (data: EmployeeFormData): Promise<void> => {
  return request.put("/employee", data);
};

// 修改密码请求参数
export interface PasswordEditDTO {
  empId: number;
  oldPassword: string;
  newPassword: string;
}

/**
 * 修改密码
 * @param data 密码修改数据
 * @returns 操作结果
 */
export const updatePasswordAPI = async (data: PasswordEditDTO): Promise<void> => {
  return request.put("/employee/editPassword", data);
};

