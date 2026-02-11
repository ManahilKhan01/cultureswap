import { supabase } from "./supabase";

export type UserStatus = "online" | "offline" | "busy";

export interface UserPresence {
  status: UserStatus;
  last_seen: string;
}

// How long before a user is considered offline (2 minutes)
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;
// Heartbeat interval (60 seconds)
const HEARTBEAT_INTERVAL_MS = 60 * 1000;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Determine the effective display status based on DB status + last_seen
 */
export function getDisplayStatus(
  status: string | null,
  lastSeen: string | null,
): UserStatus {
  // Explicit status overrides
  if (status === "busy") return "busy";
  if (status === "offline") return "offline";

  // No last_seen = never been online
  if (!lastSeen) return "offline";

  // Check if heartbeat is fresh (within threshold)
  const timeDiff = Date.now() - new Date(lastSeen).getTime();
  if (timeDiff <= ONLINE_THRESHOLD_MS) return "online";
  return "offline";
}

/**
 * Get the CSS color class for a status
 */
export function getStatusColor(displayStatus: UserStatus): string {
  switch (displayStatus) {
    case "online":
      return "bg-green-500";
    case "busy":
      return "bg-red-500";
    case "offline":
    default:
      return "bg-gray-400";
  }
}

/**
 * Get the status label text
 */
export function getStatusLabel(displayStatus: UserStatus): string {
  switch (displayStatus) {
    case "online":
      return "Online";
    case "busy":
      return "In Session";
    case "offline":
    default:
      return "Offline";
  }
}

export const presenceService = {
  /**
   * Start the heartbeat — call once on app mount.
   * Updates last_seen every 60s while the tab is active.
   */
  startHeartbeat() {
    if (heartbeatTimer) return; // Already running

    const sendHeartbeat = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from("user_profiles")
          .update({ last_seen: new Date().toISOString(), status: "online" })
          .eq("id", user.id);
      } catch (error) {
        // Silent fail — don't break the app for presence
      }
    };

    // Send immediately, then every 60s
    sendHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    // When user is leaving the page, mark offline
    const handleBeforeUnload = () => {
      const user = supabase.auth.getUser();
      supabase
        .from("user_profiles")
        .update({ status: "offline", last_seen: new Date().toISOString() })
        .eq("id", (user as any)?.data?.user?.id)
        .then(() => {});
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendHeartbeat();
      } else {
        sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
  },

  /**
   * Stop the heartbeat (e.g., on logout)
   */
  stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  },

  /**
   * Manually set user status (e.g., 'busy' when in a session)
   */
  async setStatus(status: UserStatus) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("user_profiles")
        .update({ status, last_seen: new Date().toISOString() })
        .eq("id", user.id);
    } catch (error) {
      console.error("presenceService.setStatus error:", error);
    }
  },

  /**
   * Get presence info for a single user
   */
  async getUserPresence(userId: string): Promise<UserPresence> {
    try {
      const { data } = await supabase
        .from("user_profiles")
        .select("status, last_seen")
        .eq("id", userId)
        .single();

      return {
        status: getDisplayStatus(data?.status, data?.last_seen),
        last_seen: data?.last_seen || "",
      };
    } catch {
      return { status: "offline", last_seen: "" };
    }
  },

  /**
   * Batch fetch presence for multiple users (for lists)
   */
  async getBatchPresence(
    userIds: string[],
  ): Promise<Record<string, UserPresence>> {
    const result: Record<string, UserPresence> = {};

    if (!userIds.length) return result;

    try {
      const { data } = await supabase
        .from("user_profiles")
        .select("id, status, last_seen")
        .in("id", userIds);

      if (data) {
        data.forEach((row: any) => {
          result[row.id] = {
            status: getDisplayStatus(row.status, row.last_seen),
            last_seen: row.last_seen || "",
          };
        });
      }
    } catch {
      // Return empty on error
    }

    // Fill missing with offline
    userIds.forEach((id) => {
      if (!result[id]) {
        result[id] = { status: "offline", last_seen: "" };
      }
    });

    return result;
  },
};
