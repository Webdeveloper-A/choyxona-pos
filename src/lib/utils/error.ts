export type ErrorWithMessage = {
  message?: string;
  code?: string;
  error?: string;
  details?: string;
};

export function getErrorMessage(error: unknown, fallback = "Noma’lum xato") {
  if (error instanceof Error && error.message) return error.message;

  if (error && typeof error === "object") {
    const candidate = error as ErrorWithMessage;

    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message;
    }

    if (typeof candidate.error === "string" && candidate.error.trim()) {
      return candidate.error;
    }

    if (typeof candidate.details === "string" && candidate.details.trim()) {
      return candidate.details;
    }
  }

  return fallback;
}

export function getErrorCode(error: unknown) {
  if (error && typeof error === "object") {
    const candidate = error as ErrorWithMessage;
    return typeof candidate.code === "string" ? candidate.code : undefined;
  }

  return undefined;
}
