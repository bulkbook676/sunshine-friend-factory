import { User } from "lucide-react";

interface ProfileSummaryCardProps {
  name: string;
  role: "Owner" | "Agent" | "Distributor";
  business?: string;
  bio?: string;
  followers?: number;
  following?: number;
  totalSales?: string;
  initial?: string;
}

/**
 * Non-tappable profile summary card shown at the top of every Settings page.
 * Pure presentational — no business logic, no navigation.
 */
const ProfileSummaryCard = ({
  name,
  role,
  business,
  bio,
  followers,
  following,
  totalSales,
  initial,
}: ProfileSummaryCardProps) => {
  const safeInitial = (initial || name || "?")[0]?.toUpperCase() ?? "?";

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {/* Mock photo — initial in primary color */}
          <span className="text-2xl font-bold text-primary">{safeInitial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground truncate">{name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] uppercase tracking-wide font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {role}
            </span>
            {business && (
              <span className="text-xs text-muted-foreground truncate">{business}</span>
            )}
          </div>
          {bio && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">{bio}</p>
          )}
        </div>
      </div>

      {(followers !== undefined || following !== undefined || totalSales) && (
        <div className="flex items-center justify-around mt-4 pt-3 border-t border-border">
          {followers !== undefined && (
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{followers.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Followers</p>
            </div>
          )}
          {following !== undefined && (
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{following.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Following</p>
            </div>
          )}
          {totalSales && (
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{totalSales}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Sales</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileSummaryCard;