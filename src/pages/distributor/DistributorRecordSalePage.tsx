import { useState, useRef, useEffect, useMemo } from "react";
import { ArrowLeft, Camera, Search, X, ShoppingCart, Check, ScanLine } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDistributor } from "@/contexts/DistributorContext";
import DistributorBottomNav from "@/components/DistributorBottomNav";
import SalesScannerCamera, { type ScannedSaleItem } from "@/components/SalesScannerCamera";
import type { Product } from "@/data/mockData";
import { toast } from "sonner";
import { useRecordSaleCart } from "@/contexts/RecordSaleCartContext";

interface CartItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  unit: string;
}

type Payment = "cash" | "transfer" | "goodwill";

const PAYMENTS: { value: Payment; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Transfer" },
  { value: "goodwill", label: "Pay after selling" },
];

const DistributorRecordSalePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { products, addOwnSale } = useDistributor();
  const [tab, setTab] = useState<"search" | "camera">("camera");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { items: cart, setItems: setCartItems, clear: clearCart } = useRecordSaleCart("distributor-record-sale");
  const setCart = setCartItems as React.Dispatch<React.SetStateAction<CartItem[]>>;
  const [selected, setSelected] = useState<typeof products[0] | null>(null);
  const [qty, setQty] = useState("1");
  const [showPreview, setShowPreview] = useState(false);
  const [payment, setPayment] = useState<Payment>("cash");
  const [customerNote, setCustomerNote] = useState("");
  const [collaborator, setCollaborator] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Returning from Change Items → go straight back to the preview screen.
  useEffect(() => {
    const fromEdit = (location.state as { fromEditCart?: boolean } | null)?.fromEditCart;
    if (fromEdit) setShowPreview(true);
  }, [location.state]);

  // Map distributor products into the Product shape SalesScannerCamera expects.
  const scannerInventory = useMemo<Product[]>(
    () =>
      products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        currentStock: p.currentStock,
        openingStock: p.openingStock,
        buyingUnit: "Unit",
        sellingUnit: "unit",
        unitsPerBuyingUnit: 1,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        totalRevenue: 0,
        status: "healthy",
        salesHistory: [],
        stockLog: [],
      })),
    [products],
  );

  useEffect(() => {
    if (tab === "search") searchRef.current?.focus();
  }, [tab]);

  const filtered = query.length > 0
    ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const addToCart = (p: typeof products[0], q: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === p.id);
      if (existing) return prev.map((c) => c.productId === p.id ? { ...c, qty: c.qty + q } : c);
      return [...prev, { productId: p.id, name: p.name, qty: q, price: p.sellingPrice, unit: "unit" }];
    });
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((c) => c.productId !== id));

  const handleSearchAdd = () => {
    if (!selected || !qty || parseInt(qty) < 1) return;
    if (parseInt(qty) > selected.currentStock) {
      toast.error(`Only ${selected.currentStock} in stock`);
      return;
    }
    addToCart(selected, parseInt(qty));
    setSelected(null);
    setQty("1");
    setQuery("");
    searchRef.current?.focus();
  };

  const mergeScanned = (item: ScannedSaleItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === item.productId);
      if (existing) {
        return prev.map((c) =>
          c.productId === item.productId ? { ...c, qty: c.qty + item.qty } : c
        );
      }
      return [...prev, { productId: item.productId, name: item.name, qty: item.qty, price: item.price, unit: item.unit }];
    });
  };

  const handleScannerContinue = (item: ScannedSaleItem) => {
    mergeScanned(item);
    // Scanner stays open and resets itself for the next product.
  };

  const handleScannerCheckout = (item: ScannedSaleItem) => {
    mergeScanned(item);
    setCameraOpen(false);
    setTimeout(() => setShowPreview(true), 0);
  };

  const grandTotal = cart.reduce((s, i) => s + i.qty * i.price, 0);

  const handleConfirm = () => {
    addOwnSale({
      items: cart.map((c) => ({ productId: c.productId, productName: c.name, qty: c.qty, unitPrice: c.price })),
      total: grandTotal,
      paymentMethod: payment,
      customerNote: payment === "goodwill" ? customerNote : undefined,
      collaborator: collaborator || undefined,
    });
    setConfirmed(true);
    clearCart();
    setTimeout(() => navigate("/distributor"), 1800);
  };

  if (confirmed) {
    return (
      <div className="app-shell dark bg-background flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Sale Recorded!</h2>
          <p className="text-sm text-muted-foreground">{cart.length} items · ₦{grandTotal.toLocaleString()}</p>
        </div>
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="app-shell dark bg-background">
        <div className="page-content px-4 pt-4">
          <button onClick={() => setShowPreview(false)} className="flex items-center gap-1 text-muted-foreground mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Cart</span>
          </button>
          <h1 className="text-xl font-bold text-foreground mb-1">Check Before Recording</h1>
          <p className="text-sm text-muted-foreground mb-6">Review before confirming</p>

          <div className="space-y-3 mb-6">
            {cart.map((i) => (
              <div key={i.productId} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-foreground">{i.name}</p>
                  <p className="text-sm font-bold text-primary">₦{(i.qty * i.price).toLocaleString()}</p>
                </div>
                <p className="text-xs text-muted-foreground">{i.qty} × ₦{i.price.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="bg-primary/10 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Total Amount</span>
              <span className="text-2xl font-bold text-primary">₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-foreground mb-3 block">Payment Method</label>
            <div className="flex gap-2">
              {PAYMENTS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPayment(p.value)}
                  className={`flex-1 py-2.5 rounded-full text-xs font-medium ${
                    payment === p.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {payment === "goodwill" && (
              <input
                type="text"
                placeholder="Buyer name or note"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground mt-3"
              />
            )}
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-2 block">Collaborator (optional)</label>
            <input
              type="text"
              placeholder="Staff name"
              value={collaborator}
              onChange={(e) => setCollaborator(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                navigate("/distributor/edit-cart", {
                  state: { returnTo: "/distributor/record-sale", cartKey: "distributor-record-sale" },
                })
              }
              className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-foreground"
            >
              Edit
            </button>
            <button onClick={handleConfirm} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
              Record This Sale
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4" style={{ paddingBottom: cart.length > 0 ? 220 : 80 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Record a Sale</h1>
          </div>
          {cart.length > 0 && (
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {cart.length}
              </span>
            </div>
          )}
        </div>

        <div className="flex bg-muted rounded-xl p-1 mb-5">
          <button
            onClick={() => setTab("camera")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium ${
              tab === "camera" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
          <button
            onClick={() => setTab("search")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium ${
              tab === "search" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>

        {tab === "camera" && (
          <div className="mb-4">
            <button
              onClick={() => setCameraOpen(true)}
              className="w-full aspect-[3/4] rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-2 active:scale-[0.99] transition-transform"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-1">
                <ScanLine className="w-8 h-8 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Open scanner</span>
              <span className="text-xs text-muted-foreground">Auto-detects products from your inventory</span>
            </button>
          </div>
        )}

        <SalesScannerCamera
          open={cameraOpen}
          inventory={scannerInventory}
          cartCount={cart.length}
          onAddAndContinue={handleScannerContinue}
          onAddAndCheckout={handleScannerCheckout}
          onClose={() => setCameraOpen(false)}
        />

        {tab === "search" && (
          <div className="mb-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search product name..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {filtered.length > 0 && !selected && (
              <div className="bg-card border border-border rounded-xl overflow-hidden mb-4 max-h-60 overflow-y-auto">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelected(p); setQuery(p.name); }}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 border-b border-border last:border-0"
                  >
                    <p className="text-sm text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">₦{p.sellingPrice.toLocaleString()} · {p.currentStock.toLocaleString()} in stock</p>
                  </button>
                ))}
              </div>
            )}

            {selected && (
              <div className="bg-card rounded-2xl p-4 border border-border animate-fade-in mb-4">
                <p className="text-sm font-semibold text-foreground mb-1">{selected.name}</p>
                <p className="text-xs text-muted-foreground mb-3">₦{selected.sellingPrice.toLocaleString()} each · {selected.currentStock.toLocaleString()} in stock</p>
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-xs text-muted-foreground">Qty:</label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    min="1"
                    max={selected.currentStock}
                    className="w-20 bg-muted rounded-lg px-3 py-2 text-sm text-foreground text-center"
                  />
                </div>
                <button onClick={handleSearchAdd} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                  Add to Cart
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="absolute bottom-16 left-0 right-0 max-w-[430px] mx-auto bg-card border-t border-border p-4">
          <div className="max-h-28 overflow-y-auto mb-3 space-y-2">
            {cart.map((i) => (
              <div key={i.productId} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{i.name}</p>
                  <p className="text-[10px] text-muted-foreground">{i.qty} × ₦{i.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">₦{(i.qty * i.price).toLocaleString()}</span>
                  <button onClick={() => removeFromCart(i.productId)} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Total</span>
            <span className="text-lg font-bold text-primary">₦{grandTotal.toLocaleString()}</span>
          </div>
          <button onClick={() => setShowPreview(true)} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
            Preview Sale
          </button>
        </div>
      )}

      <DistributorBottomNav />
    </div>
  );
};

export default DistributorRecordSalePage;