import { getErrorMessage } from "@/lib/utils/error";

export type ApiResponsePayload = {
  success?: boolean;
  error?: string;
  details?: string;
  [key: string]: unknown;
};

export async function readJsonSafely<T extends ApiResponsePayload = ApiResponsePayload>(
  response: Response
): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function getApiErrorMessage(
  payload: ApiResponsePayload | null | undefined,
  fallback: string
) {
  if (payload) {
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }

    if (typeof payload.details === "string" && payload.details.trim()) {
      return payload.details;
    }
  }

  return fallback;
}

export async function parseApiResponse<T extends ApiResponsePayload = ApiResponsePayload>(
  response: Response,
  fallback = "Server noto‘g‘ri javob qaytardi"
): Promise<T> {
  const payload = await readJsonSafely<T>(response);

  if (!payload) {
    throw new Error(fallback);
  }

  return payload;
}

export function toErrorMessage(value: unknown, fallback: string) {
  return getErrorMessage(value, fallback);
}
