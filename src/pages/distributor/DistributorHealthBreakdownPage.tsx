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
} from "lucide-react";
import { useDistributor } from "@/contexts/DistributorContext";
import DistributorBottomNav from "@/components/DistributorBottomNav";

const DistributorHealthBreakdownPage = () => {
  const navigate = useNavigate();
  const { products, orders, ownExpenses } = useDistributor();

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

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-base font-bold text-foreground">Business Health Score</h1>
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

        {/* Assets */}
        <div className="bg-card rounded-lg p-4 mb-3 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm font-semibold text-foreground">What You Have</span>
          </div>
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
                  <span className="text-sm text-primary">Cash In Promise</span>
                </div>
                <span className="text-sm font-medium text-primary">{fmt(adjustedCashInPromise)} →</span>
              </div>
              <p className="text-[10px] text-muted-foreground ml-5 mt-0.5">
                Tap to mark paid or record deposits
              </p>
            </button>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-sm font-semibold text-foreground">Total Assets</span>
              <span className="text-base font-bold text-foreground">{fmt(totalAssets)}</span>
            </div>
          </div>
        </div>

        {/* Liabilities */}
        <div className="bg-card rounded-lg p-4 mb-3 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-critical" />
            <span className="text-sm font-semibold text-foreground">What You've Spent</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-foreground">Cost of Goods</span>
              <span className="text-sm text-foreground">{fmt(totalCOGS)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-foreground">Daily Expenses</span>
              <span className="text-sm text-foreground">{fmt(dailyExpenses)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-sm font-semibold text-foreground">Total Liabilities</span>
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
        <div className="bg-card rounded-lg p-4 mb-3 border border-border">
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

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Tip</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Keep goodwill payments collected on time to maintain a strong score.
          </p>
        </div>
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorHealthBreakdownPage;
