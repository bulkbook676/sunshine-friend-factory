import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { products as productStore } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

const baseUnitTypes = ["Carton", "Bag", "Roll", "Piece", "Kg", "Litre", "Yard"];

interface RestockDraft {
  buyingUnit: string;
  sellingUnit: string;
  buyingUnitsOrdered: string;
  sellingUnitsPerBuying: string;
  totalOrderAmount: string;
  transportFee: string;
  actualSellingPrice: string;
  applyPriceToCurrent: boolean;
}

type TextFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  prefix?: string;
  inputMode?: "text" | "numeric" | "decimal";
  error?: string;
  readOnly?: boolean;
};

const TextField = ({ label, placeholder, value, onChange, type = "text", prefix, inputMode, error, readOnly }: TextFieldProps) => (
  <div>
    <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
    <div className="relative">
      {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>}
      <input
        type={type}
        inputMode={inputMode ?? (type === "number" ? "decimal" : "text")}
        placeholder={placeholder}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-12 ${prefix ? "pl-8" : "px-4"} pr-4 rounded-lg border ${error ? "border-critical" : "border-input"} ${readOnly ? "bg-muted/50 text-muted-foreground cursor-not-allowed" : "bg-card text-foreground"} placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary`}
      />
    </div>
    {error && <p className="text-[11px] text-critical mt-1">{error}</p>}
  </div>
);

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  onAddCustom?: () => void;
  error?: string;
};

const SelectField = ({ label, value, onChange, options, onAddCustom, error }: SelectFieldProps) => (
  <div>
    <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === "__add__" && onAddCustom) {
            onAddCustom();
            return;
          }
          onChange(e.target.value);
        }}
        className={`w-full h-12 px-4 rounded-lg border ${error ? "border-critical" : "border-input"} bg-card text-foreground text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary`}
      >
        <option value="">Select</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
        {onAddCustom && <option value="__add__">+ Add custom…</option>}
      </select>
      <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
    {error && <p className="text-[11px] text-critical mt-1">{error}</p>}
  </div>
);

const ReadOnlyField = ({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) => (
  <div>
    <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
    <div className={`w-full h-12 px-4 rounded-lg border border-input bg-muted/50 flex items-center text-sm font-semibold ${color}`}>
      {value}
    </div>
  </div>
);

const RestockProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const product = productStore.find((p) => p.id === id);

  const [customUnits, setCustomUnits] = useState<string[]>([]);
  const allUnits = useMemo(() => {
    const arr = [...baseUnitTypes, ...customUnits];
    if (product) {
      if (!arr.includes(product.buyingUnit)) arr.push(product.buyingUnit);
      if (!arr.includes(product.sellingUnit)) arr.push(product.sellingUnit);
    }
    return arr;
  }, [customUnits, product]);

  const [form, setForm] = useState<RestockDraft>(() => ({
    buyingUnit: product?.buyingUnit ?? "",
    sellingUnit: product?.sellingUnit ?? "",
    buyingUnitsOrdered: "",
    sellingUnitsPerBuying: product ? String(product.unitsPerBuyingUnit) : "",
    totalOrderAmount: "",
    transportFee: "",
    actualSellingPrice: product ? String(product.sellingPrice) : "",
    applyPriceToCurrent: false,
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (k: keyof RestockDraft, v: string | boolean) => {
    setForm((p) => ({ ...p, [k]: v } as RestockDraft));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const promptAddCustomUnit = (target: "buyingUnit" | "sellingUnit") => {
    const name = window.prompt("Enter custom unit name (e.g. Sachet)")?.trim();
    if (!name) return;
    if (!allUnits.includes(name)) setCustomUnits((prev) => [...prev, name]);
    update(target, name);
  };

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString()}`;

  const calc = useMemo(() => {
    const units = parseFloat(form.sellingUnitsPerBuying) || 0;
    const totalOrder = parseFloat(form.totalOrderAmount) || 0;
    const qtyOrdered = parseFloat(form.buyingUnitsOrdered) || 0;
    const transport = parseFloat(form.transportFee) || 0;
    const asp = parseFloat(form.actualSellingPrice) || 0;

    const cogPerBuying = qtyOrdered > 0 ? totalOrder / qtyOrdered : 0;
    const expPerBuying = qtyOrdered > 0 ? transport / qtyOrdered : 0;
    const totalCostPerBuying = cogPerBuying + expPerBuying;
    const costPerSelling = units > 0 ? totalCostPerBuying / units : 0;
    const minViablePrice = costPerSelling * 1.1;
    const idealPrice = costPerSelling * 1.3;
    const marginPerUnit = asp - costPerSelling;
    const marginPct = costPerSelling > 0 ? ((asp - costPerSelling) / costPerSelling) * 100 : 0;
    const addingStock = qtyOrdered * units;

    let verdictLabel = "";
    let verdictColor = "";
    if (asp > 0 && costPerSelling > 0) {
      if (marginPerUnit < 0) { verdictLabel = "Selling at a loss"; verdictColor = "text-critical"; }
      else if (marginPct < 15) { verdictLabel = "Low margin"; verdictColor = "text-warning"; }
      else { verdictLabel = "Healthy margin"; verdictColor = "text-success"; }
    }

    return {
      cogPerBuying, expPerBuying, totalCostPerBuying, costPerSelling,
      minViablePrice, idealPrice, marginPerUnit, marginPct,
      verdictLabel, verdictColor, addingStock,
    };
  }, [form]);

  if (!product) {
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

  const onShelf = product.currentStock;
  const buyingUnitLabel = form.buyingUnit || "units";
  const sellingUnitLabel = form.sellingUnit || "units";
  const newTotal = onShelf + Math.round(calc.addingStock);
  const oldActual = product.sellingPrice;
  const newActual = parseFloat(form.actualSellingPrice) || oldActual;
  const oldIdeal = product.costPrice
    ? (product.costPrice / Math.max(product.unitsPerBuyingUnit, 1)) * 1.3
    : product.sellingPrice * 1.1;
  const newIdeal = calc.idealPrice > 0 ? calc.idealPrice : oldIdeal;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.buyingUnit) e.buyingUnit = "Required";
    if (!form.sellingUnit) e.sellingUnit = "Required";
    if (!form.buyingUnitsOrdered || parseFloat(form.buyingUnitsOrdered) <= 0) e.buyingUnitsOrdered = "Required";
    if (!form.sellingUnitsPerBuying || parseFloat(form.sellingUnitsPerBuying) <= 0) e.sellingUnitsPerBuying = "Required";
    if (!form.totalOrderAmount || parseFloat(form.totalOrderAmount) <= 0) e.totalOrderAmount = "Required";
    if (!form.actualSellingPrice || parseFloat(form.actualSellingPrice) <= 0) e.actualSellingPrice = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) {
      toast({ title: "Please fix the errors", description: "Some required fields are missing.", variant: "destructive" });
      return;
    }
    const addingQty = Math.round(calc.addingStock);
    product.currentStock = onShelf + addingQty;
    product.openingStock = (product.openingStock ?? onShelf) + addingQty;
    product.buyingUnit = form.buyingUnit;
    product.sellingUnit = form.sellingUnit;
    product.unitsPerBuyingUnit = parseFloat(form.sellingUnitsPerBuying) || product.unitsPerBuyingUnit;
    product.costPrice = Math.round(calc.totalCostPerBuying);
    if (form.applyPriceToCurrent) product.sellingPrice = newActual;
    product.stockLog.unshift({
      date: "Just now",
      action: "Restocked",
      qty: addingQty,
      by: "Owner",
    });
    toast({ title: "Restocked", description: `${addingQty} ${product.sellingUnit}s added` });
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
          <h1 className="text-base font-bold text-foreground truncate max-w-[60%] text-center">
            Restock — {product.name}
          </h1>
          <div className="w-12" />
        </div>

        <div className="space-y-4">
          {/* Product Info */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Info</p>
          <TextField
            label="Product Name"
            placeholder=""
            value={product.name}
            onChange={() => {}}
            readOnly
          />

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Buying Unit"
              value={form.buyingUnit}
              onChange={(v) => update("buyingUnit", v)}
              options={allUnits}
              onAddCustom={() => promptAddCustomUnit("buyingUnit")}
              error={errors.buyingUnit}
            />
            <SelectField
              label="Selling Unit"
              value={form.sellingUnit}
              onChange={(v) => update("sellingUnit", v)}
              options={allUnits}
              onAddCustom={() => promptAddCustomUnit("sellingUnit")}
              error={errors.sellingUnit}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={`How many ${buyingUnitLabel.toLowerCase()}${form.buyingUnit ? "s" : ""} did you order?`}
              placeholder="e.g. 10"
              value={form.buyingUnitsOrdered}
              onChange={(v) => update("buyingUnitsOrdered", v)}
              type="number"
              error={errors.buyingUnitsOrdered}
            />
            <TextField
              label={`How many ${sellingUnitLabel.toLowerCase()}${form.sellingUnit ? "s" : ""} in one ${buyingUnitLabel.toLowerCase()}?`}
              placeholder="e.g. 40"
              value={form.sellingUnitsPerBuying}
              onChange={(v) => update("sellingUnitsPerBuying", v)}
              type="number"
              error={errors.sellingUnitsPerBuying}
            />
          </div>

          {/* Order Details */}
          <div className="border-t border-border pt-4 mt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Order Details</p>
          </div>

          <TextField label="Total amount paid for this order" placeholder="e.g. 50,000" value={form.totalOrderAmount} onChange={(v) => update("totalOrderAmount", v)} type="number" prefix="₦" error={errors.totalOrderAmount} />
          <TextField label="Total transport and handling for this order" placeholder="e.g. 2,000" value={form.transportFee} onChange={(v) => update("transportFee", v)} type="number" prefix="₦" />

          {/* Cost Calculator */}
          <div className="border-t border-border pt-4 mt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Cost Calculator</p>
          </div>
          <ReadOnlyField label="Cost of Goods per Buying Unit" value={calc.cogPerBuying > 0 ? fmt(calc.cogPerBuying) : "—"} color="text-primary" />
          <ReadOnlyField label="Expenses per Buying Unit" value={calc.expPerBuying > 0 ? fmt(calc.expPerBuying) : "—"} color="text-primary" />
          <ReadOnlyField label="Total Cost per Buying Unit" value={calc.totalCostPerBuying > 0 ? fmt(calc.totalCostPerBuying) : "—"} />
          <ReadOnlyField label="Cost per Selling Unit" value={calc.costPerSelling > 0 ? fmt(calc.costPerSelling) : "—"} />

          {/* Pricing */}
          <div className="border-t border-border pt-4 mt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Pricing</p>
          </div>

          <ReadOnlyField label="Minimum Viable Price (10% margin)" value={calc.minViablePrice > 0 ? fmt(calc.minViablePrice) : "—"} color="text-warning" />
          <ReadOnlyField label="Ideal Selling Price (30% margin)" value={calc.idealPrice > 0 ? fmt(calc.idealPrice) : "—"} color="text-success" />

          <TextField label="Actual Selling Price" placeholder="Your price per selling unit" value={form.actualSellingPrice} onChange={(v) => update("actualSellingPrice", v)} type="number" prefix="₦" error={errors.actualSellingPrice} />

          {calc.verdictLabel && (
            <div className={`rounded-lg p-4 border ${calc.verdictColor === "text-success" ? "bg-success/5 border-success/20" : calc.verdictColor === "text-warning" ? "bg-warning/5 border-warning/20" : "bg-critical/5 border-critical/20"}`}>
              <div className="flex items-center gap-2 mb-2">
                {calc.marginPerUnit >= 0 ? <TrendingUp className={`w-4 h-4 ${calc.verdictColor}`} /> : <TrendingDown className="w-4 h-4 text-critical" />}
                <span className={`text-sm font-semibold ${calc.verdictColor}`}>{calc.verdictLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Margin per unit</span>
                <span className={`text-sm font-semibold ${calc.verdictColor}`}>{fmt(calc.marginPerUnit)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-sm text-muted-foreground">Margin percentage</span>
                <span className={`text-sm font-semibold ${calc.verdictColor}`}>{Math.round(calc.marginPct)}%</span>
              </div>
            </div>
          )}

          {/* Stock */}
          <div className="border-t border-border pt-4 mt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Stock</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Stock On Shelf</p>
              <p className="text-2xl font-bold text-foreground">{onShelf.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{product.sellingUnit}{onShelf !== 1 ? "s" : ""}</p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Adding to Stock</p>
              <p className="text-2xl font-bold text-primary">{Math.round(calc.addingStock).toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{sellingUnitLabel}{calc.addingStock !== 1 ? "s" : ""}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            New total after restock:{" "}
            <span className="text-foreground font-semibold">
              {newTotal.toLocaleString()} {product.sellingUnit}{newTotal !== 1 ? "s" : ""}
            </span>
          </p>

          {/* Apply price toggle */}
          <div className="bg-card border border-border rounded-lg p-4 flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Apply new price to current inventory</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Turn on to update price for existing stock</p>
            </div>
            <button
              type="button"
              onClick={() => update("applyPriceToCurrent", !form.applyPriceToCurrent)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.applyPriceToCurrent ? "bg-primary" : "bg-muted"}`}
              aria-pressed={form.applyPriceToCurrent}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background transition-transform ${form.applyPriceToCurrent ? "translate-x-5" : ""}`} />
            </button>
          </div>

          {/* Projected revenue — split when toggle OFF, unified when ON */}
          {(onShelf > 0 || calc.addingStock > 0) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">Projected Revenue at Ideal Price</p>
                {form.applyPriceToCurrent ? (
                  <>
                    <p className="text-lg font-bold text-success">{fmt(newTotal * newIdeal)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">If sold at ideal price (30% margin)</p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] text-foreground leading-snug">
                      Current stock: {onShelf} × {fmt(oldIdeal)} = {fmt(onShelf * oldIdeal)}
                    </p>
                    <p className="text-[11px] text-foreground leading-snug mt-1">
                      New stock: {Math.round(calc.addingStock)} × {fmt(newIdeal)} = {fmt(calc.addingStock * newIdeal)}
                    </p>
                    <p className="text-lg font-bold text-success mt-2">
                      {fmt(onShelf * oldIdeal + calc.addingStock * newIdeal)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Prices split — current at old, new at new</p>
                  </>
                )}
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">Projected Revenue at Your Price</p>
                {form.applyPriceToCurrent ? (
                  <>
                    <p className="text-lg font-bold text-primary">{fmt(newTotal * newActual)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">If sold at your price</p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] text-foreground leading-snug">
                      Current stock: {onShelf} × {fmt(oldActual)} = {fmt(onShelf * oldActual)}
                    </p>
                    <p className="text-[11px] text-foreground leading-snug mt-1">
                      New stock: {Math.round(calc.addingStock)} × {fmt(newActual)} = {fmt(calc.addingStock * newActual)}
                    </p>
                    <p className="text-lg font-bold text-primary mt-2">
                      {fmt(onShelf * oldActual + calc.addingStock * newActual)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Prices split — current at old, new at new</p>
                  </>
                )}
              </div>
            </div>
          )}

          <button
            onClick={submit}
            className="w-full h-12 mt-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm"
          >
            Save Restock
          </button>
        </div>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default RestockProductPage;
