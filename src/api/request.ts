import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { getNavigate } from "@/utils/navigation";

// 1. 创建 axios 实例
const instance = axios.create({
  // 这里通常写 '/api'，然后通过 Vite 的代理转发到后台端口
  baseURL: "/api",
  timeout: 5000, // 超时时间 5 秒
});

// 标记是否正在处理 token 过期，防止重复跳转
let isHandlingTokenExpired = false;

// ⭐ 标记是否正在刷新 token，防止多个请求同时刷新
let isRefreshing = false;

// ⭐ 存储等待刷新 token 后重试的请求队列
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

/**
 * ⭐ 处理等待队列中的请求
 * @param error 错误对象（如果刷新失败）
 * @param token 新的 access token（如果刷新成功）
 */
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * ⭐ 刷新 Access Token
 * @returns 新的 access token 或 null（刷新失败）
 */
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      console.warn("没有 refresh token，无法刷新");
      return null;
    }

    // 调用刷新 token 接口（不使用 instance，避免触发拦截器）
    const response = await axios.post("/api/employee/refresh", {
      refreshToken,
    });

    // 后端返回格式：{ code: 1, data: { token, refreshToken } }
    if (response.data.code === 1) {
      const newToken = response.data.data.token;
      const newRefreshToken = response.data.data.refreshToken;

      // 更新本地存储
      localStorage.setItem("token", newToken);
      localStorage.setItem("refreshToken", newRefreshToken);

      console.log("Token 刷新成功");
      return newToken;
    }

    return null;
  } catch (error) {
    console.error("刷新 token 失败:", error);
    return null;
  }
};

/**
 * 清除本地存储的用户信息并跳转到登录页
 */
const handleTokenExpired = () => {
  // 如果正在处理，直接返回，防止重复跳转
  if (isHandlingTokenExpired) {
    return;
  }

  isHandlingTokenExpired = true;

  // 清除本地存储的 token 和用户信息
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");  // ⭐ 清除 refresh token
  localStorage.removeItem("userName");
  localStorage.removeItem("name");
  localStorage.removeItem("userId");

  // 延迟跳转，确保 toast 提示能够显示
  setTimeout(() => {
    // 核心区别：使用 navigate 进行无刷新跳转
    const navigate = getNavigate();
    if (navigate) {
      navigate("/login", { replace: true });
    } else {
      // 如果 navigate 未初始化，使用 window.location 作为后备方案
      window.location.href = "/login";
    }

    // 重置锁
    isHandlingTokenExpired = false;
  }, 1000);
};

// 2. 请求拦截器 (Request Interceptor)
instance.interceptors.request.use(
  (config) => {
    // Token 存在 localStorage 中
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.token = token; // 根据后端要求，可能是 'Authorization' 或 'token'
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. 响应拦截器 (Response Interceptor)
instance.interceptors.response.use(
  (response) => {
    const res = response.data;

    // 假设后端返回格式是：{ code: 1, msg: 'success', data: ... }
    // 如果 code === 1 代表成功
    if (res.code === 1) {
      return res.data; // 直接返回数据核心部分
    } else {
      // 如果 code 不为 1，代表业务错误（比如"用户名已存在"）
      const errorMsg: string = res.msg || "操作失败";
      toast.error(errorMsg); // 统一显示错误提示给用户
      return Promise.reject(new Error(errorMsg));
    }
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // ⭐ 处理 401 错误：Token 过期
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // 如果正在刷新 token，将当前请求加入队列
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.token = token as string;
            }
            return instance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // 标记当前请求已重试过，防止无限循环
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 尝试刷新 token
        const newToken = await refreshAccessToken();

        if (newToken) {
          // 刷新成功，处理队列中的请求
          processQueue(null, newToken);

          // 更新原请求的 token 并重试
          if (originalRequest.headers) {
            originalRequest.headers.token = newToken;
          }

          return instance(originalRequest);
        } else {
          // 刷新失败，清空队列并跳转登录页
          processQueue(new Error("Token 刷新失败"), null);
          toast.warning("登录过期，现在跳转到登录页");
          handleTokenExpired();
          return Promise.reject(new Error("登录已过期，请重新登录"));
        }
      } catch (refreshError) {
        // 刷新过程中出错
        processQueue(new Error("Token 刷新失败"), null);
        toast.warning("登录过期，现在跳转到登录页");
        handleTokenExpired();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 处理其他错误
    const errorData = error.response?.data as { msg?: string } | undefined;
    const errorMessage =
      errorData?.msg || error.message || "网络异常";
    toast.error(errorMessage); // 统一显示错误提示给用户
    return Promise.reject(new Error(errorMessage));
  }
);

export default instance;
