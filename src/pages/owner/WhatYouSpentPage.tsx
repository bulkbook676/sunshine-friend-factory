import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingDown, Receipt, Package } from "lucide-react";
import { products } from "@/data/mockData";
import { useExpenses } from "@/contexts/ExpensesContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";

/**
 * Detail view of "What You've Spent" — itemised recurring + variable costs,
 * cost of goods sold, and net margin breakdown by category and period.
 */
const WhatYouSpentPage = () => {
  const navigate = useNavigate();
  const { expenses } = useExpenses();
  const fmt = (n: number) => `₦${Math.round(n).toLocaleString()}`;

  // Mock recurring expenses (realistic Nigerian context)
  const recurring = [
    { label: "Shop Rent", amount: 45000, category: "Rent" },
    { label: "Sales Agent Salary", amount: 35000, category: "Salaries" },
    { label: "Transport (deliveries)", amount: 12000, category: "Logistics" },
    { label: "Electricity (NEPA + Generator fuel)", amount: 18500, category: "Utilities" },
    { label: "Internet / Airtime", amount: 6000, category: "Utilities" },
  ];
  const totalRecurring = recurring.reduce((s, r) => s + r.amount, 0);

  // Cost of goods sold (over the 7-day window we have history for)
  const cogs = useMemo(
    () =>
      products.reduce(
        (s, p) =>
          s + p.salesHistory.reduce((a, b) => a + b, 0) * (p.costPrice / p.unitsPerBuyingUnit),
        0,
      ),
    [],
  );
  const purchasingCost = products.reduce(
    (s, p) => s + p.costPrice * Math.ceil(p.currentStock / p.unitsPerBuyingUnit),
    0,
  );
  const dailyExpensesTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const totalSpent = totalRecurring + cogs + dailyExpensesTotal;

  // Net margin (rough: revenue - cogs - expenses)
  const revenue = products.reduce(
    (s, p) => s + p.salesHistory.reduce((a, b) => a + b, 0) * p.sellingPrice,
    0,
  );
  const netMargin = revenue - cogs - dailyExpensesTotal - totalRecurring;
  const netMarginPct = revenue > 0 ? (netMargin / revenue) * 100 : 0;

  // Group daily expenses by category
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.type ?? "Other"] = (acc[e.type ?? "Other"] ?? 0) + e.amount;
    return acc;
  }, {});

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-base font-bold text-foreground">What You've Spent</h1>
          <div className="w-12" />
        </div>

        {/* Total spent header */}
        <div className="bg-critical/5 border border-critical/20 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-critical" />
            <p className="text-xs font-semibold text-critical uppercase tracking-wider">Total spent (this period)</p>
          </div>
          <p className="text-3xl font-bold text-foreground">{fmt(totalSpent)}</p>
        </div>

        {/* Recurring expenses */}
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Recurring Expenses (monthly)
        </h2>
        <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-2">
          {recurring.map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">{r.label}</p>
                <p className="text-[10px] text-muted-foreground">{r.category}</p>
              </div>
              <p className="text-sm font-semibold text-foreground">{fmt(r.amount)}</p>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-base font-bold text-foreground">{fmt(totalRecurring)}</span>
          </div>
        </div>

        {/* Price you paid for the goods Sold */}
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Price you paid for the goods Sold
        </h2>
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-warning" />
            <div className="flex-1">
              <p className="text-sm text-foreground">Cost of goods you sold (last 7 days)</p>
              <p className="text-[11px] text-muted-foreground">Direct cost of items sold</p>
            </div>
            <p className="text-base font-bold text-warning">{fmt(cogs)}</p>
          </div>
          <div className="border-t border-border mt-3 pt-3 flex justify-between">
            <span className="text-sm text-foreground">Total purchasing cost (current stock)</span>
            <span className="text-sm font-semibold text-foreground">{fmt(purchasingCost)}</span>
          </div>
        </div>

        {/* Daily logged expenses */}
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Money spent running your business by Category
        </h2>
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          {Object.keys(byCategory).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">No daily expenses logged yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(byCategory).map(([cat, amt]) => (
                <div key={cat} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{cat}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{fmt(amt)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-base font-bold text-foreground">{fmt(dailyExpensesTotal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Net margin */}
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Net Margin
        </h2>
        <div
          className={`rounded-lg p-4 mb-6 border ${
            netMargin >= 0 ? "bg-success/5 border-success/20" : "bg-critical/5 border-critical/20"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-foreground">Money Collected</span>
            <span className="text-sm font-semibold text-foreground">{fmt(revenue)}</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-foreground">Less: Cost of goods + Expenses</span>
            <span className="text-sm font-semibold text-foreground">{fmt(cogs + dailyExpensesTotal + totalRecurring)}</span>
          </div>
          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Net Margin</span>
            <span className={`text-base font-bold ${netMargin >= 0 ? "text-success" : "text-critical"}`}>
              {fmt(netMargin)} ({Math.round(netMarginPct)}%)
            </span>
          </div>
        </div>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default WhatYouSpentPage;
