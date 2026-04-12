import axios from "axios";

/**
 * 上传图片文件
 * @param file 图片文件
 * @param endpoint 上传接口地址，默认为 "/api/common/upload"
 * @returns 图片URL
 * @throws 上传失败时抛出错误
 */
export const uploadImage = async (
  file: File,
  endpoint: string = "/api/common/upload"
): Promise<string> => {
  // 验证文件类型
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Unsupported file type. Please upload an image (JPG, PNG, GIF, or WEBP).");
  }

  // 验证文件大小（限制为 10MB）
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error("File size must not exceed 10MB.");
  }

  const formData = new FormData();
  formData.append("file", file);

  // 使用 axios 直接上传，不使用 request 拦截器（因为需要 multipart/form-data）
  const token = localStorage.getItem("token");

  try {
    const response = await axios.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        token: token || "",
      },
    });

    const res = response.data;
    if (res.code === 1) {
      return res.data;
    } else {
      throw new Error(res.msg || "Upload failed");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Upload failed. Please try again.");
  }
};

