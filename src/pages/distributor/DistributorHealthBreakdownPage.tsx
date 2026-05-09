import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Package,
  Banknote,
  HandCoins,
  Store,
  Zap,
  Target,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useDistributor } from "@/contexts/DistributorContext";
import { useAuth } from "@/contexts/AuthContext";
import DistributorBottomNav from "@/components/DistributorBottomNav";

const DistributorHealthBreakdownPage = () => {
  const navigate = useNavigate();
  const { products, orders, ownExpenses } = useDistributor();
  const { setBusinessTarget, businessTarget } = useAuth();
  const [activeTab, setActiveTab] = useState<"breakdown" | "target">("breakdown");
  const [targetMetric, setTargetMetric] = useState<"revenue" | "units">("revenue");
  const [targetPeriod, setTargetPeriod] = useState<"week" | "month" | "custom">("week");
  const [targetAmount, setTargetAmount] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [targetConfirmed, setTargetConfirmed] = useState(false);

  // Inventory at cost
  const inventoryValue = products.reduce((s, p) => s + p.costPrice * p.currentStock, 0);
  // Cash received: cash items from confirmed/shipped/delivered orders
  const cashReceived = orders
    .filter((o) => ["confirmed", "shipped", "delivered"].includes(o.status))
    .reduce(
      (s, o) =>
        s + o.items.filter((i) => i.paymentType === "cash").reduce((ss, i) => ss + i.qty * i.unitPrice, 0),
      0
    );
  // Cash in promise: outstanding goodwill from confirmed/shipped/delivered
  const cashInPromise = orders
    .filter((o) => ["confirmed", "shipped", "delivered"].includes(o.status))
    .reduce(
      (s, o) =>
        s + o.items.filter((i) => i.paymentType === "goodwill").reduce((ss, i) => ss + i.qty * i.unitPrice, 0),
      0
    );

  // Subtract any deposits already collected from outstanding goodwill
  const goodwillDepositsCollected = orders.reduce(
    (s, o) => s + (o.goodwillDeposits?.reduce((ss, d) => ss + d.amount, 0) ?? 0),
    0
  );
  const adjustedCashInPromise = Math.max(0, cashInPromise - goodwillDepositsCollected);

  const totalAssets = inventoryValue + cashReceived + adjustedCashInPromise + goodwillDepositsCollected;
  const totalCOGS = products.reduce((s, p) => s + p.costPrice * p.currentStock, 0);
  const dailyExpenses = ownExpenses.reduce((s, e) => s + e.amount, 0);
  const totalLiabilities = totalCOGS + dailyExpenses;

  const score =
    totalAssets + totalLiabilities > 0
      ? Math.round((totalAssets / (totalAssets + totalLiabilities)) * 100)
      : 50;
  const scoreColor = score <= 40 ? "text-critical" : score <= 70 ? "text-warning" : "text-success";
  const scoreBg = score <= 40 ? "bg-critical" : score <= 70 ? "bg-warning" : "bg-success";
  const diff = Math.abs(totalAssets - totalLiabilities);
  const isHealthy = totalAssets >= totalLiabilities;

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString()}`;

  // Buyer relationships count
  const buyerNames = Array.from(new Set(orders.map((o) => o.buyerName)));

  // Distributor weekly revenue proxy: total cash received last 7 days from confirmed/shipped/delivered
  const weeklyRevenue = cashReceived;
  const currentProgress = targetMetric === "revenue" ? weeklyRevenue : Math.round(weeklyRevenue / 1000);

  const handleAnalyse = () => {
    if (!targetAmount) return;
    setAnalysing(true);
    setTimeout(() => {
      const target = parseInt(targetAmount);
      const dailyNeeded = Math.ceil(target / 7);
      setAnalysis(
        targetMetric === "revenue"
          ? `Based on your current weekly revenue of ${fmt(weeklyRevenue)}, a target of ${fmt(target)} is ${target <= weeklyRevenue * 1.3 ? "realistic" : "ambitious but achievable"}.\n\nDaily target: ${fmt(dailyNeeded)} per day.\n\nFocus areas:\n• Push goodwill collections\n• Re-engage dormant buyers\n• Promote fast-moving SKUs`
          : `A target of ${target} units is ${target <= 200 ? "realistic" : "ambitious"}.\n\nDaily target: ${dailyNeeded} units per day.\n\nPrioritise bulk orders and standing weekly customers.`
      );
      setAnalysing(false);
    }, 1500);
  };

  const handleConfirmTarget = () => {
    if (!targetAmount) return;
    setConfirming(true);
    setTimeout(() => {
      const target = parseInt(targetAmount);
      const periodLabel = targetPeriod === "week" ? "This Week" : targetPeriod === "month" ? "This Month" : "Custom";
      setBusinessTarget({ metric: targetMetric, target, period: periodLabel, progress: currentProgress });
      setConfirming(false);
      setTargetConfirmed(true);
    }, 1200);
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-base font-bold text-foreground">Business Health</h1>
          <div className="w-12" />
        </div>

        {/* Score */}
        <div className="flex flex-col items-center mb-6">
          <div className={`text-6xl font-bold ${scoreColor}`}>{score}</div>
          <span className="text-sm text-muted-foreground">/100</span>
          <div className="w-full h-3 rounded-full bg-muted mt-4">
            <div className={`h-full rounded-full ${scoreBg} transition-all`} style={{ width: `${score}%` }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab("breakdown")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "breakdown" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Breakdown
          </button>
          <button
            onClick={() => setActiveTab("target")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "target" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Set Your Target
          </button>
        </div>

        {activeTab === "breakdown" && (
          <>
        {businessTarget && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{businessTarget.period} Target</span>
              </div>
              <span className="text-sm font-bold text-primary">
                {businessTarget.metric === "revenue" ? fmt(currentProgress) : currentProgress} / {businessTarget.metric === "revenue" ? fmt(businessTarget.target) : businessTarget.target}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (currentProgress / Math.max(1, businessTarget.target)) * 100)}%` }} />
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl p-4 mb-3 border border-border">
          <button
            onClick={() => navigate("/owner/health/what-you-have")}
            className="w-full flex items-center justify-between mb-3 active:opacity-80"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm font-semibold text-foreground">What You Have</span>
            </div>
            <span className="text-[11px] text-primary font-medium">Details →</span>
          </button>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-foreground" />
                <span className="text-sm text-foreground">Inventory Value</span>
              </div>
              <span className="text-sm font-medium text-foreground">{fmt(inventoryValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Banknote className="w-3.5 h-3.5 text-success" />
                <span className="text-sm text-success">Cash Received</span>
              </div>
              <span className="text-sm font-medium text-success">{fmt(cashReceived)}</span>
            </div>
            <button
              onClick={() => navigate("/distributor/promises")}
              className="w-full text-left active:opacity-80"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <HandCoins className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm text-primary">Money owed to you</span>
                </div>
                <span className="text-sm font-medium text-primary">{fmt(adjustedCashInPromise)} →</span>
              </div>
              <p className="text-[10px] text-muted-foreground ml-5 mt-0.5">
                Tap to mark paid or record deposits
              </p>
            </button>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-sm font-semibold text-foreground">Total of what you have</span>
              <span className="text-base font-bold text-foreground">{fmt(totalAssets)}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 mb-3 border border-border">
          <button
            onClick={() => navigate("/owner/health/what-you-spent")}
            className="w-full flex items-center justify-between mb-3 active:opacity-80"
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-critical" />
              <span className="text-sm font-semibold text-foreground">What You've Spent</span>
            </div>
            <span className="text-[11px] text-primary font-medium">Details →</span>
          </button>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-foreground">Price you paid for the goods</span>
              <span className="text-sm text-foreground">{fmt(totalCOGS)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-foreground">Money spent running your business</span>
              <span className="text-sm text-foreground">{fmt(dailyExpenses)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-sm font-semibold text-foreground">Total of what you've spent</span>
              <span className="text-base font-bold text-foreground">{fmt(totalLiabilities)}</span>
            </div>
          </div>
        </div>

        {/* Verdict */}
        <div
          className={`rounded-lg p-4 mb-4 border ${
            isHealthy ? "bg-success/5 border-success/20" : "bg-critical/5 border-critical/20"
          }`}
        >
          <p className="text-sm text-foreground leading-relaxed">
            {isHealthy
              ? `Your assets exceed liabilities by ${fmt(diff)}. Your depot is in good shape.`
              : `Liabilities exceed assets by ${fmt(diff)}. Tighten your cost of goods.`}
          </p>
        </div>

        {/* Relationships */}
        <h2 className="text-sm font-semibold text-foreground mb-3">Your Business Relationships</h2>
        <div className="bg-card rounded-2xl p-4 mb-3 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Buyers You've Supplied</span>
          </div>
          {buyerNames.length === 0 ? (
            <p className="text-sm text-muted-foreground">No buyer relationships yet.</p>
          ) : (
            <div className="space-y-2">
              {buyerNames.slice(0, 5).map((b) => (
                <div key={b} className="flex items-center gap-2 py-1">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {b[0]}
                  </div>
                  <span className="text-sm text-foreground">{b}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Tip</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Keep goodwill payments collected on time to maintain a strong score.
          </p>
        </div>
          </>
        )}

        {activeTab === "target" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Target metric</label>
              <div className="flex bg-muted rounded-xl p-1">
                <button onClick={() => setTargetMetric("revenue")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${targetMetric === "revenue" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Money Collected</button>
                <button onClick={() => setTargetMetric("units")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${targetMetric === "units" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Units Sold</button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Time period</label>
              <div className="flex bg-muted rounded-xl p-1">
                {(["week", "month", "custom"] as const).map((p) => (
                  <button key={p} onClick={() => setTargetPeriod(p)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${targetPeriod === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                    {p === "week" ? "This Week" : p === "month" ? "This Month" : "Custom"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Target {targetMetric === "revenue" ? "amount (₦)" : "units"}</label>
              <input
                type="number"
                placeholder={targetMetric === "revenue" ? "e.g. 500000" : "e.g. 1000"}
                value={targetAmount}
                onChange={(e) => { setTargetAmount(e.target.value); setAnalysis(null); setTargetConfirmed(false); }}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <button onClick={handleAnalyse} disabled={!targetAmount || analysing} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              {analysing ? "Analysing..." : "Analyse Target"}
            </button>
            {analysis && (
              <div className="bg-card rounded-xl p-4 border border-border animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">AI Assessment</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{analysis}</p>
              </div>
            )}
            {analysis && !targetConfirmed && (
              <button onClick={handleConfirmTarget} disabled={confirming} className="w-full py-3 rounded-xl bg-success text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70">
                {confirming ? <><Loader2 className="w-4 h-4 animate-spin" />Confirming...</> : <><Target className="w-4 h-4" />Confirm Target</>}
              </button>
            )}
            {targetConfirmed && (
              <div className="bg-success/10 border border-success/20 rounded-xl p-3 text-center animate-fade-in">
                <p className="text-sm text-success font-medium">Target confirmed! 🎯</p>
                <p className="text-xs text-muted-foreground mt-1">Notifications sent to your agents</p>
              </div>
            )}
          </div>
        )}
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorHealthBreakdownPage;
