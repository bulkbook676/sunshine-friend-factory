import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, TrendingUp, Boxes, Banknote } from "lucide-react";
import { products, computeStockStatus } from "@/data/mockData";
import OwnerBottomNav from "@/components/OwnerBottomNav";

/**
 * Detail view of "What You Have" — full inventory list with current stock
 * value, most-sold product, purchase cost, and total inventory value.
 */
const WhatYouHavePage = () => {
  const navigate = useNavigate();
  const fmt = (n: number) => `₦${Math.round(n).toLocaleString()}`;

  const enriched = products.map((p) => {
    const sold = p.salesHistory.reduce((a, b) => a + b, 0);
    const stockValueAtCost = p.currentStock * (p.costPrice / p.unitsPerBuyingUnit);
    return { ...p, sold, stockValueAtCost, status: computeStockStatus(p) };
  });
  const totalInventoryValue = enriched.reduce((s, p) => s + p.stockValueAtCost, 0);
  const totalPurchaseCost = enriched.reduce((s, p) => s + p.costPrice * Math.ceil(p.currentStock / p.unitsPerBuyingUnit), 0);
  const mostSold = [...enriched].sort((a, b) => b.sold - a.sold)[0];
  const mostSoldRevenue = mostSold ? mostSold.sold * mostSold.sellingPrice : 0;

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-base font-bold text-foreground">What You Have</h1>
          <div className="w-12" />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Boxes className="w-4 h-4 text-primary" />
              <p className="text-[11px] text-muted-foreground">Total inventory value</p>
            </div>
            <p className="text-xl font-bold text-foreground">{fmt(totalInventoryValue)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="w-4 h-4 text-warning" />
              <p className="text-[11px] text-muted-foreground">Purchase cost</p>
            </div>
            <p className="text-xl font-bold text-foreground">{fmt(totalPurchaseCost)}</p>
          </div>
        </div>

        {mostSold && (
          <div className="bg-success/5 border border-success/20 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-success" />
              <p className="text-xs font-semibold text-success uppercase tracking-wider">Most Sold</p>
            </div>
            <p className="text-base font-bold text-foreground">{mostSold.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {mostSold.sold} units · {fmt(mostSoldRevenue)} in revenue
            </p>
          </div>
        )}

        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Inventory ({enriched.length})
        </h2>
        <div className="space-y-2">
          {enriched.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/owner/product/${p.id}`)}
              className="w-full bg-card border border-border rounded-lg p-3 flex items-center gap-3 text-left active:opacity-80"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.currentStock} {p.sellingUnit}
                  {p.currentStock !== 1 ? "s" : ""} in stock
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">{fmt(p.stockValueAtCost)}</p>
                <p className="text-[10px] text-muted-foreground">at cost</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default WhatYouHavePage;
