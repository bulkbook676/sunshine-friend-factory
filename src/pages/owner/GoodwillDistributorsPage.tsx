import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, MapPin } from "lucide-react";
import { distributors } from "@/data/distributors";
import OwnerBottomNav from "@/components/OwnerBottomNav";

// Mock — months of active usage
const MONTHS_ACTIVE = 4;
const REQUIRED_MONTHS = 6;

const GoodwillDistributorsPage = () => {
  const navigate = useNavigate();
  const unlocked = MONTHS_ACTIVE >= REQUIRED_MONTHS;

  const goodwillDistributors = distributors
    .map((d) => ({
      ...d,
      goodwillCount: d.products.filter((p) => p.goodwillAvailable).length,
    }))
    .filter((d) => d.goodwillCount > 0);

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-xl font-bold text-foreground">Good Faith Distributors</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Distributors offering goods you can pay for after selling
        </p>

        <div className="relative">
          <div className={`space-y-3 ${!unlocked ? "blur-sm pointer-events-none select-none" : ""}`}>
            {goodwillDistributors.map((d) => (
              <button
                key={d.id}
                onClick={() => navigate(`/owner/distributor/${d.id}`)}
                className="w-full bg-card rounded-2xl p-4 border border-border flex items-center gap-3 text-left active:opacity-80"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{d.logo}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{d.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{d.location}</span>
                  </div>
                  <p className="text-xs text-warning font-medium mt-1">
                    {d.goodwillCount} goodwill products available
                  </p>
                </div>
              </button>
            ))}
          </div>

          {!unlocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Lock className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-2">
                Use Bulkbook actively for {REQUIRED_MONTHS} months to unlock Good Faith.
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {REQUIRED_MONTHS - MONTHS_ACTIVE} months remaining
              </p>
              <div className="w-full max-w-[260px]">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{MONTHS_ACTIVE} months</span>
                  <span>{REQUIRED_MONTHS} months</span>
                </div>
                <div className="w-full h-3 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(MONTHS_ACTIVE / REQUIRED_MONTHS) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default GoodwillDistributorsPage;
