import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./request", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import request from "./request";
import {
  getCategoryListAPI,
  enableOrDisableCategoryAPI,
  getCategoryListByTypeAPI,
  saveCategoryAPI,
  updateCategoryAPI,
  deleteCategoryAPI,
} from "./category";

const mockGet = vi.mocked(request.get);
const mockPost = vi.mocked(request.post);
const mockPut = vi.mocked(request.put);
const mockDelete = vi.mocked(request.delete);

afterEach(() => vi.clearAllMocks());

describe("category API", () => {
  it("getCategoryListAPI builds query with all fields", async () => {
    mockGet.mockResolvedValue({ total: "1", records: [] });
    await getCategoryListAPI({ name: "dishes", type: 1, page: 2, pageSize: 10 });
    expect(mockGet).toHaveBeenCalledWith(
      "/category/page?name=dishes&type=1&page=2&pageSize=10"
    );
  });

  it("getCategoryListAPI omits optional fields when absent", async () => {
    mockGet.mockResolvedValue({ total: "0", records: [] });
    await getCategoryListAPI({ page: 1, pageSize: 20 });
    expect(mockGet).toHaveBeenCalledWith("/category/page?page=1&pageSize=20");
  });

  it("enableOrDisableCategoryAPI posts the status change", async () => {
    mockPost.mockResolvedValue(undefined);
    await enableOrDisableCategoryAPI(0, "c1");
    expect(mockPost).toHaveBeenCalledWith("/category/status/0?id=c1");
  });

  it("getCategoryListByTypeAPI builds the type query", async () => {
    mockGet.mockResolvedValue([]);
    await getCategoryListByTypeAPI({ type: 2 });
    expect(mockGet).toHaveBeenCalledWith("/category/list?type=2");
  });

  it("saveCategoryAPI posts the form data", async () => {
    mockPost.mockResolvedValue("42");
    await saveCategoryAPI({ name: "Soups", type: 1, sort: 3 });
    expect(mockPost).toHaveBeenCalledWith("/category", {
      name: "Soups",
      type: 1,
      sort: 3,
    });
  });

  it("updateCategoryAPI puts the form data", async () => {
    mockPut.mockResolvedValue(undefined);
    await updateCategoryAPI({ id: "id1", name: "Renamed", type: 1, sort: 1 });
    expect(mockPut).toHaveBeenCalledWith("/category", {
      id: "id1",
      name: "Renamed",
      type: 1,
      sort: 1,
    });
  });

  it("deleteCategoryAPI deletes by id", async () => {
    mockDelete.mockResolvedValue(undefined);
    await deleteCategoryAPI("cat-7");
    expect(mockDelete).toHaveBeenCalledWith("/category?id=cat-7");
  });
});
