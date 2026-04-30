import { acquireApiToken } from './auth';

export interface UploadTarget {
  fileName: string;
  objectKey: string;
  uploadUrl: string;
}

export interface AgentFinding {
  agent: string;
  summary: string;
  details: string;
}

export interface ReviewRecord {
  reviewId: string;
  status: string;
  findings: AgentFinding[];
  finalSummary?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/**
 * Sends an authenticated JSON request to the backend API.
 */
async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = await acquireApiToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    ...init
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Requests one upload target per selected file.
 */
export async function createUploadTargets(files: File[]): Promise<UploadTarget[]> {
  return requestJson<UploadTarget[]>('/uploads', {
    method: 'POST',
    body: JSON.stringify({
      files: files.map((file) => ({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream'
      }))
    })
  });
}

/**
 * Uploads files directly to storage using the provided presigned URLs.
 */
export async function uploadFiles(files: File[], targets: UploadTarget[]): Promise<string[]> {
  const uploads = targets.map(async (target, index) => {
    const response = await fetch(target.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': files[index].type || 'application/octet-stream'
      },
      body: files[index]
    });

    if (!response.ok) {
      throw new Error(`Upload failed for ${files[index].name}`);
    }

    return target.objectKey;
  });

  return Promise.all(uploads);
}

/**
 * Starts a new review run for uploaded document keys.
 */
export async function startReview(documentKeys: string[]): Promise<ReviewRecord> {
  return requestJson<ReviewRecord>('/reviews', {
    method: 'POST',
    body: JSON.stringify({ documentKeys })
  });
}

/**
 * Fetches latest review status and findings.
 */
export async function getReview(reviewId: string): Promise<ReviewRecord> {
  return requestJson<ReviewRecord>(`/reviews/${reviewId}`);
}
