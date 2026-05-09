import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, Target, Sparkles, Loader2, Package, Banknote, HandCoins, Clock, Store, GitCompare, Landmark, Building2 } from "lucide-react";
import { products, computeStockStatus } from "@/data/mockData";
import { distributors } from "@/data/distributors";
import { useAuth } from "@/contexts/AuthContext";
import { useExpenses } from "@/contexts/ExpensesContext";
import { useSales } from "@/contexts/SalesContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";

const HealthBreakdownPage = () => {
  const navigate = useNavigate();
  const { businessName, setBusinessTarget } = useAuth();
  const { expenses } = useExpenses();
  const { getCashInHand, getCashInPromise } = useSales();
  const [activeTab, setActiveTab] = useState<"breakdown" | "target">("breakdown");

  const [targetMetric, setTargetMetric] = useState<"revenue" | "units">("revenue");
  const [targetPeriod, setTargetPeriod] = useState<"week" | "month" | "custom">("week");
  const [targetAmount, setTargetAmount] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [targetConfirmed, setTargetConfirmed] = useState(false);

  // ASSETS
  const productsWithStatus = products.map((p) => ({ ...p, status: computeStockStatus(p) }));
  const stockValue = productsWithStatus.reduce(
    (s, p) => s + p.currentStock * (p.costPrice / p.unitsPerBuyingUnit), 0
  );
  const goodsNotMoving = productsWithStatus
    .filter((p) => p.status === "dead")
    .reduce((s, p) => s + p.currentStock * (p.costPrice / p.unitsPerBuyingUnit), 0);
  const cashInHand = getCashInHand();
  const cashInPromise = getCashInPromise();
  const totalAssets = stockValue + goodsNotMoving + cashInHand + cashInPromise;

  // LIABILITIES
  const totalCostOfGoods = products.reduce((s, p) => s + p.costPrice * Math.ceil(p.currentStock / p.unitsPerBuyingUnit), 0);
  const productExpenses = Math.round(totalCostOfGoods * 0.12);
  const dailyExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalLiabilities = totalCostOfGoods + productExpenses + dailyExpenses;

  const score = totalAssets + totalLiabilities > 0
    ? Math.round((totalAssets / (totalAssets + totalLiabilities)) * 100)
    : 50;
  const scoreColor = score <= 40 ? "text-critical" : score <= 70 ? "text-warning" : "text-success";
  const scoreBg = score <= 40 ? "bg-critical" : score <= 70 ? "bg-warning" : "bg-success";
  const diff = Math.abs(totalAssets - totalLiabilities);
  const isHealthy = totalAssets >= totalLiabilities;

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString()}`;

  const weeklyRevenue = products.reduce(
    (s, p) => s + p.salesHistory.reduce((a, b) => a + b, 0) * p.sellingPrice, 0
  );
  const currentProgress = targetMetric === "revenue" ? weeklyRevenue : 87;

  const handleAnalyse = () => {
    if (!targetAmount) return;
    setAnalysing(true);
    setTimeout(() => {
      const target = parseInt(targetAmount);
      const dailyNeeded = Math.ceil(target / 7);
      setAnalysis(
        targetMetric === "revenue"
          ? `Based on your current weekly revenue of ${fmt(weeklyRevenue)}, a target of ${fmt(target)} is ${target <= weeklyRevenue * 1.3 ? "realistic" : "ambitious but achievable"}.\n\nDaily target: ${fmt(dailyNeeded)} per day.\n\nTop products to push:\n• Indomie Chicken — high demand, good margins\n• Dangote Sugar — fast mover\n• Peak Milk — consistent seller`
          : `A target of ${target} units is ${target <= 100 ? "realistic" : "ambitious"}.\n\nDaily target: ${dailyNeeded} units per day.\n\nFocus on high-velocity items and bundle deals.`
      );
      setAnalysing(false);
    }, 2000);
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
    }, 1500);
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-base font-bold text-foreground">How Your Business Is Doing</h1>
          <div className="w-12" />
        </div>

        {/* Score */}
        <div className="flex flex-col items-center mb-4">
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
            {/* Target progress */}
            {targetConfirmed && targetAmount && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Target Progress</span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {targetMetric === "revenue" ? fmt(currentProgress) : currentProgress} / {targetMetric === "revenue" ? fmt(parseInt(targetAmount)) : targetAmount}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (currentProgress / parseInt(targetAmount)) * 100)}%` }} />
                </div>
              </div>
            )}

            {/* ASSETS — What You Have */}
            <div className="bg-card rounded-lg p-4 mb-3 border border-border">
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
                <div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-foreground" />
                      <span className="text-sm text-foreground">Your Value of your current stock</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{fmt(stockValue)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-5.5 mt-0.5">Everything sitting on your shelf right now</p>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-warning" />
                      <span className="text-sm text-warning">Stock that hasn't sold in 30 days</span>
                    </div>
                    <span className="text-sm font-medium text-warning">{fmt(goodsNotMoving)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-5.5 mt-0.5">Still yours, just sitting too long</p>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-3.5 h-3.5 text-success" />
                      <span className="text-sm text-success">Money you've already collected</span>
                    </div>
                    <span className="text-sm font-medium text-success">{fmt(cashInHand)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-5.5 mt-0.5">Money already in your pocket</p>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <HandCoins className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm text-primary">Money owed to you</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary">{fmt(cashInPromise)}</span>
                      {cashInPromise > 0 && (
                        <button onClick={() => navigate("/owner/promises")} className="text-[10px] text-primary underline">View All</button>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-5.5 mt-0.5">Sales made but not yet paid</p>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="text-sm font-semibold text-foreground">Total of what you have</span>
                  <span className="text-base font-bold text-foreground">{fmt(totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* LIABILITIES — What You've Spent */}
            <div className="bg-card rounded-lg p-4 mb-3 border border-border">
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
                  <span className="text-sm text-foreground">{fmt(totalCostOfGoods)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground">Product Expenses</span>
                  <span className="text-sm text-foreground">{fmt(productExpenses)}</span>
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
            <div className={`rounded-lg p-4 mb-4 border ${isHealthy ? "bg-success/5 border-success/20" : "bg-critical/5 border-critical/20"}`}>
              <p className="text-sm text-foreground leading-relaxed">
                {isHealthy
                  ? `Your assets are bigger than what you've spent by ${fmt(diff)}. Your business is in good shape.`
                  : `What you've spent exceeds what you have by ${fmt(diff)}. You are currently operating at a loss.`}
              </p>
            </div>

            {/* Business Relationships */}
            <h2 className="text-sm font-semibold text-foreground mb-3">Your Business Relationships</h2>

            <div className="bg-card rounded-lg p-4 mb-3 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Store className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Distributors You've Worked With</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No distributor relationships yet. Keep building your score to unlock verified distributors.
              </p>
            </div>

            <div className="bg-card rounded-lg p-4 mb-3 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <GitCompare className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Compare Distributors</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Find better suppliers</p>
              <div className="space-y-2">
                {distributors.slice(0, 3).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => navigate(`/owner/distributor/${d.id}`)}
                    className="w-full flex items-center gap-3 bg-muted/50 rounded-lg p-3 text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {d.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                      <p className="text-[10px] text-muted-foreground">{d.location} · {d.products.length} products</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 mb-3 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Landmark className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Loans You Can Apply For</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Money to grow your business</p>
              {score >= 70 ? (
                <div className="bg-muted/50 rounded-lg p-3 mt-2">
                  <p className="text-sm font-medium text-foreground">Bulkbook Micro Loan</p>
                  <p className="text-xs text-muted-foreground">₦50,000 – ₦200,000 · 5% monthly · Score 70+</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Keep your score above 70 for 30 days to unlock loan options.
                </p>
              )}
            </div>

            <div className="bg-card rounded-lg p-4 mb-6 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Banks You've Worked With</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No banking relationships recorded yet.
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
              <input type="number" placeholder={targetMetric === "revenue" ? "e.g. 100000" : "e.g. 200"} value={targetAmount} onChange={(e) => { setTargetAmount(e.target.value); setAnalysis(null); setTargetConfirmed(false); }} className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground" />
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
                <p className="text-xs text-muted-foreground mt-1">Notifications sent to all sub accounts</p>
              </div>
            )}
          </div>
        )}
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default HealthBreakdownPage;
