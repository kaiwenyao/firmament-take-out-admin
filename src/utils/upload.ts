import axios from "axios";

/**
 * Upload image file
 * @param file Image file
 * @param endpoint Upload endpoint address, defaults to "/api/common/upload"
 * @returns Image URL
 * @throws Throws error on upload failure
 */
export const uploadImage = async (
  file: File,
  endpoint: string = "/api/common/upload"
): Promise<string> => {
  // Validate file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Unsupported file type. Please upload an image (JPG, PNG, GIF, or WEBP).");
  }

  // Validate file size (limited to 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error("File size must not exceed 10MB.");
  }

  const formData = new FormData();
  formData.append("file", file);

  // Upload directly using axios, not using request interceptor (since multipart/form-data is needed)
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

