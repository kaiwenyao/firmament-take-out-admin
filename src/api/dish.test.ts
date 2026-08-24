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
  getDishListAPI,
  saveDishAPI,
  updateDishAPI,
  deleteDishAPI,
  enableOrDisableDishAPI,
  getDishByIdAPI,
} from "./dish";

const mockGet = vi.mocked(request.get);
const mockPost = vi.mocked(request.post);
const mockPut = vi.mocked(request.put);
const mockDelete = vi.mocked(request.delete);

afterEach(() => vi.clearAllMocks());

describe("dish API", () => {
  it("getDishListAPI builds query with all fields", async () => {
    mockGet.mockResolvedValue({ total: "1", records: [] });
    await getDishListAPI({ name: "chicken", categoryId: 3, status: 1, page: 1, pageSize: 10 });
    expect(mockGet).toHaveBeenCalledWith(
      "/dish/page?name=chicken&categoryId=3&status=1&page=1&pageSize=10"
    );
  });

  it("getDishListAPI omits optional fields when absent", async () => {
    mockGet.mockResolvedValue({ total: "0", records: [] });
    await getDishListAPI({ page: 1, pageSize: 10 });
    expect(mockGet).toHaveBeenCalledWith("/dish/page?page=1&pageSize=10");
  });

  it("saveDishAPI posts the form data", async () => {
    mockPost.mockResolvedValue("99");
    const data = { name: "Kung Pao", categoryId: 1, price: 20, status: 1 };
    await saveDishAPI(data);
    expect(mockPost).toHaveBeenCalledWith("/dish", data);
  });

  it("updateDishAPI puts the form data", async () => {
    mockPut.mockResolvedValue(undefined);
    const data = { id: "d1", name: "Kung Pao", categoryId: 1, price: 22, status: 1 };
    await updateDishAPI(data);
    expect(mockPut).toHaveBeenCalledWith("/dish", data);
  });

  it("deleteDishAPI joins ids into the query", async () => {
    mockDelete.mockResolvedValue(undefined);
    await deleteDishAPI(["1", "2", "3"]);
    expect(mockDelete).toHaveBeenCalledWith("/dish?ids=1,2,3");
  });

  it("enableOrDisableDishAPI posts the status change", async () => {
    mockPost.mockResolvedValue(undefined);
    await enableOrDisableDishAPI(1, "d9");
    expect(mockPost).toHaveBeenCalledWith("/dish/status/1?id=d9");
  });

  it("getDishByIdAPI gets a single dish", async () => {
    mockGet.mockResolvedValue({ id: "d9" });
    await getDishByIdAPI("d9");
    expect(mockGet).toHaveBeenCalledWith("/dish/d9");
  });
});
