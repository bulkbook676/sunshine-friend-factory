import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Plus, Check, Camera } from "lucide-react";
import { useDistributor, GoodwillConditions } from "@/contexts/DistributorContext";
import ProductCameraFlow, { type CapturedProduct } from "@/components/ProductCameraFlow";
import { toast } from "sonner";

const BASE_CATEGORIES = ["Dairy", "Beverages", "Grains", "Provisions", "Cosmetics", "Electronics", "Building Materials"];
const PAYMENT_OPTS = ["Cash", "Bank Transfer", "Online Payment", "Goodwill"];

interface FormState {
  name: string;
  category: string;
  freeShippingThreshold: string;
  goodwillEnabled: boolean;
  goodwillConditions?: GoodwillConditions;
}

const STORAGE_KEY = "distributor-addproduct-draft";
const UNITS = ["Carton", "Bag", "Crate", "Sack", "Pack", "Bundle", "Tray", "Box"];

const DistributorAddProductPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { products, addProduct, updateProduct, customCategories, addCustomCategory } = useDistributor();
  const isEdit = !!id;
  const existing = isEdit ? products.find((p) => p.id === id) : undefined;

  const restoredDraft = (() => {
    if (isEdit) return null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [form, setForm] = useState<FormState>(
    restoredDraft ?? {
      name: existing?.name ?? "",
      category: existing?.category ?? "",
      freeShippingThreshold: existing?.freeShippingThreshold?.toString() ?? "",
      goodwillEnabled: existing?.goodwillEnabled ?? false,
      goodwillConditions:
        existing?.goodwillConditions ??
        (existing?.goodwillEnabled && existing?.goodwillRepaymentDays
          ? { repaymentDays: existing.goodwillRepaymentDays }
          : undefined),
    }
  );

  const [paymentMethods, setPaymentMethods] = useState<string[]>(
    restoredDraft?.paymentMethods ?? existing?.paymentMethods ?? ["Cash", "Bank Transfer"]
  );
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<{ id: string; dataUrl: string; label: string }[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState("");

  // Cost calculator helper state
  const [calc, setCalc] = useState({
    buyingUnit: "",
    sellingUnit: "Piece",
    buyingUnitsOrdered: "",
    sellingUnitsPerBuying: "",
    totalOrderAmount: "",
    transportFee: "",
    actualSellingPrice: existing?.sellingPrice?.toString() ?? "",
  });
  const updateCalc = (k: keyof typeof calc, v: string) => setCalc((p) => ({ ...p, [k]: v }));
  const fmt = (n: number) => `₦${Math.round(n).toLocaleString()}`;

  const calcResult = useMemo(() => {
    const orderQty = parseFloat(calc.buyingUnitsOrdered) || 0;
    const perBuying = parseFloat(calc.sellingUnitsPerBuying) || 0;
    const total = parseFloat(calc.totalOrderAmount) || 0;
    const transport = parseFloat(calc.transportFee) || 0;
    const asp = parseFloat(calc.actualSellingPrice) || 0;
    const cogPerBuying = orderQty > 0 ? total / orderQty : 0;
    const expPerBuying = orderQty > 0 ? transport / orderQty : 0;
    const totalCostPerBuying = cogPerBuying + expPerBuying;
    const costPerSelling = perBuying > 0 ? totalCostPerBuying / perBuying : 0;
    const minPrice = costPerSelling * 1.1;
    const idealPrice = costPerSelling * 1.3;
    const openingStock = orderQty * perBuying;
    const marginPerUnit = asp - costPerSelling;
    const marginPct = costPerSelling > 0 ? ((asp - costPerSelling) / costPerSelling) * 100 : 0;
    let verdictLabel = "";
    let verdictColor = "";
    if (asp > 0 && costPerSelling > 0) {
      if (marginPerUnit < 0) { verdictLabel = "You are losing money at this price"; verdictColor = "text-critical"; }
      else if (marginPct < 15) { verdictLabel = "Small profit — consider increasing price"; verdictColor = "text-warning"; }
      else { verdictLabel = "Good profit"; verdictColor = "text-success"; }
    }
    return { cogPerBuying, expPerBuying, totalCostPerBuying, costPerSelling, minPrice, idealPrice, openingStock, marginPerUnit, marginPct, verdictLabel, verdictColor };
  }, [calc]);

  const buyingLabel = (calc.buyingUnit || "buying unit").toLowerCase();

  // Receive goodwill result from sub-page
  useEffect(() => {
    const result = (location.state as any)?.goodwillResult;
    if (result) {
      setForm((p) => ({
        ...p,
        goodwillEnabled: result.enabled,
        goodwillConditions: result.conditions,
      }));
      // Clear so re-renders don't re-apply
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  // Persist draft so it survives navigation to goodwill page (only when adding new)
  useEffect(() => {
    if (isEdit) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...form, paymentMethods, calc }));
    } catch {
      // ignore
    }
  }, [form, paymentMethods, calc, isEdit]);

  const allCategories = [...BASE_CATEGORIES, ...customCategories];

  const update = (k: keyof FormState, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const togglePm = (m: string) =>
    setPaymentMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const submitNewCat = () => {
    const t = newCat.trim();
    if (!t) return;
    addCustomCategory(t);
    update("category", t);
    setNewCat("");
    setShowAddCat(false);
  };

  const openGoodwillPage = () => {
    navigate("/distributor/inventory/goodwill-conditions", {
      state: {
        initial: { enabled: form.goodwillEnabled, conditions: form.goodwillConditions },
        returnTo: isEdit ? `/distributor/inventory/edit/${id}` : "/distributor/inventory/add",
      },
    });
  };

  const handleSave = () => {
    const sellingPrice = parseFloat(calc.actualSellingPrice) || 0;
    if (!form.name || !form.category || !calcResult.costPerSelling || !sellingPrice || !calcResult.openingStock) {
      toast.error("Fill in product details and the cost calculator");
      return;
    }
    const payload = {
      name: form.name,
      category: form.category,
      costPrice: Math.round(calcResult.totalCostPerBuying),
      sellingPrice,
      currentStock: Math.round(calcResult.openingStock),
      freeShippingThreshold: form.freeShippingThreshold ? parseFloat(form.freeShippingThreshold) : undefined,
      goodwillEnabled: form.goodwillEnabled,
      goodwillRepaymentDays: form.goodwillEnabled ? form.goodwillConditions?.repaymentDays : undefined,
      goodwillConditions: form.goodwillEnabled ? form.goodwillConditions : undefined,
      paymentMethods,
    };

    if (isEdit && id) {
      updateProduct(id, payload);
      toast.success("Product updated");
      navigate(`/distributor/inventory/${id}`);
    } else {
      addProduct(payload);
      toast.success("Product added");
      sessionStorage.removeItem(STORAGE_KEY);
      navigate("/distributor/inventory");
    }
  };

  // Goodwill summary text
  const goodwillSummary = (() => {
    if (!form.goodwillEnabled) return "Not enabled";
    const c = form.goodwillConditions;
    if (!c) return "Enabled";
    const parts: string[] = [`${c.repaymentDays}d repayment`];
    if (c.minMonthsOnBulkbook != null) parts.push(`${c.minMonthsOnBulkbook}+ months`);
    if (c.minOrderValue != null) parts.push(`Min order value: ${c.minOrderValue.toLocaleString()}`);
    return `Enabled — ${parts.join(", ")}`;
  })();

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-5 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-6">{isEdit ? "Edit Product" : "Add Product"}</h1>

        <div className="space-y-4">
          {!isEdit && (
            <>
              {capturedPhotos.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setCameraOpen(true)}
                  className="w-full h-28 rounded-lg border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-2"
                >
                  <Camera className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Tap to capture product photos (optional)</span>
                </button>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Captured Products
                    </span>
                    <button
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      className="ml-auto text-xs text-primary font-medium"
                    >
                      + Add More
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {capturedPhotos.map((photo) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => {
                          setActivePhotoId(photo.id);
                          update("name", photo.label);
                        }}
                        className={`flex-shrink-0 w-20 flex flex-col items-center gap-1 ${
                          activePhotoId === photo.id ? "ring-2 ring-primary rounded-lg" : ""
                        }`}
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                          <img src={photo.dataUrl} alt={photo.label} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] text-muted-foreground text-center truncate w-full">
                          {photo.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <ProductCameraFlow
            open={cameraOpen}
            onClose={() => setCameraOpen(false)}
            onSavedCapture={({ dataUrl, name }: CapturedProduct) => {
              const newPhoto = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                dataUrl,
                label: name,
              };
              setCapturedPhotos((prev) => [...prev, newPhoto]);
              setActivePhotoId(newPhoto.id);
              setForm((p) => ({ ...p, name }));
            }}
            onContinue={() => {
              setCameraOpen(false);
            }}
          />

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Product Name</label>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Peak Milk (Tin)"
              className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Category</label>
            <div className="flex flex-wrap gap-2 items-center">
              {allCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => update("category", c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    form.category === c
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border"
                  }`}
                >
                  {c}
                </button>
              ))}
              {showAddCat ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitNewCat();
                      if (e.key === "Escape") {
                        setShowAddCat(false);
                        setNewCat("");
                      }
                    }}
                    placeholder="Category"
                    className="h-7 px-2 rounded-full border border-primary bg-background text-foreground text-xs w-24 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={submitNewCat}
                    className="w-7 h-7 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddCat(true)}
                  className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground"
                  aria-label="Add category"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Cost Price (₦)</label>
              <input
                type="number"
                value={form.costPrice}
                onChange={(e) => update("costPrice", e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Selling Price (₦)</label>
              <input
                type="number"
                value={form.sellingPrice}
                onChange={(e) => update("sellingPrice", e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Current Stock</label>
            <input
              type="number"
              value={form.currentStock}
              onChange={(e) => update("currentStock", e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Cost Calculator (helper) */}
          <div className="border-t border-border pt-4 mt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cost Calculator</p>
            <p className="text-[11px] text-muted-foreground mb-3">Work out exactly what each piece costs you, then auto-fill the prices above.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">How you buy it</label>
              <select
                value={calc.buyingUnit}
                onChange={(e) => updateCalc("buyingUnit", e.target.value)}
                className="w-full h-12 px-3 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select…</option>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">How you sell it</label>
              <select
                value={calc.sellingUnit}
                onChange={(e) => updateCalc("sellingUnit", e.target.value)}
                className="w-full h-12 px-3 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {["Piece", ...UNITS].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                How many {buyingLabel}{calc.buyingUnit ? "s" : ""} did you order?
              </label>
              <input
                type="number" value={calc.buyingUnitsOrdered}
                onChange={(e) => updateCalc("buyingUnitsOrdered", e.target.value)}
                placeholder="e.g. 10"
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                How many {calc.sellingUnit.toLowerCase()}s in one {buyingLabel}?
              </label>
              <input
                type="number" value={calc.sellingUnitsPerBuying}
                onChange={(e) => updateCalc("sellingUnitsPerBuying", e.target.value)}
                placeholder="e.g. 40"
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Total amount paid for this order</label>
            <input
              type="number" value={calc.totalOrderAmount}
              onChange={(e) => updateCalc("totalOrderAmount", e.target.value)}
              placeholder="e.g. 50000"
              className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Total transport and handling for this order</label>
            <input
              type="number" value={calc.transportFee}
              onChange={(e) => updateCalc("transportFee", e.target.value)}
              placeholder="e.g. 2000"
              className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Profit you want on each piece (%)</label>
            <input
              type="number" value={calc.targetMargin}
              onChange={(e) => updateCalc("targetMargin", e.target.value)}
              placeholder="e.g. 30"
              className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
            <Row label={`How much you paid per ${buyingLabel}`} value={calcResult.cogPerBuying ? fmt(calcResult.cogPerBuying) : "—"} />
            <Row label={`Expenses per ${buyingLabel}`} value={calcResult.expPerBuying ? fmt(calcResult.expPerBuying) : "—"} />
            <Row label={`Full cost per ${buyingLabel} including transport`} value={calcResult.totalCostPerBuying ? fmt(calcResult.totalCostPerBuying) : "—"} />
            <Row label="What each piece costs you" value={calcResult.costPerSelling ? fmt(calcResult.costPerSelling) : "—"} highlight />
            <div className="border-t border-border pt-2 mt-2 space-y-2">
              <Row label="Lowest price you should sell at" value={calcResult.minPrice ? fmt(calcResult.minPrice) : "—"} tone="warning" />
              <Row label="Best price to sell at (good profit)" value={calcResult.idealPrice ? fmt(calcResult.idealPrice) : "—"} tone="success" />
            </div>
            <button
              type="button" onClick={applyCalc}
              className="w-full h-10 mt-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold border border-primary/20"
            >
              Use these prices
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Free shipping on orders above (optional)
            </label>
            <input
              type="number"
              placeholder="Leave blank if not offering"
              value={form.freeShippingThreshold}
              onChange={(e) => update("freeShippingThreshold", e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Goodwill conditions card */}
          <button
            onClick={openGoodwillPage}
            className="w-full bg-card rounded-2xl p-4 border border-border text-left active:opacity-80"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Buy Now Pay Later (Goodwill)</p>
                <p className="text-xs text-muted-foreground mt-0.5">{goodwillSummary}</p>
              </div>
              <span className="text-xs text-primary">Configure →</span>
            </div>
          </button>

          {/* Payment methods */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Payment Methods Accepted</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_OPTS.map((m) => (
                <button
                  key={m}
                  onClick={() => togglePm(m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    paymentMethods.includes(m)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full h-12 mt-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm"
          >
            {isEdit ? "Save Changes" : "Save Product"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DistributorAddProductPage;

function Row({
  label,
  value,
  highlight,
  tone,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  tone?: "warning" | "success";
}) {
  const valueClass = tone === "warning"
    ? "text-warning"
    : tone === "success"
    ? "text-success"
    : highlight
    ? "text-primary font-bold"
    : "text-foreground";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}
