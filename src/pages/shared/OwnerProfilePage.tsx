import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Users } from "lucide-react";
import { products } from "@/data/mockData";
import FollowButton from "@/components/FollowButton";
import { getFollowerCount, seedFollowerBase, subscribeFollow } from "@/data/followStore";
import { useAuth } from "@/contexts/AuthContext";

// Mock owner profiles registry — distributors viewing
const ownerProfiles: Record<string, {
  id: string;
  businessName: string;
  location: string;
  monthsActive: number;
  avatar: string;
}> = {
  "owner-current": {
    id: "owner-current",
    businessName: "Mama Nkechi Provisions",
    location: "Alaba, Lagos",
    monthsActive: 8,
    avatar: "M",
  },
  "owner-mn": {
    id: "owner-mn",
    businessName: "Mama Nkechi Provisions",
    location: "Alaba, Lagos",
    monthsActive: 8,
    avatar: "M",
  },
};

const OwnerProfilePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const owner = ownerProfiles[id || ""] || ownerProfiles["owner-current"];
  const { businessName } = useAuth();
  const viewerId = `distributor:${businessName || "viewer"}`;
  const targetId = `owner:${owner.id}`;
  seedFollowerBase(targetId, 312);
  const [followerCount, setFollowerCount] = useState(getFollowerCount(targetId));
  useEffect(() => {
    const unsub = subscribeFollow(() => setFollowerCount(getFollowerCount(targetId)));
    return () => { unsub(); };
  }, [targetId]);

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{owner.avatar}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{owner.businessName}</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{owner.location}</span>
            </div>
          </div>
        </div>

        {/* Followers + Follow */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-sm">
              <span className="font-bold text-foreground">{followerCount.toLocaleString()}</span>{" "}
              Followers
            </span>
          </div>
          <FollowButton viewerId={viewerId} targetId={targetId} />
        </div>

        {/* Tenure */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Active on Bulkbook for {owner.monthsActive} months
            </p>
            <p className="text-xs text-muted-foreground">Member since {new Date(Date.now() - owner.monthsActive * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Products in Inventory</p>
            <p className="text-2xl font-bold text-foreground">{products.length}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Months Active</p>
            <p className="text-2xl font-bold text-foreground">{owner.monthsActive}</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OwnerProfilePage;
