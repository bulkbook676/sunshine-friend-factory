import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Package, Truck, Handshake, Search } from "lucide-react";
import { useDistributor } from "@/contexts/DistributorContext";
import DistributorBottomNav from "@/components/DistributorBottomNav";

type DFilter = "all" | "healthy" | "low" | "dead" | "restock";

const DistributorInventoryPage = () => {
  const navigate = useNavigate();
  const { products } = useDistributor();
  const [filter, setFilter] = useState<DFilter>("all");
  const [query, setQuery] = useState("");

  const enriched = useMemo(
    () =>
      products.map((p) => {
        const opening = p.openingStock && p.openingStock > 0 ? p.openingStock : Math.max(p.currentStock, 1);
        const ratio = p.currentStock / opening;
        let status: "healthy" | "low" | "critical" | "dead" = "healthy";
        if (p.currentStock === 0) status = "dead";
        else if (ratio <= 0.2) status = "critical";
        else if (ratio <= 0.5) status = "low";
        return { ...p, ratio, status };
      }),
    [products],
  );

  const filtered = useMemo(() => {
    let list = enriched.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    if (filter === "healthy") list = list.filter((p) => p.status === "healthy");
    else if (filter === "low") list = list.filter((p) => p.status === "low" || p.status === "critical");
    else if (filter === "dead") list = list.filter((p) => p.status === "dead");
    else if (filter === "restock") list = list.filter((p) => p.ratio <= 0.5 && p.currentStock >= 0);
    return list;
  }, [enriched, filter, query]);

  const filters: { key: DFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "healthy", label: "Healthy" },
    { key: "low", label: "Low Stock" },
    { key: "dead", label: "Dead Stock" },
    { key: "restock", label: "Restock" },
  ];

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-5">
        <h1 className="text-2xl font-bold text-foreground mb-6">Inventory</h1>

        <div className="relative mb-4">
          <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-3 mb-6">
          {filtered.length === 0 ? (
            <div className="bg-card rounded-lg p-6 border border-border text-center">
              <p className="text-sm text-muted-foreground">No products found</p>
            </div>
          ) : (
            filtered.map((p) => (
              <div key={p.id} className="bg-card rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => navigate(`/distributor/inventory/${p.id}`)}
                  className="w-full p-4 text-left active:opacity-80"
                >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">
                        Stock: <span className="text-foreground font-medium">{p.currentStock.toLocaleString()}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Price: <span className="text-foreground font-medium">₦{p.sellingPrice.toLocaleString()}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.freeShippingThreshold && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success font-medium">
                          <Truck className="w-2.5 h-2.5" />
                          Free ship ₦{p.freeShippingThreshold.toLocaleString()}+
                        </span>
                      )}
                      {p.goodwillEnabled && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-medium">
                          <Handshake className="w-2.5 h-2.5" />
                          Goodwill {p.goodwillRepaymentDays}d
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                </button>
                {filter === "restock" && (
                  <div className="px-4 pb-3 flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/distributor/restock/${p.id}`); }}
                      className="px-3 py-1.5 rounded-md border border-primary text-primary text-xs font-semibold active:opacity-80"
                    >
                      Restock
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <button
          onClick={() => navigate("/distributor/inventory/add")}
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg active:opacity-90 z-10"
          style={{ right: "max(1rem, calc(50% - 215px + 1rem))" }}
        >
          <Plus className="w-6 h-6 text-primary-foreground" />
        </button>
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorInventoryPage;
