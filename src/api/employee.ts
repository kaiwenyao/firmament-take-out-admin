import request from "./request";

// Employee data type definition
// Corresponds to backend EmployeeVO
export interface Employee {
  id: string;
  username: string;
  name: string;
  phone: string;
  sex: string; // "1" or "0"
  idNumber: string;
  status: number;
  updateTime: string;
}

// Paginated query request parameters
export interface EmployeePageQuery {
  name?: string;
  page: number;
  pageSize: number;
}

// Paginated query response data
export interface EmployeePageResponse {
  total: string;
  records: Employee[];
}

/**
 * Employee paginated query
 * @param params Query parameters
 * @returns Paginated data
 */
export const getEmployeeListAPI = async (
  params: EmployeePageQuery
): Promise<EmployeePageResponse> => {
  // GET request, parameters as query string
  const queryParams = new URLSearchParams();
  if (params.name) {
    queryParams.append("name", params.name);
  }
  queryParams.append("page", params.page.toString());
  queryParams.append("pageSize", params.pageSize.toString());

  return request.get(`/employee/page?${queryParams.toString()}`);
};

/**
 * Enable/Disable employee account
 * @param status Status: 1-Enabled, 0-Disabled
 * @param employeeId Employee ID
 * @returns Operation result
 */
export const enableOrDisableEmployeeAPI = async (
  status: number,
  employeeId: string
): Promise<void> => {
  return request.post(`/employee/status/${status}?id=${employeeId}`);
};

// Employee form data type
export interface EmployeeFormData {
  id: string;
  username: string;
  name: string;
  phone: string;
  sex: string; // "1" or "0"
  idNumber: string;
}

/**
 * Query employee by ID
 * @param id Employee ID
 * @returns Employee information
 */
export const getEmployeeByIdAPI = async (id: string): Promise<Employee> => {
  return request.get(`/employee/${id}`);
};

/**
 * Add new employee
 * @param data Employee form data
 * @returns Operation result
 */
export const saveEmployeeAPI = async (data: EmployeeFormData): Promise<string> => {
  return request.post("/employee", data);
};

/**
 * Update employee information
 * @param data Employee form data
 * @returns Operation result
 */
export const updateEmployeeAPI = async (data: EmployeeFormData): Promise<void> => {
  return request.put("/employee", data);
};

// Password update request parameters
export interface PasswordEditDTO {
  empId: number;
  oldPassword: string;
  newPassword: string;
}

/**
 * Update password
 * @param data Password update data
 * @returns Operation result
 */
export const updatePasswordAPI = async (data: PasswordEditDTO): Promise<void> => {
  return request.put("/employee/editPassword", data);
};
