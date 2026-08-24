import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { uploadImage } from "./upload";

vi.mock("axios");

const mockPost = vi.mocked(axios.post);

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

const makeFile = (type: string, size = 1024): File =>
  new File([new ArrayBuffer(size)], "photo.png", { type });

describe("uploadImage", () => {
  it("throws for an unsupported file type", async () => {
    const file = makeFile("application/pdf");
    await expect(uploadImage(file)).rejects.toThrow(
      "Unsupported file type"
    );
  });

  it("throws when the file exceeds 10MB", async () => {
    const file = makeFile("image/png", 11 * 1024 * 1024);
    await expect(uploadImage(file)).rejects.toThrow(
      "File size must not exceed 10MB"
    );
  });

  it("uploads a valid image and returns the image URL", async () => {
    mockPost.mockResolvedValue({ data: { code: 1, data: "https://img/x.png" } });
    localStorage.setItem("token", "abc123");

    const url = await uploadImage(makeFile("image/jpeg"));

    expect(url).toBe("https://img/x.png");
    expect(mockPost).toHaveBeenCalledTimes(1);
    const [endpoint, formData, config] = mockPost.mock.calls[0];
    expect(endpoint).toBe("/api/common/upload");
    expect(formData).toBeInstanceOf(FormData);
    expect(config.headers).toMatchObject({ token: "abc123" });
  });

  it("throws with the backend message when code is not 1", async () => {
    mockPost.mockResolvedValue({
      data: { code: 0, msg: "Upload rejected" },
    });
    await expect(uploadImage(makeFile("image/jpeg"))).rejects.toThrow(
      "Upload rejected"
    );
  });

  it("throws the fallback message when the backend omits a message", async () => {
    mockPost.mockResolvedValue({ data: { code: 0 } });
    await expect(uploadImage(makeFile("image/gif"))).rejects.toThrow(
      "Upload failed"
    );
  });

  it("re-throws an Error thrown by the axios call", async () => {
    mockPost.mockRejectedValue(new Error("Network down"));
    await expect(uploadImage(makeFile("image/webp"))).rejects.toThrow(
      "Network down"
    );
  });

  it("throws the generic message when axios throws a non-Error value", async () => {
    mockPost.mockRejectedValue("boom");
    await expect(uploadImage(makeFile("image/jpg"))).rejects.toThrow(
      "Upload failed. Please try again."
    );
  });
});
