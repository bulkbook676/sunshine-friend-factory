import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { products } from "@/data/mockData";
import OwnerBottomNav from "@/components/OwnerBottomNav";

const RevenueBreakdownPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const periodIdx = parseInt(searchParams.get("period") || "0");

  const salesIndices = [6, 5, 4, 3, 2];
  const idx = salesIndices[periodIdx] ?? 6;

  const breakdown = products
    .map((p) => ({
      name: p.name,
      unitsSold: p.salesHistory[idx],
      revenue: p.salesHistory[idx] * p.sellingPrice,
    }))
    .filter((p) => p.unitsSold > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = breakdown.reduce((s, p) => s + p.revenue, 0);

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-xl font-bold text-foreground mb-1">Revenue Breakdown</h1>
        <p className="text-sm text-muted-foreground mb-6">Income generated per product</p>

        <div className="space-y-3 mb-6">
          {breakdown.map((p, i) => (
            <div key={i} className="bg-card rounded-2xl p-4 border border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.unitsSold} units sold</p>
              </div>
              <p className="text-sm font-bold text-success">₦{p.revenue.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="bg-primary/10 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Total Revenue</span>
            <span className="text-2xl font-bold text-success">₦{totalRevenue.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default RevenueBreakdownPage;
