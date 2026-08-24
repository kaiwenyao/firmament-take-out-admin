import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./request", () => ({
  default: {
    post: vi.fn(),
  },
}));

import request from "./request";
import {
  employeeLoginAPI,
  employeeLogoutAPI,
} from "./auth";

const mockPost = vi.mocked(request.post);

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("auth API", () => {
  describe("employeeLoginAPI", () => {
    it("posts login credentials and returns the login response", async () => {
      const loginData = { username: "admin", password: "123456" };
      mockPost.mockResolvedValue({
        id: 1,
        userName: "admin",
        name: "Admin",
        token: "t",
        refreshToken: "r",
      });

      const result = await employeeLoginAPI(loginData);

      expect(mockPost).toHaveBeenCalledWith("/employee/login", loginData);
      expect(result.token).toBe("t");
    });
  });

  describe("employeeLogoutAPI", () => {
    it("calls logout endpoint and clears local storage on success", async () => {
      localStorage.setItem("token", "t");
      localStorage.setItem("refreshToken", "r");
      localStorage.setItem("userName", "admin");
      localStorage.setItem("name", "Admin");
      localStorage.setItem("userId", "1");

      mockPost.mockResolvedValue(undefined);

      await employeeLogoutAPI();

      expect(mockPost).toHaveBeenCalledWith("/employee/logout");
      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
      expect(localStorage.getItem("userName")).toBeNull();
      expect(localStorage.getItem("name")).toBeNull();
      expect(localStorage.getItem("userId")).toBeNull();
    });

    it("still clears local storage when the logout endpoint fails", async () => {
      localStorage.setItem("token", "t");
      mockPost.mockRejectedValue(new Error("backend down"));

      // Should not throw
      await expect(employeeLogoutAPI()).resolves.toBeUndefined();
      expect(localStorage.getItem("token")).toBeNull();
    });
  });
});
