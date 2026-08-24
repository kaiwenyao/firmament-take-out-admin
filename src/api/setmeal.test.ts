import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./request", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/utils/upload", () => ({ uploadImage: vi.fn() }));

import request from "./request";
import {
  getSetmealListAPI,
  saveSetmealAPI,
  updateSetmealAPI,
  deleteSetmealAPI,
  enableOrDisableSetmealAPI,
  getSetmealByIdAPI,
} from "./setmeal";

const mockGet = vi.mocked(request.get);
const mockPost = vi.mocked(request.post);
const mockPut = vi.mocked(request.put);
const mockDelete = vi.mocked(request.delete);

afterEach(() => vi.clearAllMocks());

describe("setmeal API", () => {
  it("getSetmealListAPI builds query with all fields", async () => {
    mockGet.mockResolvedValue({ total: "1", records: [] });
    await getSetmealListAPI({ name: "family", categoryId: 2, status: 0, page: 3, pageSize: 8 });
    expect(mockGet).toHaveBeenCalledWith(
      "/setmeal/page?name=family&categoryId=2&status=0&page=3&pageSize=8"
    );
  });

  it("getSetmealListAPI omits optional fields when absent", async () => {
    mockGet.mockResolvedValue({ total: "0", records: [] });
    await getSetmealListAPI({ page: 1, pageSize: 10 });
    expect(mockGet).toHaveBeenCalledWith("/setmeal/page?page=1&pageSize=10");
  });

  it("saveSetmealAPI posts the form data", async () => {
    mockPost.mockResolvedValue("5");
    const data = { name: "Family Pack", categoryId: 2, price: 99, status: 1 };
    await saveSetmealAPI(data);
    expect(mockPost).toHaveBeenCalledWith("/setmeal", data);
  });

  it("updateSetmealAPI puts the form data", async () => {
    mockPut.mockResolvedValue(undefined);
    const data = { id: "s1", name: "Family Pack", categoryId: 2, price: 89, status: 1 };
    await updateSetmealAPI(data);
    expect(mockPut).toHaveBeenCalledWith("/setmeal", data);
  });

  it("deleteSetmealAPI joins ids into the query", async () => {
    mockDelete.mockResolvedValue(undefined);
    await deleteSetmealAPI(["a", "b"]);
    expect(mockDelete).toHaveBeenCalledWith("/setmeal?ids=a,b");
  });

  it("enableOrDisableSetmealAPI posts the status change", async () => {
    mockPost.mockResolvedValue(undefined);
    await enableOrDisableSetmealAPI(1, "s9");
    expect(mockPost).toHaveBeenCalledWith("/setmeal/status/1?id=s9");
  });

  it("getSetmealByIdAPI gets a single setmeal", async () => {
    mockGet.mockResolvedValue({ id: "s9" });
    await getSetmealByIdAPI("s9");
    expect(mockGet).toHaveBeenCalledWith("/setmeal/s9");
  });
});
