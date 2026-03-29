/**
 * Error message helpers for consistent, user-friendly error display.
 * Avoids "[object Object]" and extracts messages from Strapi and thrown values.
 */

/** Turn Strapi error response (object) into a single string for the UI. */
export function strapiErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const msg = (body as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
    const err = (body as { error?: unknown }).error;
    if (err && typeof err === 'object') {
      const errObj = err as {
        message?: string;
        details?: { errors?: Array<{ message?: string }> };
      };
      const errMsg = errObj.message;
      if (typeof errMsg === 'string') {
        const details = errObj.details?.errors;
        if (Array.isArray(details) && details.length) {
          const parts = details.map((e) => e.message).filter(Boolean);
          if (parts.length) return `${errMsg}: ${parts.join('; ')}`;
        }
        return errMsg;
      }
    }
  }
  return fallback;
}

/** Normalize any thrown value to a string for display (never "[object Object]"). */
export function getUploadErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string' && msg !== '[object Object]') return msg;
    const payload = (error as { payload?: unknown }).payload;
    if (typeof payload === 'string') return payload;
    if (payload && typeof payload === 'object') {
      const pMsg = (payload as { message?: string }).message;
      if (typeof pMsg === 'string') return pMsg;
    }
  }
  return 'Upload failed. Please try again.';
}
