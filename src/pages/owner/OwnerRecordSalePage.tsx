import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Camera, Search, X, ShoppingCart, Check, ScanLine } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { products } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useSales, PaymentMethod } from "@/contexts/SalesContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import SalesScannerCamera, { type ScannedSaleItem } from "@/components/SalesScannerCamera";
import { useRecordSaleCart, type RecordSaleCartItem } from "@/contexts/RecordSaleCartContext";

type CartItem = RecordSaleCartItem & { unit: string };

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "transfer", label: "Transfer" },
  { value: "promise", label: "Promise" },
];

const OwnerRecordSalePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userName } = useAuth();
  const { addSale } = useSales();
  const [tab, setTab] = useState<"search" | "camera">("search");
  const [query, setQuery] = useState("");
  const { items: cart, setItems: setCartItems, clear: clearCart } = useRecordSaleCart("owner-record-sale");
  const setCart = setCartItems as React.Dispatch<React.SetStateAction<CartItem[]>>;
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [qty, setQty] = useState("1");
  const [showPreview, setShowPreview] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [customerNote, setCustomerNote] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // When returning from Edit Cart, jump straight back to the preview screen.
  useEffect(() => {
    const fromEdit = (location.state as { fromEditCart?: boolean } | null)?.fromEditCart;
    if (fromEdit) setShowPreview(true);
  }, [location.state]);

  const filtered = query.length > 0
    ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  useEffect(() => {
    if (tab === "search" && searchRef.current) searchRef.current.focus();
  }, [tab]);

  const addToCart = (product: typeof products[0], quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      if (existing) return prev.map((c) => c.productId === product.id ? { ...c, qty: c.qty + quantity } : c);
      return [...prev, { productId: product.id, name: product.name, qty: quantity, price: product.sellingPrice, unit: product.sellingUnit }];
    });
  };

  const removeFromCart = (productId: string) => setCart((prev) => prev.filter((c) => c.productId !== productId));

  const mergeScanned = (item: ScannedSaleItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === item.productId);
      if (existing) {
        return prev.map((c) =>
          c.productId === item.productId ? { ...c, qty: c.qty + item.qty } : c
        );
      }
      return [...prev, item];
    });
  };

  const handleScannerContinue = (item: ScannedSaleItem) => {
    mergeScanned(item);
    // Scanner stays open; it resets itself for the next product.
  };

  const handleScannerCheckout = (item: ScannedSaleItem) => {
    mergeScanned(item);
    setCameraOpen(false);
    // Defer slightly so cart state lands before preview reads it.
    setTimeout(() => setShowPreview(true), 0);
  };

  const handleSearchAdd = () => {
    if (!selectedProduct || !qty || parseInt(qty) < 1) return;
    addToCart(selectedProduct, parseInt(qty));
    setSelectedProduct(null);
    setQty("1");
    setQuery("");
    searchRef.current?.focus();
  };

  const grandTotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  const handleConfirm = () => {
    addSale({
      items: cart,
      total: grandTotal,
      paymentMethod,
      customerNote: paymentMethod === "promise" ? customerNote : undefined,
      date: new Date().toISOString().split("T")[0],
      recordedBy: userName || "Owner",
      role: "owner",
    });
    setConfirmed(true);
    clearCart();
    setTimeout(() => navigate("/owner"), 1800);
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
          <div className="mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              paymentMethod === "promise" ? "bg-primary/20 text-primary" : "bg-success/20 text-success"
            }`}>
              {paymentOptions.find((p) => p.value === paymentMethod)?.label}
            </span>
          </div>
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
            <span className="text-sm">Edit Cart</span>
          </button>
          <h1 className="text-xl font-bold text-foreground mb-1">Sale Preview</h1>
          <p className="text-sm text-muted-foreground mb-6">Review before confirming</p>

          <div className="space-y-3 mb-6">
            {cart.map((item) => (
              <div key={item.productId} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-sm font-bold text-primary">₦{(item.qty * item.price).toLocaleString()}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.qty} {item.unit}{item.qty > 1 ? "s" : ""} × ₦{item.price.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-primary/10 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Grand Total</span>
              <span className="text-2xl font-bold text-primary">₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method — Owner exclusive */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-3 block">How are they paying?</label>
            <div className="flex gap-2">
              {paymentOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPaymentMethod(opt.value)}
                  className={`flex-1 py-2.5 rounded-full text-xs font-medium transition-colors ${
                    paymentMethod === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {paymentMethod === "promise" && (
              <input
                type="text"
                placeholder="Customer name or note"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground mt-3"
              />
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                navigate("/owner/edit-cart", {
                  state: { returnTo: "/owner/record-sale", cartKey: "owner-record-sale" },
                })
              }
              className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-foreground"
            >
              Edit
            </button>
            <button onClick={handleConfirm} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
              Confirm Sale
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
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "camera" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
          <button
            onClick={() => setTab("search")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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
          inventory={products}
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
                onChange={(e) => { setQuery(e.target.value); setSelectedProduct(null); }}
                className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {filtered.length > 0 && !selectedProduct && (
              <div className="bg-card border border-border rounded-xl overflow-hidden mb-4 max-h-60 overflow-y-auto">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProduct(p); setQuery(p.name); }}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 border-b border-border last:border-0"
                  >
                    <p className="text-sm text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">₦{p.sellingPrice} · {p.currentStock} in stock</p>
                  </button>
                ))}
              </div>
            )}

            {selectedProduct && (
              <div className="bg-card rounded-2xl p-4 border border-border animate-fade-in mb-4">
                <p className="text-sm font-semibold text-foreground mb-1">{selectedProduct.name}</p>
                <p className="text-xs text-muted-foreground mb-3">₦{selectedProduct.sellingPrice} per {selectedProduct.sellingUnit}</p>
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-xs text-muted-foreground">Qty:</label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    min="1"
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

      {/* Cart Footer */}
      {cart.length > 0 && (
        <div className="absolute bottom-16 left-0 right-0 max-w-[430px] mx-auto bg-card border-t border-border p-4">
          <div className="max-h-28 overflow-y-auto mb-3 space-y-2">
            {cart.map((item) => (
              <div key={item.productId} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.qty} × ₦{item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">₦{(item.qty * item.price).toLocaleString()}</span>
                  <button onClick={() => removeFromCart(item.productId)} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
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

      <OwnerBottomNav />
    </div>
  );
};

export default OwnerRecordSalePage;
