import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, Camera, TrendingUp, TrendingDown, Check, Plus, ChevronRight } from "lucide-react";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import ProductCameraFlow, { type CapturedProduct } from "@/components/ProductCameraFlow";
import {
  products as productStore,
  type Product,
  productCategories,
  customCategoryStore,
  addCustomCategory,
  findProductByName,
} from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

const baseUnitTypes = ["Carton", "Bag", "Roll", "Piece", "Kg", "Litre", "Yard"];

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  label: string;
  saved: boolean;
}

/** Per-thumbnail draft form. Mirrors the editable form fields. */
interface ProductDraft {
  name: string;
  category: string;
  buyingUnit: string;
  sellingUnit: string;
  buyingUnitsOrdered: string;
  sellingUnitsPerBuying: string;
  totalOrderAmount: string;
  transportFee: string;
  actualSellingPrice: string;
  applyPriceToCurrent: boolean;
}

const emptyDraft = (name = ""): ProductDraft => ({
  name,
  category: "",
  buyingUnit: "",
  sellingUnit: "",
  buyingUnitsOrdered: "",
  sellingUnitsPerBuying: "",
  totalOrderAmount: "",
  transportFee: "",
  actualSellingPrice: "",
  applyPriceToCurrent: false,
});

// --- Field components defined OUTSIDE the page so they are NOT recreated on
//     every render. Recreating them caused React to unmount the underlying
//     <input>, which made the mobile keyboard close after every keystroke.
type TextFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  prefix?: string;
  inputMode?: "text" | "numeric" | "decimal";
  error?: string;
};

const TextField = ({ label, placeholder, value, onChange, type = "text", prefix, inputMode, error }: TextFieldProps) => (
  <div>
    <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
    <div className="relative">
      {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>}
      <input
        type={type}
        inputMode={inputMode ?? (type === "number" ? "decimal" : "text")}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-12 ${prefix ? "pl-8" : "px-4"} pr-4 rounded-lg border ${error ? "border-critical" : "border-input"} bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary`}
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

const AddProductPage = () => {
  const navigate = useNavigate();

  // Camera flow state — fully delegated to <ProductCameraFlow />
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);

  // Active product form (selected thumbnail)
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);

  // Per-thumbnail drafts. Persisted across thumbnail switches so users can
  // navigate back to a saved product and see their entered data.
  const [drafts, setDrafts] = useState<Record<string, ProductDraft>>({});

  // Final preview-all screen toggle (shown after the last thumbnail is saved).
  const [showPreviewAll, setShowPreviewAll] = useState(false);

  // Custom unit types (persist for the session)
  const [customUnits, setCustomUnits] = useState<string[]>([]);
  const allUnits = useMemo(() => [...baseUnitTypes, ...customUnits], [customUnits]);

  // Active form state, mirrored to drafts[activePhotoId] on every change.
  const [form, setForm] = useState<ProductDraft>(emptyDraft());

  // FIX 5 — categories
  const [customCats, setCustomCats] = useState<string[]>([...customCategoryStore]);
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);
  const [customCatInput, setCustomCatInput] = useState("");
  const allCategories = useMemo(() => [...productCategories, ...customCats], [customCats]);

  const addCustomCat = () => {
    const added = addCustomCategory(customCatInput);
    if (added) {
      setCustomCats([...customCategoryStore]);
      setForm((p) => ({ ...p, category: added }));
    }
    setCustomCatInput("");
    setShowCustomCatInput(false);
  };

  // FIX 4 — duplicate product detection. When the typed name matches an
  // existing product we surface a banner offering to merge into existing stock.
  const existingMatch = useMemo(() => findProductByName(form.name), [form.name]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (k: string, v: string | boolean) => {
    setForm((p) => {
      const next = { ...p, [k]: v } as ProductDraft;
      if (activePhotoId) {
        setDrafts((d) => ({ ...d, [activePhotoId]: next }));
      }
      return next;
    });
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const promptAddCustomUnit = (target: "buyingUnit" | "sellingUnit") => {
    const name = window.prompt("Enter custom unit name (e.g. Sachet)")?.trim();
    if (!name) return;
    if (!allUnits.includes(name)) {
      setCustomUnits((prev) => [...prev, name]);
    }
    update(target, name);
  };

  // Open / close handled by ProductCameraFlow; we just toggle a flag.
  const openCameraModal = () => setCameraOpen(true);

  const handleSavedCapture = ({ dataUrl, name }: CapturedProduct) => {
    const newPhoto: CapturedPhoto = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dataUrl,
      label: name,
      saved: false,
    };
    setCapturedPhotos((prev) => [...prev, newPhoto]);
    setDrafts((d) => ({ ...d, [newPhoto.id]: emptyDraft(name) }));
    setActivePhotoId(newPhoto.id);
    setForm(emptyDraft(name));
  };

  const handleContinueFromCamera = () => {
    setCameraOpen(false);
  };

  const selectThumbnail = (photo: CapturedPhoto) => {
    // Persist current edits into the previously-active draft before switching.
    if (activePhotoId) {
      setDrafts((d) => ({ ...d, [activePhotoId]: form }));
    }
    setActivePhotoId(photo.id);
    const existing = drafts[photo.id];
    setForm(existing ?? emptyDraft(photo.label));
    setErrors({});
  };

  // Pure computation so we can run it for the active form AND for any draft
  // (e.g. when rendering the preview-all summary).
  const computeFor = (d: ProductDraft) => {
    const units = parseFloat(d.sellingUnitsPerBuying) || 0;
    const totalOrder = parseFloat(d.totalOrderAmount) || 0;
    const qtyOrdered = parseFloat(d.buyingUnitsOrdered) || 0;
    const transport = parseFloat(d.transportFee) || 0;
    const asp = parseFloat(d.actualSellingPrice) || 0;

    const cogPerBuying = qtyOrdered > 0 ? totalOrder / qtyOrdered : 0;
    const expPerBuying = qtyOrdered > 0 ? transport / qtyOrdered : 0;
    const totalCostPerBuying = cogPerBuying + expPerBuying;
    const costPerSelling = units > 0 ? totalCostPerBuying / units : 0;
    const minViablePrice = costPerSelling * 1.1;
    const idealPrice = costPerSelling * 1.3;
    const marginPerUnit = asp - costPerSelling;
    const marginPct = costPerSelling > 0 ? ((asp - costPerSelling) / costPerSelling) * 100 : 0;
    const openingStock = qtyOrdered * units;

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
      verdictLabel, verdictColor, openingStock,
    };
  };

  const calc = useMemo(() => computeFor(form), [
    form.sellingUnitsPerBuying, form.totalOrderAmount, form.buyingUnitsOrdered, form.transportFee, form.actualSellingPrice,
  ]);

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString()}`;

  const sellingUnitLabel = form.sellingUnit || "units";
  const buyingUnitLabel = form.buyingUnit || "units";

  const validateDraft = (d: ProductDraft): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!d.name.trim()) e.name = "Required";
    if (!d.buyingUnit) e.buyingUnit = "Required";
    if (!d.sellingUnit) e.sellingUnit = "Required";
    if (!d.buyingUnitsOrdered || parseFloat(d.buyingUnitsOrdered) <= 0) e.buyingUnitsOrdered = "Required";
    if (!d.sellingUnitsPerBuying || parseFloat(d.sellingUnitsPerBuying) <= 0) e.sellingUnitsPerBuying = "Required";
    if (!d.totalOrderAmount || parseFloat(d.totalOrderAmount) <= 0) e.totalOrderAmount = "Required";
    if (!d.actualSellingPrice || parseFloat(d.actualSellingPrice) <= 0) e.actualSellingPrice = "Required";
    return e;
  };

  const validate = () => {
    const e = validateDraft(form);
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const draftToProduct = (d: ProductDraft): Product => {
    const c = computeFor(d);
    return {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: d.name.trim(),
      category: d.category || "Uncategorized",
      currentStock: Math.round(c.openingStock),
      buyingUnit: d.buyingUnit,
      sellingUnit: d.sellingUnit,
      unitsPerBuyingUnit: parseFloat(d.sellingUnitsPerBuying) || 0,
      costPrice: Math.round(c.totalCostPerBuying),
      sellingPrice: parseFloat(d.actualSellingPrice) || 0,
      totalRevenue: 0,
      status: "healthy",
      salesHistory: [0, 0, 0, 0, 0, 0, 0],
      stockLog: [{ date: "Just now", action: "Added", qty: Math.round(c.openingStock), by: "Owner" }],
    };
  };

  /**
   * Save the current thumbnail's details and advance to the next unsaved one.
   * If this was the last unsaved thumbnail, surface the "Preview All" CTA
   * instead of navigating away — the user must explicitly submit to commit
   * everything to the inventory store.
   */
  const saveProduct = () => {
    if (!validate()) {
      toast({ title: "Please fix the errors", description: "Some required fields are missing.", variant: "destructive" });
      return;
    }
    if (!activePhotoId) {
      toast({ title: "No product selected", variant: "destructive" });
      return;
    }

    // Persist the validated draft and mark the current photo saved.
    const savedDraft = { ...form };
    setDrafts((d) => ({ ...d, [activePhotoId]: savedDraft }));
    const updatedPhotos = capturedPhotos.map((p) =>
      p.id === activePhotoId ? { ...p, saved: true, label: savedDraft.name } : p,
    );
    setCapturedPhotos(updatedPhotos);

    // Find the next unsaved thumbnail.
    const nextUnsaved = updatedPhotos.find((p) => !p.saved);

    if (nextUnsaved) {
      const remaining = updatedPhotos.filter((p) => !p.saved).length;
      toast({
        title: "Saved",
        description: `${remaining} product${remaining > 1 ? "s" : ""} left to fill in`,
      });
      setActivePhotoId(nextUnsaved.id);
      const existing = drafts[nextUnsaved.id];
      setForm(existing ?? emptyDraft(nextUnsaved.label));
      setErrors({});
      // Scroll to top so the next product starts at the form header.
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // All thumbnails are saved — show the Preview All CTA.
      toast({ title: "All products saved — review and submit" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /** Final commit: push every saved draft to the inventory store. */
  const submitAll = () => {
    // Defensive validation in case anything is incomplete.
    const incomplete = capturedPhotos.find((p) => {
      const d = drafts[p.id];
      return !d || Object.keys(validateDraft(d)).length > 0;
    });
    if (incomplete) {
      toast({
        title: "Some products are incomplete",
        description: "Tap the highlighted thumbnail to finish its details.",
        variant: "destructive",
      });
      setShowPreviewAll(false);
      setActivePhotoId(incomplete.id);
      const d = drafts[incomplete.id];
      setForm(d ?? emptyDraft(incomplete.label));
      return;
    }
    capturedPhotos.forEach((p) => {
      const d = drafts[p.id];
      if (d) productStore.push(draftToProduct(d));
    });
    toast({
      title: `${capturedPhotos.length} product${capturedPhotos.length > 1 ? "s" : ""} added`,
    });
    navigate("/owner/inventory");
  };

  // Derived: how many products are saved, total, current index for "N of M".
  const totalProducts = capturedPhotos.length;
  const savedCount = capturedPhotos.filter((p) => p.saved).length;
  const allSaved = totalProducts > 0 && savedCount === totalProducts;
  const currentIndex = activePhotoId
    ? capturedPhotos.findIndex((p) => p.id === activePhotoId) + 1
    : 0;

  // ---- Preview-all screen ----
  if (showPreviewAll) {
    const fmtN = (n: number) => `₦${Math.round(n).toLocaleString()}`;
    return (
      <div className="app-shell dark bg-background">
        <div className="page-content px-4 pt-4 pb-8">
          <button onClick={() => setShowPreviewAll(false)} className="flex items-center gap-1 text-muted-foreground mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to edit</span>
          </button>
          <h1 className="text-lg font-bold text-foreground mb-1">Preview Products</h1>
          <p className="text-xs text-muted-foreground mb-5">
            Review {capturedPhotos.length} product{capturedPhotos.length > 1 ? "s" : ""} before adding to inventory.
          </p>

          <div className="space-y-3 mb-6">
            {capturedPhotos.map((p, i) => {
              const d = drafts[p.id];
              if (!d) return null;
              const c = computeFor(d);
              return (
                <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex gap-3">
                  <img src={p.dataUrl} alt={d.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-foreground truncate">{d.name || `Product ${i + 1}`}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">#{i + 1}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2">{d.category || "Uncategorized"}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                      <span className="text-muted-foreground">Stock</span>
                      <span className="text-foreground text-right">
                        {Math.round(c.openingStock).toLocaleString()} {d.sellingUnit}
                      </span>
                      <span className="text-muted-foreground">Cost / unit</span>
                      <span className="text-foreground text-right">{c.costPerSelling > 0 ? fmtN(c.costPerSelling) : "—"}</span>
                      <span className="text-muted-foreground">Selling price</span>
                      <span className="text-primary font-semibold text-right">{fmtN(parseFloat(d.actualSellingPrice) || 0)}</span>
                      <span className="text-muted-foreground">Margin</span>
                      <span className={`text-right font-semibold ${c.verdictColor || "text-foreground"}`}>
                        {c.marginPct ? `${Math.round(c.marginPct)}%` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={submitAll}
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold text-sm"
          >
            Add {capturedPhotos.length} product{capturedPhotos.length > 1 ? "s" : ""} to inventory
          </button>
        </div>
        <OwnerBottomNav />
      </div>
    );
  }

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-base font-bold text-foreground">Add Product</h1>
          <div className="w-12" />
        </div>

        {/* Camera Card / Thumbnail Strip */}
        {capturedPhotos.length === 0 ? (
          <button onClick={openCameraModal} className="w-full h-28 rounded-lg border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-2 mb-6">
            <Camera className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Tap to add product photos</span>
          </button>
        ) : (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Captured Products</span>
              {totalProducts > 0 && (
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {savedCount} of {totalProducts} saved
                </span>
              )}
              <button onClick={openCameraModal} className="ml-auto text-xs text-primary font-medium">+ Add More</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {capturedPhotos.map((photo) => (
                <button key={photo.id} onClick={() => selectThumbnail(photo)}
                  className={`flex-shrink-0 w-20 flex flex-col items-center gap-1 relative ${activePhotoId === photo.id ? "ring-2 ring-primary rounded-lg" : ""}`}>
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted relative">
                    <img src={photo.dataUrl} alt={photo.label} className="w-full h-full object-cover" />
                    {photo.saved && (
                      <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                          <Check className="w-4 h-4 text-success-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center truncate w-full">{photo.label}</span>
                </button>
              ))}
            </div>

            {/* Progress indicator: "Product N of M" */}
            {activePhotoId && totalProducts > 1 && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[11px] font-medium text-foreground">
                  Product {currentIndex} of {totalProducts}
                </p>
                <div className="flex-1 mx-3 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(savedCount / totalProducts) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">{savedCount}/{totalProducts}</p>
              </div>
            )}
          </div>
        )}

        {/* New strict camera flow */}
        <ProductCameraFlow
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onSavedCapture={handleSavedCapture}
          onContinue={handleContinueFromCamera}
        />

        <div className="space-y-4">
          {/* Product Info */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Info</p>
          <TextField label="Product Name" placeholder="e.g. Indomie Chicken (70g)" value={form.name} onChange={(v) => update("name", v)} error={errors.name} />

          {/* Category with inline "+ Add new" */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Category</label>
            {showCustomCatInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={customCatInput}
                  onChange={(e) => setCustomCatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addCustomCat();
                    if (e.key === "Escape") { setShowCustomCatInput(false); setCustomCatInput(""); }
                  }}
                  placeholder="New category name"
                  className="flex-1 h-12 px-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={addCustomCat}
                  disabled={!customCatInput.trim()}
                  className="h-12 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCustomCatInput(false); setCustomCatInput(""); }}
                  className="h-12 px-3 rounded-lg border border-input text-muted-foreground text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={form.category}
                  onChange={(e) => {
                    if (e.target.value === "__add__") {
                      setShowCustomCatInput(true);
                      return;
                    }
                    update("category", e.target.value);
                  }}
                  className="w-full h-12 pl-4 pr-20 rounded-lg border border-input bg-card text-foreground text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select category</option>
                  {allCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__add__">+ Add new category…</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowCustomCatInput(true)}
                  aria-label="Add new category"
                  className="absolute right-10 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>

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

          {/* FIX 2 — split into two side-by-side fields with dynamic labels */}
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

          {/* Order Details — duplicate "How many buying units" removed */}
          <div className="border-t border-border pt-4 mt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Order Details</p>
          </div>

          <TextField label="Total amount paid for this order" placeholder="e.g. ₦50,000" value={form.totalOrderAmount} onChange={(v) => update("totalOrderAmount", v)} type="number" prefix="₦" error={errors.totalOrderAmount} />
          <TextField label="Total transport and handling for this order" placeholder="e.g. ₦2,000" value={form.transportFee} onChange={(v) => update("transportFee", v)} type="number" prefix="₦" />

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

          {/* Stock — auto-calculated cards */}
          <div className="border-t border-border pt-4 mt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Stock</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Opening Stock</p>
              <p className="text-2xl font-bold text-foreground">{Math.round(calc.openingStock).toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{sellingUnitLabel}{calc.openingStock !== 1 ? "s" : ""}</p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Current Inventory</p>
              <p className="text-2xl font-bold text-primary">{Math.round(calc.openingStock).toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{sellingUnitLabel}{calc.openingStock !== 1 ? "s" : ""}</p>
            </div>
          </div>

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

          {/* Projected revenue */}
          {(() => {
            const openStock = calc.openingStock;
            const idealRev = openStock * calc.idealPrice;
            const yourRev = openStock * (parseFloat(form.actualSellingPrice) || 0);
            if (openStock > 0 && calc.idealPrice > 0) {
              return (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Projected Revenue at Ideal Price</p>
                    <p className="text-lg font-bold text-success">{fmt(idealRev)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">If sold at ideal price (30% margin)</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Projected Revenue at Your Price</p>
                    <p className="text-lg font-bold text-primary">{yourRev > 0 ? fmt(yourRev) : "—"}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">If sold at your price</p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <button onClick={saveProduct} className="w-full h-12 mt-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">
            Save Product
          </button>
        </div>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default AddProductPage;
