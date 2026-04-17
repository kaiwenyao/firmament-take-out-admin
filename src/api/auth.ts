import request from "./request";

// Employee login request parameters
export interface EmployeeLoginDTO {
  username: string;
  password: string;
}

// Employee login response data
export interface EmployeeLoginVO {
  id: number;
  userName: string;
  name: string;
  token: string;
  refreshToken: string;  // ⭐ New Refresh Token
}

/**
 * Employee login
 * @param data Login credentials
 * @returns Login response data
 */
export const employeeLoginAPI = async (
  data: EmployeeLoginDTO
): Promise<EmployeeLoginVO> => {
  return request.post("/employee/login", data);
};

/**
 * Employee logout
 */
export const employeeLogoutAPI = async (): Promise<void> => {
  try {
    // Call backend logout endpoint
    await request.post("/employee/logout");
  } catch (error) {
    // Even if backend fails, clear local data
    console.error("Logout API call failed:", error);
  } finally {
    // Clear locally stored token and user info
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");  // ⭐ Clear Refresh Token
    localStorage.removeItem("userName");
    localStorage.removeItem("name");
    localStorage.removeItem("userId");
  }
};
