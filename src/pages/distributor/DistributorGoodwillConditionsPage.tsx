import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { GoodwillConditions } from "@/contexts/DistributorContext";

interface LocationState {
  initial?: { enabled: boolean; conditions?: GoodwillConditions };
  returnTo: string;
}

const DistributorGoodwillConditionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const [enabled, setEnabled] = useState<boolean>(state.initial?.enabled ?? false);
  const [minMonths, setMinMonths] = useState<string>(
    state.initial?.conditions?.minMonthsOnBulkbook?.toString() ?? ""
  );
  const [minMonthlySales, setMinMonthlySales] = useState<string>(
    state.initial?.conditions?.minMonthlySales?.toString() ?? ""
  );
  const [minOrderValue, setMinOrderValue] = useState<string>(
    state.initial?.conditions?.minOrderValue?.toString() ?? ""
  );
  const [repayment, setRepayment] = useState<string>(
    (state.initial?.conditions?.repaymentDays ?? 30).toString()
  );
  const [customRepayment, setCustomRepayment] = useState<string>("");
  const [customCondition, setCustomCondition] = useState<string>(
    state.initial?.conditions?.customCondition ?? ""
  );

  useEffect(() => {
    if (![30, 60, 90].includes(parseInt(repayment))) {
      // it's "Custom"
    }
  }, [repayment]);

  const isCustomRepayment = repayment === "custom";

  const handleSave = () => {
    const conditions: GoodwillConditions | undefined = enabled
      ? {
          repaymentDays: isCustomRepayment ? parseInt(customRepayment) || 30 : parseInt(repayment),
          minMonthsOnBulkbook: minMonths ? parseInt(minMonths) : undefined,
          minMonthlySales: minMonthlySales ? parseFloat(minMonthlySales) : undefined,
          minOrderValue: minOrderValue ? parseFloat(minOrderValue) : undefined,
          customCondition: customCondition || undefined,
        }
      : undefined;

    // Pass back via location state — return to caller with data
    if (state.returnTo) {
      navigate(state.returnTo, {
        state: { goodwillResult: { enabled, conditions } },
      });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-5 pt-4 pb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-6">Set Goodwill Conditions</h1>

        {/* Master toggle */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Allow buyers to pay after selling</p>
              <p className="text-xs text-muted-foreground">Allow qualified buyers to pay later</p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                enabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-background transition-transform ${
                  enabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {enabled && (
          <div className="space-y-4">
            {/* Min months */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Buyer must have been on Bulkbook for at least X months
              </label>
              <input
                type="number"
                value={minMonths}
                onChange={(e) => setMinMonths(e.target.value)}
                placeholder="e.g. 12"
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Min monthly sales */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Buyer must record at least ₦X in monthly sales
              </label>
              <input
                type="number"
                value={minMonthlySales}
                onChange={(e) => setMinMonthlySales(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Min order value */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Minimum order amount to qualify for goodwill
              </label>
              <input
                type="number"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                placeholder="e.g. 10000"
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* How long they have to pay you back */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">How long they have to pay you back</label>
              <select
                value={repayment}
                onChange={(e) => setRepayment(e.target.value)}
                className="w-full h-12 px-3 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
                <option value="custom">Custom</option>
              </select>
              {isCustomRepayment && (
                <input
                  type="number"
                  value={customRepayment}
                  onChange={(e) => setCustomRepayment(e.target.value)}
                  placeholder="Days"
                  className="w-full h-12 px-4 mt-2 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
            </div>

            {/* Custom condition */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Any other condition
              </label>
              <input
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                placeholder="e.g. Must have completed at least 2 paid orders with us before"
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full h-12 mt-6 rounded-lg bg-primary text-primary-foreground font-semibold text-sm"
        >
          Save Conditions
        </button>
      </div>
    </div>
  );
};

export default DistributorGoodwillConditionsPage;
