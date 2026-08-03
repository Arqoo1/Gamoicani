type ErrorLike = { message?: string | null; code?: string | null } | string | null | undefined;

export function getFriendlyErrorMessage(error: ErrorLike, fallback = "ვერ მოხერხდა"): string {
  if (typeof error === "string") return error.trim() || fallback;
  if (error && typeof error === "object") {
    if (error.code === "SIGN_IN_CANCELLED") return "";
    if (error.message?.trim()) return error.message;
  }

  return fallback;
}
