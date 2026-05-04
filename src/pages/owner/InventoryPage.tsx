import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Package, TrendingUp } from "lucide-react";
import { products, computeStockStatus, STOCK_LOW_PCT, type Product } from "@/data/mockData";
import OwnerBottomNav from "@/components/OwnerBottomNav";

const statusColors: Record<string, string> = {
  healthy: "bg-success/15 text-success",
  low: "bg-warning/15 text-warning",
  critical: "bg-critical/15 text-critical",
  dead: "bg-muted text-muted-foreground",
};

type FilterType = "all" | "healthy" | "low" | "dead" | "restock" | "top-selling" | "trending";

const InventoryPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  // Always derive status from the canonical helper so badges stay in sync
  // with stock changes anywhere in the app.
  const productsWithStatus = useMemo(
    () => products.map((p) => ({ ...p, status: computeStockStatus(p) as Product["status"] })),
    [],
  );

  const filtered = useMemo(() => {
    let list = productsWithStatus.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

    if (filter === "low") {
      list = list.filter((p) => p.status === "low" || p.status === "critical");
    } else if (filter === "restock") {
      // At or below 50% of opening stock — both low and critical states.
      list = list.filter((p) => {
        const opening = p.openingStock && p.openingStock > 0 ? p.openingStock : p.currentStock;
        return opening > 0 && p.currentStock / opening <= STOCK_LOW_PCT;
      });
    } else if (filter === "healthy" || filter === "dead") {
      list = list.filter((p) => p.status === filter);
    } else if (filter === "top-selling") {
      list = [...list].sort((a, b) => {
        const aSold = a.salesHistory.reduce((s, v) => s + v, 0);
        const bSold = b.salesHistory.reduce((s, v) => s + v, 0);
        return bSold - aSold;
      });
    } else if (filter === "trending") {
      list = list
        .map((p) => {
          const recent = p.salesHistory.slice(-3).reduce((s, v) => s + v, 0);
          const prev = p.salesHistory.slice(0, 4).reduce((s, v) => s + v, 0);
          const pctChange = prev > 0 ? Math.round(((recent - prev) / prev) * 100) : recent > 0 ? 100 : 0;
          return { ...p, pctChange };
        })
        .filter((p) => p.pctChange > 0)
        .sort((a, b) => b.pctChange - a.pctChange);
    }

    return list;
  }, [query, filter, productsWithStatus]);

  const getTotalUnitsSold = (p: typeof products[0]) =>
    p.salesHistory.reduce((s, v) => s + v, 0);

  const getTrendPct = (p: typeof products[0]) => {
    const recent = p.salesHistory.slice(-3).reduce((s, v) => s + v, 0);
    const prev = p.salesHistory.slice(0, 4).reduce((s, v) => s + v, 0);
    return prev > 0 ? Math.round(((recent - prev) / prev) * 100) : recent > 0 ? 100 : 0;
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "healthy", label: "Healthy" },
    { key: "low", label: "Low Stock" },
    { key: "dead", label: "Dead Stock" },
    { key: "restock", label: "Restock" },
    { key: "top-selling", label: "Top Selling" },
    { key: "trending", label: "Trending" },
  ];

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-5">
        <h1 className="text-lg font-bold text-foreground mb-4">Inventory</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filters */}
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

        {/* Products */}
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="bg-card rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => navigate(`/owner/product/${p.id}`)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                </div>
                <div className="text-right shrink-0">
                  {filter === "top-selling" ? (
                    <>
                      <p className="text-sm font-bold text-foreground">{getTotalUnitsSold(p)} sold</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-primary/15 text-primary">
                        Top Seller
                      </span>
                    </>
                  ) : filter === "trending" ? (
                    <>
                      <div className="flex items-center gap-1 justify-end">
                        <TrendingUp className="w-3 h-3 text-success" />
                        <p className="text-sm font-bold text-success">+{getTrendPct(p)}%</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">this week</span>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-foreground">{p.currentStock}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[p.status]}`}>
                        {p.status}
                      </span>
                    </>
                  )}
                </div>
              </button>
              {filter === "restock" && (
                <div className="px-4 pb-3 flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/owner/restock/${p.id}`); }}
                    className="px-3 py-1.5 rounded-md border border-primary text-primary text-xs font-semibold active:opacity-80"
                  >
                    Restock
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No products found</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate("/owner/product/add")}
        className="absolute bottom-24 right-5 z-20 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
      >
        <Plus className="w-6 h-6" />
      </button>

      <OwnerBottomNav />
    </div>
  );
};

export default InventoryPage;
