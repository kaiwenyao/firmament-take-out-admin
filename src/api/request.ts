import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { getNavigate } from "@/utils/navigation";

// 1. Create axios instance
const instance = axios.create({
  // Usually '/api', then Vite proxy forwards to backend port
  baseURL: "/api",
  timeout: 5000, // Timeout 5 seconds
});

// Flag indicating if token expiration is being handled, prevent duplicate redirects
let isHandlingTokenExpired = false;

// ⭐ Flag indicating if token is being refreshed, prevent multiple simultaneous refreshes
let isRefreshing = false;

// ⭐ Store requests waiting in queue after token refresh
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

/**
 * ⭐ Process requests in the waiting queue
 * @param error Error object (if refresh failed)
 * @param token New access token (if refresh succeeded)
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
 * ⭐ Refresh Access Token
 * @returns New access token or null (if refresh failed)
 */
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      console.warn("No refresh token available, cannot refresh");
      return null;
    }

    // Call refresh token endpoint (don't use instance to avoid interceptor)
    const response = await axios.post("/api/employee/refresh", {
      refreshToken,
    });

    // Backend response format: { code: 1, data: { token, refreshToken } }
    if (response.data.code === 1) {
      const newToken = response.data.data.token;
      const newRefreshToken = response.data.data.refreshToken;

      // Update local storage
      localStorage.setItem("token", newToken);
      localStorage.setItem("refreshToken", newRefreshToken);

      console.log("Token refreshed successfully");
      return newToken;
    }

    return null;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    return null;
  }
};

/**
 * Clear local storage user info and redirect to login page
 */
const handleTokenExpired = () => {
  // If already handling, return directly to prevent duplicate redirects
  if (isHandlingTokenExpired) {
    return;
  }

  isHandlingTokenExpired = true;

  // Clear locally stored token and user info
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");  // ⭐ Clear refresh token
  localStorage.removeItem("userName");
  localStorage.removeItem("name");
  localStorage.removeItem("userId");

  // Delay redirect to ensure toast notification displays
  setTimeout(() => {
    // Core difference: use navigate for seamless redirect
    const navigate = getNavigate();
    if (navigate) {
      navigate("/login", { replace: true });
    } else {
      // If navigate not initialized, use window.location as fallback
      window.location.href = "/login";
    }

    // Reset lock
    isHandlingTokenExpired = false;
  }, 1000);
};

// 2. Request Interceptor
instance.interceptors.request.use(
  (config) => {
    // Token exists in localStorage
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.token = token; // Per backend requirement, may be 'Authorization' or 'token'
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor
instance.interceptors.response.use(
  (response) => {
    const res = response.data;

    // Assume backend response format: { code: 1, msg: 'success', data: ... }
    // If code === 1 means success
    if (res.code === 1) {
      return res.data; // Return data core part directly
    } else {
      // If code is not 1, means business error (e.g. "Username already exists")
      const errorMsg: string = res.msg || "Operation failed";
      toast.error(errorMsg); // Unified error notification for user
      return Promise.reject(new Error(errorMsg));
    }
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // ⭐ Handle 401 error: Token expired
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // If token refresh is in progress, add current request to queue
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

      // Mark current request as retried to prevent infinite loop
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        const newToken = await refreshAccessToken();

        if (newToken) {
          // Refresh succeeded, process queued requests
          processQueue(null, newToken);

          // Update original request's token and retry
          if (originalRequest.headers) {
            originalRequest.headers.token = newToken;
          }

          return instance(originalRequest);
        } else {
          // Refresh failed, clear queue and redirect to login
          processQueue(new Error("Token refresh failed"), null);
          toast.warning("Session expired. Redirecting to sign in…");
          handleTokenExpired();
          return Promise.reject(new Error("Session expired. Please sign in again."));
        }
      } catch (refreshError) {
        // Error during refresh
        processQueue(new Error("Token refresh failed"), null);
        toast.warning("Session expired. Redirecting to sign in…");
        handleTokenExpired();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    const errorData = error.response?.data as { msg?: string } | undefined;
    const errorMessage =
      errorData?.msg || error.message || "Network error";
    toast.error(errorMessage); // Unified error notification for user
    return Promise.reject(new Error(errorMessage));
  }
);

export default instance;
