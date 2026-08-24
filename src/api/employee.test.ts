import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./request", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import request from "./request";
import {
  getEmployeeListAPI,
  enableOrDisableEmployeeAPI,
  getEmployeeByIdAPI,
  saveEmployeeAPI,
  updateEmployeeAPI,
  updatePasswordAPI,
} from "./employee";

const mockGet = vi.mocked(request.get);
const mockPost = vi.mocked(request.post);
const mockPut = vi.mocked(request.put);

afterEach(() => vi.clearAllMocks());

describe("employee API", () => {
  it("getEmployeeListAPI builds query with name", async () => {
    mockGet.mockResolvedValue({ total: "1", records: [] });
    await getEmployeeListAPI({ name: "john", page: 2, pageSize: 5 });
    expect(mockGet).toHaveBeenCalledWith(
      "/employee/page?name=john&page=2&pageSize=5"
    );
  });

  it("getEmployeeListAPI omits name when absent", async () => {
    mockGet.mockResolvedValue({ total: "0", records: [] });
    await getEmployeeListAPI({ page: 1, pageSize: 10 });
    expect(mockGet).toHaveBeenCalledWith("/employee/page?page=1&pageSize=10");
  });

  it("enableOrDisableEmployeeAPI posts the status change", async () => {
    mockPost.mockResolvedValue(undefined);
    await enableOrDisableEmployeeAPI(0, "e1");
    expect(mockPost).toHaveBeenCalledWith("/employee/status/0?id=e1");
  });

  it("getEmployeeByIdAPI gets a single employee", async () => {
    mockGet.mockResolvedValue({ id: "e1" });
    await getEmployeeByIdAPI("e1");
    expect(mockGet).toHaveBeenCalledWith("/employee/e1");
  });

  it("saveEmployeeAPI posts the form data", async () => {
    mockPost.mockResolvedValue("10");
    const data = {
      id: "",
      username: "jdoe",
      name: "John",
      phone: "123",
      sex: "1",
      idNumber: "abc",
    };
    await saveEmployeeAPI(data);
    expect(mockPost).toHaveBeenCalledWith("/employee", data);
  });

  it("updateEmployeeAPI puts the form data", async () => {
    mockPut.mockResolvedValue(undefined);
    const data = {
      id: "e1",
      username: "jdoe",
      name: "John",
      phone: "123",
      sex: "1",
      idNumber: "abc",
    };
    await updateEmployeeAPI(data);
    expect(mockPut).toHaveBeenCalledWith("/employee", data);
  });

  it("updatePasswordAPI puts the password edit payload", async () => {
    mockPut.mockResolvedValue(undefined);
    const data = { empId: 1, oldPassword: "old", newPassword: "newpass1" };
    await updatePasswordAPI(data);
    expect(mockPut).toHaveBeenCalledWith("/employee/editPassword", data);
  });
});
