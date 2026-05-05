import { useEffect, useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import {
  follow,
  unfollow,
  isFollowing,
  subscribeFollow,
} from "@/data/followStore";

interface FollowButtonProps {
  /** ID of the profile being followed (owner/distributor only) */
  targetId: string;
  /** ID of the viewer doing the following */
  viewerId: string;
  size?: "sm" | "md";
}

/**
 * Toggles follow state. Confirms before unfollowing.
 * Owners and distributors can use it; agents cannot be followed,
 * so this button is only rendered on owner/distributor profiles.
 */
const FollowButton = ({ targetId, viewerId, size = "md" }: FollowButtonProps) => {
  const [active, setActive] = useState(() => isFollowing(viewerId, targetId));

  useEffect(() => {
    const unsub = subscribeFollow(() => setActive(isFollowing(viewerId, targetId)));
    setActive(isFollowing(viewerId, targetId));
    return () => {
      unsub();
    };
  }, [viewerId, targetId]);

  const handle = () => {
    if (active) {
      if (!window.confirm("Unfollow this account?")) return;
      unfollow(viewerId, targetId);
    } else {
      follow(viewerId, targetId);
    }
  };

  const padding = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <button
      onClick={handle}
      className={`flex items-center gap-1.5 rounded-full font-semibold transition-colors ${padding} ${
        active
          ? "bg-card border border-border text-foreground"
          : "bg-primary text-primary-foreground"
      }`}
    >
      {active ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
      {active ? "Following" : "Follow"}
    </button>
  );
};

export default FollowButton;