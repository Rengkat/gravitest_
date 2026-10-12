import axios from "axios";
import { apiClient, API_BASE_URL } from "./client";

export type LibraryStorageFolder =
  | "videos"
  | "ebooks"
  | "documents"
  | "thumbnails"
  | "reports"
  | "question-images";

export interface UploadResult {
  key: string;
  url: string;
  sizeBytes: number;
  contentType: string;
}

const DIRECT_UPLOAD_MAX_BYTES = 15 * 1024 * 1024; // matches backend limit

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * Uploads a file to Cloudflare R2, choosing the right path automatically:
 *  - ≤15MB (thumbnails, most ebooks/PDFs): proxied through our API
 *  - >15MB (videos): presigned URL, uploaded straight to R2 from the browser
 */
export async function uploadLibraryFile(
  file: File,
  folder: LibraryStorageFolder,
  onProgress?: (p: UploadProgress) => void,
): Promise<UploadResult> {
  if (file.size <= DIRECT_UPLOAD_MAX_BYTES) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const { data } = await apiClient.post<UploadResult>("/storage/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (!onProgress || !e.total) return;
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
        });
      },
    });
    return data;
  }

  // Large file: get a presigned URL, then PUT directly to R2 (bypasses our server entirely)
  const { data: presign } = await apiClient.post<{
    key: string;
    uploadUrl: string;
    publicUrl: string;
    expiresIn: number;
  }>("/storage/presign-upload", {
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
    folder,
  });

  await axios.put(presign.uploadUrl, file, {
    headers: { "Content-Type": file.type || "application/octet-stream" },
    onUploadProgress: (e) => {
      if (!onProgress || !e.total) return;
      onProgress({
        loaded: e.loaded,
        total: e.total,
        percent: Math.round((e.loaded / e.total) * 100),
      });
    },
  });

  return {
    key: presign.key,
    url: presign.publicUrl,
    sizeBytes: file.size,
    contentType: file.type,
  };
}

/** Converts a canvas/whiteboard/graph data URL (base64) into a File and uploads it — used for diagrams drawn in-app rather than picked from disk. */
export async function uploadDataUrlImage(
  dataUrl: string,
  fileName: string,
  folder: LibraryStorageFolder = "documents",
): Promise<UploadResult> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], fileName, { type: blob.type || "image/png" });
  return uploadLibraryFile(file, folder);
}

export async function deleteStorageObject(key: string) {
  const { data } = await apiClient.delete("/storage/object", { params: { key } });
  return data;
}

// Exposed for anything that wants to build the API URL manually (rare).
export const STORAGE_API_BASE_URL = API_BASE_URL;
