import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, TrendingUp, TrendingDown } from "lucide-react";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { products as productStore } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

/**
 * Restock form for a specific product.
 * Shows live "Stock On Shelf" (read-only) + "Adding to Stock" (input),
 * plus split projected revenue when the new-price toggle is OFF.
 */
const RestockProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const product = productStore.find((p) => p.id === id);

  const [adding, setAdding] = useState("");
  const [totalOrderAmount, setTotalOrderAmount] = useState("");
  const [transportFee, setTransportFee] = useState("");
  const [newSellingPrice, setNewSellingPrice] = useState(
    product ? String(product.sellingPrice) : "",
  );
  const [applyPriceToCurrent, setApplyPriceToCurrent] = useState(false);

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString()}`;

  const calc = useMemo(() => {
    if (!product) return null;
    const addingNum = parseFloat(adding) || 0;
    const totalOrder = parseFloat(totalOrderAmount) || 0;
    const transport = parseFloat(transportFee) || 0;
    const onShelf = product.currentStock;
    const newTotal = onShelf + addingNum;
    const oldIdeal = product.costPrice
      ? (product.costPrice / Math.max(product.unitsPerBuyingUnit, 1)) * 1.3
      : product.sellingPrice * 1.1;
    const newCostPerSelling =
      addingNum > 0 && product.unitsPerBuyingUnit > 0
        ? (totalOrder + transport) / addingNum
        : 0;
    const newIdeal = newCostPerSelling > 0 ? newCostPerSelling * 1.3 : oldIdeal;
    const oldActual = product.sellingPrice;
    const newActual = parseFloat(newSellingPrice) || oldActual;
    const margin = newCostPerSelling > 0 ? newActual - newCostPerSelling : 0;
    const marginPct = newCostPerSelling > 0 ? (margin / newCostPerSelling) * 100 : 0;

    return {
      addingNum, onShelf, newTotal,
      oldIdeal, newIdeal, oldActual, newActual,
      newCostPerSelling, margin, marginPct,
    };
  }, [product, adding, totalOrderAmount, transportFee, newSellingPrice]);

  if (!product || !calc) {
    return (
      <div className="app-shell dark bg-background">
        <div className="page-content px-4 pt-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <p className="text-sm text-muted-foreground">Product not found.</p>
        </div>
        <OwnerBottomNav />
      </div>
    );
  }

  const submit = () => {
    if (calc.addingNum <= 0) {
      toast({ title: "Enter quantity to add", variant: "destructive" });
      return;
    }
    product.currentStock = calc.newTotal;
    product.openingStock = calc.newTotal;
    if (applyPriceToCurrent) product.sellingPrice = calc.newActual;
    product.stockLog.unshift({
      date: "Just now",
      action: "Restocked",
      qty: calc.addingNum,
      by: "Owner",
    });
    toast({ title: "Restocked", description: `${calc.addingNum} ${product.sellingUnit}s added` });
    navigate("/owner/inventory");
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-base font-bold text-foreground">Restock</h1>
          <div className="w-12" />
        </div>

        {/* Product summary */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.category}</p>
          </div>
        </div>

        {/* STOCK */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Stock</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Stock On Shelf</p>
            <p className="text-2xl font-bold text-foreground">{calc.onShelf.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{product.sellingUnit}{calc.onShelf !== 1 ? "s" : ""}</p>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Adding to Stock</p>
            <input
              type="number"
              inputMode="numeric"
              value={adding}
              onChange={(e) => setAdding(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent text-2xl font-bold text-primary placeholder:text-primary/40 focus:outline-none p-0"
            />
            <p className="text-[11px] text-muted-foreground mt-1">{product.sellingUnit}s</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          New total after restock:{" "}
          <span className="text-foreground font-semibold">
            {calc.newTotal.toLocaleString()} {product.sellingUnit}{calc.newTotal !== 1 ? "s" : ""}
          </span>
        </p>

        {/* Order details (optional, mirrors Add Product flow) */}
        <div className="border-t border-border pt-4 mt-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Order Details</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Total amount paid for this restock</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="e.g. 50,000"
                value={totalOrderAmount}
                onChange={(e) => setTotalOrderAmount(e.target.value)}
                className="w-full h-12 pl-8 pr-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Transport and handling</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="e.g. 2,000"
                value={transportFee}
                onChange={(e) => setTransportFee(e.target.value)}
                className="w-full h-12 pl-8 pr-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="border-t border-border pt-4 mt-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Pricing</p>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">New Selling Price</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Selling price per unit"
              value={newSellingPrice}
              onChange={(e) => setNewSellingPrice(e.target.value)}
              className="w-full h-12 pl-8 pr-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {calc.newCostPerSelling > 0 && (
          <div className={`mt-3 rounded-lg p-4 border ${calc.marginPct >= 15 ? "bg-success/5 border-success/20" : calc.marginPct >= 0 ? "bg-warning/5 border-warning/20" : "bg-critical/5 border-critical/20"}`}>
            <div className="flex items-center gap-2 mb-2">
              {calc.margin >= 0 ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-critical" />}
              <span className="text-sm font-semibold text-foreground">
                {calc.marginPct >= 15 ? "Healthy margin" : calc.marginPct >= 0 ? "Low margin" : "Selling at a loss"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Margin per unit</span>
              <span className="font-semibold text-foreground">{fmt(calc.margin)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Margin percentage</span>
              <span className="font-semibold text-foreground">{Math.round(calc.marginPct)}%</span>
            </div>
          </div>
        )}

        {/* Apply price toggle */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-start justify-between gap-3 mt-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Apply new price to current inventory</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Turn on to update price for existing stock</p>
          </div>
          <button
            type="button"
            onClick={() => setApplyPriceToCurrent((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${applyPriceToCurrent ? "bg-primary" : "bg-muted"}`}
            aria-pressed={applyPriceToCurrent}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background transition-transform ${applyPriceToCurrent ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {/* Projected revenue — split when toggle OFF */}
        {(calc.onShelf > 0 || calc.addingNum > 0) && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Ideal */}
            <div className="bg-success/5 border border-success/20 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2">Projected Revenue at Ideal Price</p>
              {applyPriceToCurrent ? (
                <>
                  <p className="text-lg font-bold text-success">{fmt(calc.newTotal * calc.newIdeal)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">If sold at ideal price (30% margin)</p>
                </>
              ) : (
                <>
                  <p className="text-[11px] text-foreground leading-snug">
                    Current stock: {calc.onShelf} × {fmt(calc.oldIdeal)} = {fmt(calc.onShelf * calc.oldIdeal)}
                  </p>
                  <p className="text-[11px] text-foreground leading-snug mt-1">
                    New stock: {calc.addingNum} × {fmt(calc.newIdeal)} = {fmt(calc.addingNum * calc.newIdeal)}
                  </p>
                  <p className="text-lg font-bold text-success mt-2">
                    {fmt(calc.onShelf * calc.oldIdeal + calc.addingNum * calc.newIdeal)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Prices split — current stock at old price, new stock at new price</p>
                </>
              )}
            </div>

            {/* Your Price */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2">Projected Revenue at Your Price</p>
              {applyPriceToCurrent ? (
                <>
                  <p className="text-lg font-bold text-primary">{fmt(calc.newTotal * calc.newActual)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">If sold at your price</p>
                </>
              ) : (
                <>
                  <p className="text-[11px] text-foreground leading-snug">
                    Current stock: {calc.onShelf} × {fmt(calc.oldActual)} = {fmt(calc.onShelf * calc.oldActual)}
                  </p>
                  <p className="text-[11px] text-foreground leading-snug mt-1">
                    New stock: {calc.addingNum} × {fmt(calc.newActual)} = {fmt(calc.addingNum * calc.newActual)}
                  </p>
                  <p className="text-lg font-bold text-primary mt-2">
                    {fmt(calc.onShelf * calc.oldActual + calc.addingNum * calc.newActual)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Prices split — current stock at old price, new stock at new price</p>
                </>
              )}
            </div>
          </div>
        )}

        <button
          onClick={submit}
          className="w-full h-12 mt-6 rounded-lg bg-primary text-primary-foreground font-semibold text-sm"
        >
          Confirm Restock
        </button>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default RestockProductPage;