import { Package, Check, ArrowLeft } from "lucide-react";
import { products, computeStockStatus } from "@/data/mockData";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

const RestockPage = () => {
  const navigate = useNavigate();
  const restockItems = useMemo(
    () =>
      products
        .map((p) => ({ ...p, status: computeStockStatus(p) }))
        .filter((p) => p.status === "low" || p.status === "critical"),
    [],
  );

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-lg font-bold text-foreground mb-4">Restock Alerts</h1>

        {restockItems.length === 0 ? (
          <div className="text-center py-12">
            <Check className="w-10 h-10 text-success mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">All stocked up! No restocking needed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {restockItems.map((p) => {
              const avgDaily = Math.round(p.salesHistory.reduce((a, b) => a + b, 0) / 7);
              const suggestedRestock = avgDaily * 7;
              return (
                <div key={p.id} className="bg-card rounded-2xl p-4 border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.status === "critical" ? "bg-critical/10" : "bg-warning/10"}`}>
                      <Package className={`w-5 h-5 ${p.status === "critical" ? "text-critical" : "text-warning"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Current: {p.currentStock} {p.sellingUnit}s</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.status === "critical" ? "bg-critical/15 text-critical" : "bg-warning/15 text-warning"}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Suggested: <strong className="text-foreground">{suggestedRestock} {p.sellingUnit}s</strong>
                    </p>
                    <button
                      onClick={() => navigate(`/owner/restock/${p.id}`)}
                      className="px-3 py-1.5 rounded-md border border-primary text-primary text-xs font-semibold active:opacity-80"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default RestockPage;
