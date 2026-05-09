import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, TrendingUp } from "lucide-react";
import { products } from "@/data/mockData";
import OwnerBottomNav from "@/components/OwnerBottomNav";

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Editable state
  const [editing, setEditing] = useState(false);
  const [sellingPrice, setSellingPrice] = useState(product?.sellingPrice ?? 0);
  const [costPrice, setCostPrice] = useState(product?.costPrice ?? 0);

  if (!product) {
    return (
      <div className="app-shell dark bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  const maxSale = Math.max(...product.salesHistory);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const totalUnitsSold = product.salesHistory.reduce((s, v) => s + v, 0);
  // Current Revenue is historical — locked to original selling price at time of sale
  const currentRevenue = totalUnitsSold * product.sellingPrice;
  // Total Revenue is a projection — uses current (possibly edited) selling price × remaining stock
  const totalRevenue = product.currentStock * sellingPrice;

  const handleSaveEdit = () => {
    setEditing(false);
    setLastUpdated(new Date().toLocaleString());
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          {editing ? (
            <button onClick={handleSaveEdit} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
              Save
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Edit className="w-4 h-4 text-foreground" />
            </button>
          )}
        </div>

        <h1 className="text-xl font-bold text-foreground mb-1">{product.name}</h1>
        <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
        {lastUpdated && (
          <p className="text-[10px] text-muted-foreground mb-4">Last updated: {lastUpdated}</p>
        )}
        {!lastUpdated && <div className="mb-6" />}

        {/* Stock Level */}
        <div className="bg-card rounded-2xl p-5 border border-border mb-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Current Stock</p>
          <p className="text-5xl font-bold text-foreground">{product.currentStock}</p>
          <p className="text-sm text-muted-foreground mt-1">{product.sellingUnit}s</p>
        </div>

        {/* Units & Pricing */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">How you buy it</p>
            <p className="text-sm font-semibold text-foreground">{product.buyingUnit}</p>
            {editing ? (
              <div className="mt-1 relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₦</span>
                <input
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full h-8 pl-6 pr-2 rounded border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">₦{costPrice.toLocaleString()}</p>
            )}
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">How you sell it</p>
            <p className="text-sm font-semibold text-foreground">{product.sellingUnit}</p>
            {editing ? (
              <div className="mt-1 relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₦</span>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full h-8 pl-6 pr-2 rounded border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">₦{sellingPrice.toLocaleString()}</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border mb-4">
          <p className="text-xs text-muted-foreground">1 {product.buyingUnit} = {product.unitsPerBuyingUnit} {product.sellingUnit}s</p>
        </div>

        {/* Revenue — two cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-success/5 border border-success/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Current Revenue</span>
            </div>
            <p className="text-xl font-bold text-success">₦{currentRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-1">From sales recorded</p>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-xl font-bold text-primary">₦{totalRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-1">If fully sold</p>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Sales — Last 7 Days</h3>
          <div className="flex items-end justify-between gap-1 h-24">
            {product.salesHistory.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm bg-primary"
                  style={{ height: `${maxSale ? (v / maxSale) * 100 : 0}%`, minHeight: v > 0 ? 4 : 0 }}
                />
                <span className="text-[9px] text-muted-foreground">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Log */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Stock Movement</h3>
          <div className="space-y-2">
            {product.stockLog.map((log, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm text-foreground">{log.action} — {log.qty} units</p>
                  <p className="text-xs text-muted-foreground">by {log.by}</p>
                </div>
                <span className="text-xs text-muted-foreground">{log.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default ProductDetailPage;
