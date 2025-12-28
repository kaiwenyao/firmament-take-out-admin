import request from "./request";

// 员工登录请求参数
export interface EmployeeLoginDTO {
  username: string;
  password: string;
}

// 员工登录响应数据
export interface EmployeeLoginVO {
  id: number;
  userName: string;
  name: string;
  token: string;
}

/**
 * 员工登录
 * @param data 登录数据
 * @returns 登录响应数据
 */
export const employeeLoginAPI = async (
  data: EmployeeLoginDTO
): Promise<EmployeeLoginVO> => {
  return request.post("/employee/login", data);
};

/**
 * 员工登出
 */
export const employeeLogoutAPI = async (): Promise<void> => {
  try {
    // 调用后端登出接口
    await request.post("/employee/logout");
  } catch (error) {
    // 即使后端接口失败，也要清除本地数据
    console.error("退出登录接口调用失败:", error);
  } finally {
    // 清除本地存储的 token 和用户信息
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("name");
    localStorage.removeItem("userId");
  }
};

