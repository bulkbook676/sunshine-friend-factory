import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { products } from "@/data/mockData";
import { useExpenses } from "@/contexts/ExpensesContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";

const NetProfitBreakdownPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { expenses } = useExpenses();
  const periodIndex = parseInt(searchParams.get("period") || "0");

  const periods = [
    { label: "This Week", salesIdx: 6 },
    { label: "Last Week", salesIdx: 5 },
    { label: "March 2026", salesIdx: 4 },
    { label: "February 2026", salesIdx: 3 },
    { label: "January 2026", salesIdx: 2 },
  ];

  const idx = periods[periodIndex]?.salesIdx ?? 6;

  const productBreakdown = products
    .map((p) => {
      const unitsSold = p.salesHistory[idx] || 0;
      const revenue = unitsSold * p.sellingPrice;
      const cost = unitsSold * (p.costPrice / p.unitsPerBuyingUnit);
      const profit = revenue - cost;
      return { ...p, unitsSold, revenue, cost, profit };
    })
    .filter((p) => p.unitsSold > 0)
    .sort((a, b) => b.profit - a.profit);

  const totalRevenue = productBreakdown.reduce((s, p) => s + p.revenue, 0);
  const totalProductCost = productBreakdown.reduce((s, p) => s + p.cost, 0);
  const totalOperational = expenses.reduce((s, e) => s + e.amount, 0);
  const totalCost = totalProductCost + totalOperational;
  const netProfit = totalRevenue - totalCost;

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Your Profit Breakdown</h1>
        </div>

        {/* Summary */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Revenue</span>
            <span className="text-sm font-semibold text-success">₦{totalRevenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Product Costs</span>
            <span className="text-sm font-semibold text-foreground">₦{Math.round(totalProductCost).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Money spent running your business</span>
            <span className="text-sm font-semibold text-critical">₦{totalOperational.toLocaleString()}</span>
          </div>
          <div className="border-t border-border pt-2">
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-foreground">Your Profit</span>
              <span className={`text-lg font-bold ${netProfit >= 0 ? "text-success" : "text-critical"}`}>
                ₦{Math.abs(Math.round(netProfit)).toLocaleString()}
                {netProfit < 0 && " (loss)"}
              </span>
            </div>
          </div>
        </div>

        {/* Per product */}
        <h3 className="text-sm font-semibold text-foreground mb-3">Per Product</h3>
        <div className="space-y-2 mb-6">
          {productBreakdown.map((p) => (
            <div
              key={p.id}
              className={`bg-card rounded-2xl p-4 border ${p.profit < 0 ? "border-critical/30" : "border-border"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <p className={`text-sm font-bold ${p.profit >= 0 ? "text-success" : "text-critical"}`}>
                  {p.profit >= 0 ? "+" : "-"}₦{Math.abs(Math.round(p.profit)).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{p.unitsSold} sold</span>
                <span>Rev: ₦{p.revenue.toLocaleString()}</span>
                <span>Cost: ₦{Math.round(p.cost).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default NetProfitBreakdownPage;
