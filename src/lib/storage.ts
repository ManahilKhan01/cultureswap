/**
 * Utility functions for handling localStorage with quota exceeded error handling
 */

/**
 * Clears corrupted or excess localStorage data related to authentication
 * Call this when a quota exceeded error is encountered
 */
export const clearAuthStorage = (): void => {
  try {
    // Remove legacy manual token storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear Supabase session data (keys starting with 'sb-')
    const supabaseKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith("sb-"),
    );
    supabaseKeys.forEach((key) => localStorage.removeItem(key));

    // Clear any cached profile data that might be large
    localStorage.removeItem("settings_profile_cache");
    localStorage.removeItem("navbar_profile_cache");
    localStorage.removeItem("profile_page_cache");
  } catch (e) {
    console.error("[Storage] Failed to clear storage:", e);
  }
};

/**
 * Safely set an item in localStorage with quota exceeded error handling
 * Automatically clears corrupted data and retries if quota is exceeded
 */
export const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (
      e instanceof DOMException &&
      (e.name === "QuotaExceededError" ||
        e.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      console.warn(
        "[Storage] Quota exceeded, clearing auth storage and retrying...",
      );
      clearAuthStorage();

      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryError) {
        console.error(
          "[Storage] Failed to set item after clearing storage:",
          retryError,
        );
        return false;
      }
    }
    console.error("[Storage] Failed to set item:", e);
    return false;
  }
};

/**
 * Safely get an item from localStorage
 */
export const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error("[Storage] Failed to get item:", e);
    return null;
  }
};

/**
 * Check if localStorage is available and working
 */
export const isStorageAvailable = (): boolean => {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Get approximate localStorage usage in bytes
 */
export const getStorageUsage = (): { used: number; total: number } => {
  let used = 0;
  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += (localStorage[key].length + key.length) * 2; // UTF-16 encoding
      }
    }
  } catch (e) {
    console.error("[Storage] Failed to calculate storage usage:", e);
  }

  // Most browsers have ~5MB limit
  return { used, total: 5 * 1024 * 1024 };
};
