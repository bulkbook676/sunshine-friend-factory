import { Lock } from "lucide-react";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const DistributorPage = () => {
  const navigate = useNavigate();
  const daysCompleted = 23;

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <div className="flex flex-col items-center text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-muted-foreground" />
          </div>

          <h1 className="text-xl font-bold text-foreground mb-2">Distributor Network</h1>
          <p className="text-sm text-muted-foreground max-w-[280px] mb-8">
            Use Bulkbook actively for 90 days to unlock verified distributor access — better prices, direct supply, no middleman.
          </p>

          {/* Progress */}
          <div className="w-full max-w-[280px] mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{daysCompleted} days</span>
              <span>90 days</span>
            </div>
            <div className="w-full h-3 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(daysCompleted / 90) * 100}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{90 - daysCompleted} days to go</p>

          <div className="mt-10 bg-card rounded-2xl p-5 border border-border text-left w-full">
            <h3 className="text-sm font-semibold text-foreground mb-3">What you unlock</h3>
            <ul className="space-y-2">
              {[
                "Direct pricing from verified distributors",
                "No middleman markup on key products",
                "Priority access to bulk deals",
                "Category-specific supplier matching",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default DistributorPage;
