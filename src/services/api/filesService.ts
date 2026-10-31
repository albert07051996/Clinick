/* Wrappers around backend `FilesController` (api/v1/Files/*).
   The backend returns `FileUploadResponse` directly for uploads
   (NOT wrapped in ApiResponse<T>), so we bypass ApiClient.get/post
   and use its raw axios instance.
   All three endpoints require a valid JWT in the `Authorization`
   header, which ApiClient attaches automatically from localStorage. */

import type { AxiosProgressEvent } from 'axios';
import { ApiClient } from './apiClient';
import type { ApiResponse } from '../../types';

export interface FileUploadResult {
  success: boolean;
  publicId?: string;
  url?: string;
  secureUrl?: string;
  size?: number;
  contentType?: string;
  error?: string;
}

export interface UploadOptions {
  folder?: string;
  onProgress?: (percent: number) => void;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (matches backend)

export const filesService = {
  /** POST /api/v1/Files/upload-image — Auth required. */
  async uploadImage(file: File, opts: UploadOptions = {}): Promise<FileUploadResult> {
    const validation = validate(file, ALLOWED_IMAGE_TYPES, 'JPEG, PNG, GIF, WebP');
    if (validation) return { success: false, error: validation };

    const form = new FormData();
    form.append('file', file);
    const qs = opts.folder ? `?folder=${encodeURIComponent(opts.folder)}` : '';

    const res = await ApiClient.getInstance().post<FileUploadResult>(
      `/v1/Files/upload-image${qs}`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e: AxiosProgressEvent) => {
          if (opts.onProgress && e.total) {
            opts.onProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      },
    );
    return res.data;
  },

  /** POST /api/v1/Files/upload-document — Auth required. */
  async uploadDocument(file: File, opts: UploadOptions = {}): Promise<FileUploadResult> {
    const validation = validate(file, ALLOWED_DOCUMENT_TYPES, 'PDF, DOC, DOCX');
    if (validation) return { success: false, error: validation };

    const form = new FormData();
    form.append('file', file);
    const folder = opts.folder ?? 'documents';
    const qs = `?folder=${encodeURIComponent(folder)}`;

    const res = await ApiClient.getInstance().post<FileUploadResult>(
      `/v1/Files/upload-document${qs}`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e: AxiosProgressEvent) => {
          if (opts.onProgress && e.total) {
            opts.onProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      },
    );
    return res.data;
  },

  /** DELETE /api/v1/Files/delete/{publicId} — Auth required.
      Backend returns ApiResponse<bool>; the Cloudinary public id can
      contain slashes, so we percent-encode it. */
  async deleteFile(publicId: string): Promise<boolean> {
    const res = await ApiClient.getInstance().delete<ApiResponse<boolean>>(
      `/v1/Files/delete/${encodeURIComponent(publicId)}`,
    );
    return res.data?.success === true;
  },

  /** Expose constants so UI can show the limits before upload. */
  limits: {
    maxBytes: MAX_FILE_SIZE,
    imageTypes: ALLOWED_IMAGE_TYPES,
    documentTypes: ALLOWED_DOCUMENT_TYPES,
  },
};

function validate(file: File, allowed: readonly string[], label: string): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File is larger than ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)} MB.`;
  }
  if (!allowed.includes(file.type)) {
    return `Unsupported type. Allowed: ${label}.`;
  }
  return null;
}
