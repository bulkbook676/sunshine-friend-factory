import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { products } from "@/data/mockData";
import { useExpenses } from "@/contexts/ExpensesContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";

const CostBreakdownPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { expenses } = useExpenses();
  const periodIdx = parseInt(searchParams.get("period") || "0");

  const salesIndices = [6, 5, 4, 3, 2];
  const idx = salesIndices[periodIdx] ?? 6;

  const cogBreakdown = products
    .map((p) => {
      const unitsSold = p.salesHistory[idx];
      const cogPerUnit = p.costPrice / p.unitsPerBuyingUnit;
      return { name: p.name, unitsSold, cog: unitsSold * cogPerUnit };
    })
    .filter((p) => p.unitsSold > 0)
    .sort((a, b) => b.cog - a.cog);

  const productExpenseBreakdown = products
    .map((p) => {
      const unitsSold = p.salesHistory[idx];
      const transportPerUnit = (p.costPrice / p.unitsPerBuyingUnit) * 0.05;
      return { name: p.name, unitsSold, expense: Math.round(unitsSold * transportPerUnit) };
    })
    .filter((p) => p.unitsSold > 0 && p.expense > 0)
    .sort((a, b) => b.expense - a.expense);

  const totalCog = cogBreakdown.reduce((s, p) => s + p.cog, 0);
  const totalProductExpenses = productExpenseBreakdown.reduce((s, p) => s + p.expense, 0);

  // Operational expenses
  const operationalExpenses = expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalOperational = operationalExpenses.reduce((s, e) => s + e.amount, 0);

  const totalCost = totalCog + totalProductExpenses + totalOperational;

  const typeBadgeColor: Record<string, string> = {
    "Fuel/Generator": "bg-warning/20 text-warning",
    "Rent": "bg-primary/20 text-primary",
    "Salary": "bg-success/20 text-success",
    "Packaging": "bg-secondary/20 text-secondary",
    "Transport": "bg-accent/30 text-foreground",
    "Market Levy": "bg-muted text-muted-foreground",
    "Electricity": "bg-warning/20 text-warning",
    "Miscellaneous": "bg-muted text-muted-foreground",
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-xl font-bold text-foreground mb-1">Cost Breakdown</h1>
        <p className="text-sm text-muted-foreground mb-6">Where your money went</p>

        {/* Section 1: Product Costs */}
        <h3 className="text-sm font-semibold text-foreground mb-3">Price you paid for the goods</h3>
        <div className="space-y-3 mb-6">
          {cogBreakdown.map((p, i) => (
            <div key={i} className="bg-card rounded-2xl p-4 border border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.unitsSold} units</p>
              </div>
              <p className="text-sm font-bold text-foreground">₦{Math.round(p.cog).toLocaleString()}</p>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-foreground mb-3">Product Expenses (Transport & Handling)</h3>
        <div className="space-y-3 mb-6">
          {productExpenseBreakdown.map((p, i) => (
            <div key={i} className="bg-card rounded-2xl p-4 border border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{p.name}</p>
              </div>
              <p className="text-sm font-bold text-warning">₦{p.expense.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Section 2: Money spent running your business */}
        <h3 className="text-sm font-semibold text-foreground mb-3">Money spent running your business</h3>
        <div className="space-y-3 mb-6">
          {operationalExpenses.map((e) => (
            <div key={e.id} className="bg-card rounded-2xl p-4 border border-border flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeBadgeColor[e.type] || "bg-muted text-muted-foreground"}`}>
                    {e.type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()}</span>
                  {e.role === "agent" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-medium">{e.loggedBy}</span>
                  )}
                </div>
              </div>
              <p className="text-sm font-bold text-critical">₦{e.amount.toLocaleString()}</p>
            </div>
          ))}
          {operationalExpenses.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No daily expenses logged</p>
          )}
        </div>

        {/* Total */}
        <div className="bg-primary/10 rounded-lg p-5 mb-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Price you paid for the goods</span>
              <span className="text-sm font-semibold text-foreground">₦{Math.round(totalCog).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Product Expenses</span>
              <span className="text-sm font-semibold text-foreground">₦{totalProductExpenses.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Money spent running your business</span>
              <span className="text-sm font-semibold text-critical">₦{totalOperational.toLocaleString()}</span>
            </div>
            <div className="h-px bg-border my-1" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Total Cost</span>
              <span className="text-2xl font-bold text-foreground">₦{Math.round(totalCost).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default CostBreakdownPage;
