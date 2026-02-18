import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/lib/profileService";
import { refreshImageCache } from "@/lib/cacheUtils";

interface ProfileData {
  id: string;
  full_name?: string;
  profile_image_url?: string;
  bio?: string;
  city?: string;
  country?: string;
  timezone?: string;
  availability?: string;
  languages?: string[];
  skills_offered?: string[];
  skills_wanted?: string[];
  created_at?: string;
  updated_at?: string;
}

// Module-level cache for in-memory persistence across page navigations
const profileMemoryCache: Record<string, ProfileData> = {};

/**
 * Custom hook for real-time profile updates
 * Subscribes to changes on the user_profiles table and updates state
 * Also provides a refresh function for manual updates
 */
export const useProfileUpdates = (userId: string | null) => {
  // Try to get initial data from memory cache first, then localStorage
  const getInitialProfile = (): ProfileData | null => {
    if (!userId) return null;

    // 1. Check memory cache (fastest, current session)
    if (profileMemoryCache[userId]) {
      return profileMemoryCache[userId];
    }

    // 2. Check localStorage (persists between tab reloads)
    try {
      const cached = localStorage.getItem(`profile_cache_${userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        profileMemoryCache[userId] = parsed; // Sync to memory cache
        return parsed;
      }
    } catch (e) {
      // Silent
    }

    return null;
  };

  const [profile, setProfile] = useState<ProfileData | null>(getInitialProfile);
  const [isLoading, setIsLoading] = useState(!profile && !!userId);
  const [error, setError] = useState<Error | null>(null);

  // Fetch profile from database
  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      // Only set loading if we don't already have some data to show
      if (!profile) setIsLoading(true);

      const data = await profileService.getProfile(userId);

      if (data) {
        setProfile(data);
        profileMemoryCache[userId] = data; // Update memory cache

        // Update localStorage for persistence
        try {
          localStorage.setItem(`profile_cache_${userId}`, JSON.stringify(data));
          // Backward compatibility for Navbar
          localStorage.setItem("navbar_profile_cache", JSON.stringify(data));
        } catch (e) {
          // Silent
        }
      }

      setError(null);
    } catch (err) {
      // Don't override existing profile on error if we have one
      if (!profile) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch profile"),
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, profile]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [userId]); // Only re-fetch if userId changes, not on every mount if data is already there

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (
            payload.eventType === "UPDATE" ||
            payload.eventType === "INSERT"
          ) {
            const newProfile = payload.new as ProfileData;

            // Refresh global image cache busting timestamp
            refreshImageCache();

            // Update caches
            profileMemoryCache[userId] = newProfile;
            try {
              localStorage.setItem(
                `profile_cache_${userId}`,
                JSON.stringify(newProfile),
              );
              localStorage.setItem(
                "navbar_profile_cache",
                JSON.stringify(newProfile),
              );
            } catch (e) {}

            // Update local state
            setProfile(newProfile);

            // Dispatch event for other components
            window.dispatchEvent(
              new CustomEvent("profileUpdated", {
                detail: payload.new,
              }),
            );
          } else if (payload.eventType === "DELETE") {
            delete profileMemoryCache[userId];
            localStorage.removeItem(`profile_cache_${userId}`);
            setProfile(null);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Listen for manual profile update events for immediate cross-component sync
  useEffect(() => {
    const handleManualUpdate = (event: any) => {
      const updatedData = event.detail as ProfileData;
      if (userId && updatedData && updatedData.id === userId) {
        // Refresh global image cache busting timestamp
        refreshImageCache();

        // Update caches
        profileMemoryCache[userId] = updatedData;
        try {
          localStorage.setItem(
            `profile_cache_${userId}`,
            JSON.stringify(updatedData),
          );
          localStorage.setItem(
            "navbar_profile_cache",
            JSON.stringify(updatedData),
          );
        } catch (e) {}

        // Update state
        setProfile(updatedData);
      }
    };

    window.addEventListener("profileUpdated", handleManualUpdate);
    return () =>
      window.removeEventListener("profileUpdated", handleManualUpdate);
  }, [userId]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refresh,
  };
};
