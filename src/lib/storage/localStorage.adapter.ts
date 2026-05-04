import { StorageError } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true when running in a browser context (i.e. window is defined).
 * In Next.js SSR, window is undefined — all reads return the default value
 * and all writes are no-ops.
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Maps a caught error to a typed StorageError.
 */
function toStorageError(error: unknown, operation: string): StorageError {
  if (error instanceof DOMException) {
    if (error.name === 'QuotaExceededError') {
      return new StorageError(
        `Storage quota exceeded during ${operation}.`,
        'QUOTA_EXCEEDED'
      );
    }
    if (error.name === 'SecurityError') {
      return new StorageError(
        `Storage access denied (SecurityError) during ${operation}.`,
        'SECURITY_ERROR'
      );
    }
  }
  const message =
    error instanceof Error ? error.message : 'Unknown storage error';
  return new StorageError(
    `Unexpected error during ${operation}: ${message}`,
    'UNKNOWN'
  );
}

// ─── Prefix ───────────────────────────────────────────────────────────────────

const PREFIX = 'fitness-tracker:';

function prefixedKey(key: string): string {
  return `${PREFIX}${key}`;
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

/**
 * Low-level LocalStorage adapter.
 *
 * All keys are automatically prefixed with `"fitness-tracker:"`.
 *
 * - Reads: return `defaultValue` when the key is missing, the JSON is invalid,
 *   or the code is running in an SSR context (window undefined).
 * - Writes: throw a typed `StorageError` on failure (QuotaExceededError,
 *   SecurityError, or any other unexpected error). No-op in SSR context.
 * - Removes: throw a typed `StorageError` on failure. No-op in SSR context.
 */
export const localStorageAdapter = {
  /**
   * Reads and JSON-parses the value stored under `key`.
   * Returns `defaultValue` when:
   *   - running in SSR (window undefined)
   *   - the key does not exist
   *   - the stored value is not valid JSON
   */
  getItem<T>(key: string, defaultValue: T): T {
    if (!isBrowser()) {
      return defaultValue;
    }

    try {
      const raw = window.localStorage.getItem(prefixedKey(key));
      if (raw === null) {
        return defaultValue;
      }
      return JSON.parse(raw) as T;
    } catch {
      // Invalid JSON — return the safe default and log for diagnostics
      console.error(
        `[fitness-tracker] Failed to parse JSON for key "${prefixedKey(key)}". Returning default value.`
      );
      return defaultValue;
    }
  },

  /**
   * JSON-serializes `value` and writes it under `key`.
   * Throws a `StorageError` on failure.
   * No-op in SSR context.
   */
  setItem<T>(key: string, value: T): void {
    if (!isBrowser()) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(prefixedKey(key), serialized);
    } catch (error) {
      throw toStorageError(error, `setItem("${prefixedKey(key)}")`);
    }
  },

  /**
   * Removes the entry stored under `key`.
   * Throws a `StorageError` on failure.
   * No-op in SSR context.
   */
  removeItem(key: string): void {
    if (!isBrowser()) {
      return;
    }

    try {
      window.localStorage.removeItem(prefixedKey(key));
    } catch (error) {
      throw toStorageError(error, `removeItem("${prefixedKey(key)}")`);
    }
  },
} as const;
