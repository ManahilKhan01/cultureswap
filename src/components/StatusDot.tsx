import {
  getStatusColor,
  getStatusLabel,
  getDisplayStatus,
  type UserStatus,
} from "@/lib/presenceService";

interface StatusDotProps {
  /** DB status value */
  status?: string | null;
  /** DB last_seen timestamp */
  lastSeen?: string | null;
  /** Pre-computed display status (overrides status + lastSeen) */
  displayStatus?: UserStatus;
  /** Dot size: 'sm' | 'md' | 'lg' */
  size?: "sm" | "md" | "lg";
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** CSS className override */
  className?: string;
}

const sizeMap = {
  sm: "h-2.5 w-2.5 border-[1.5px]",
  md: "h-3 w-3 border-2",
  lg: "h-3.5 w-3.5 border-2",
};

export const StatusDot = ({
  status,
  lastSeen,
  displayStatus: precomputedStatus,
  size = "md",
  showTooltip = true,
  className = "",
}: StatusDotProps) => {
  const computedStatus =
    precomputedStatus || getDisplayStatus(status || null, lastSeen || null);
  const colorClass = getStatusColor(computedStatus);
  const label = getStatusLabel(computedStatus);
  const sizeClass = sizeMap[size];

  return (
    <div
      className={`absolute bottom-0 right-0 ${sizeClass} rounded-full ${colorClass} border-white shadow-sm ${
        computedStatus === "online" ? "animate-pulse" : ""
      } ${className}`}
      title={showTooltip ? label : undefined}
    />
  );
};

export default StatusDot;
