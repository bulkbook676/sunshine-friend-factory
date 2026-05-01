import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Minus, Plus, ScanLine, Search } from "lucide-react";
import type { Product } from "@/data/mockData";

export interface ScannedSaleItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  unit: string;
}

interface SalesScannerCameraProps {
  open: boolean;
  /** Inventory used for "AI" recognition. */
  inventory: Product[];
  /** Cart length (for the badge). */
  cartCount: number;
  /** Called when user taps Continue — adds item, then camera reopens for the next scan. */
  onAddAndContinue: (item: ScannedSaleItem) => void;
  /** Called when user taps Checkout — adds item and navigates to preview. */
  onAddAndCheckout: (item: ScannedSaleItem) => void;
  /** Cancel — close the camera entirely. */
  onClose: () => void;
  /** Optional: simulated recognition delay in ms. Default 2200. */
  recognitionDelay?: number;
}

/**
 * Smart Sales Scanner.
 *
 * Live camera fills the screen. After a short stabilisation window the system
 * "recognises" a product from the existing inventory (mock: cycles through the
 * provided inventory list), then animates a product card up from the bottom
 * with a quantity selector and Continue / Checkout buttons.
 *
 * - Continue → emits the current item and immediately resets to scan again.
 * - Checkout → emits the current item and lets the parent navigate away.
 * - X        → closes the scanner without adding anything.
 */
const SalesScannerCamera = ({
  open,
  inventory,
  cartCount,
  onAddAndContinue,
  onAddAndCheckout,
  onClose,
  recognitionDelay = 2200,
}: SalesScannerCameraProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cycleRef = useRef(0);

  const [recognised, setRecognised] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // When recognition fails (low confidence) we fall back to a manual search panel.
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch {
      setCameraError("Unable to access camera. Please grant permission and try again.");
    }
  }, []);

  // Reset on open/close.
  useEffect(() => {
    if (!open) {
      stopCamera();
      setRecognised(null);
      setQty(1);
      setSearchOpen(false);
      setSearchQuery("");
      return;
    }
    setRecognised(null);
    setQty(1);
    setSearchOpen(false);
    setSearchQuery("");
    void startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-recognition timer. Picks the next inventory product to simulate AI match.
  useEffect(() => {
    if (!open || recognised || searchOpen) return;
    if (inventory.length === 0) return;
    const t = setTimeout(() => {
      // Simulate ~25% no-confident-match outcome → fall back to manual search.
      const noMatch = Math.random() < 0.25;
      if (noMatch) {
        setSearchOpen(true);
        return;
      }
      const next = inventory[cycleRef.current % inventory.length];
      cycleRef.current += 1;
      setRecognised(next);
      setQty(1);
    }, recognitionDelay);
    return () => clearTimeout(t);
  }, [open, recognised, inventory, recognitionDelay, searchOpen]);

  const buildItem = (p: Product, q: number): ScannedSaleItem => ({
    productId: p.id,
    name: p.name,
    qty: q,
    price: p.sellingPrice,
    unit: p.sellingUnit,
  });

  const handleContinue = () => {
    if (!recognised) return;
    onAddAndContinue(buildItem(recognised, qty));
    // Reopen scanner for next item.
    setRecognised(null);
    setQty(1);
  };

  const handleCheckout = () => {
    if (!recognised) return;
    onAddAndCheckout(buildItem(recognised, qty));
  };

  const handleCancel = () => {
    stopCamera();
    onClose();
  };

  const handleManualSelect = (p: Product) => {
    setRecognised(p);
    setQty(1);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleWrongProduct = () => {
    setRecognised(null);
    setQty(1);
    setSearchOpen(true);
  };

  const filteredInventory = searchQuery.trim().length > 0
    ? inventory.filter((p) => p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : inventory;

  if (!open) return null;

  const initial = recognised?.name?.charAt(0).toUpperCase() ?? "?";

  const modal = (
    <div className="fixed inset-0 z-[60] bg-black" style={{ height: "100dvh" }}>
      {/* Camera layer */}
      <div className="absolute inset-0 z-[1]">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center text-white">
            <p className="text-sm mb-4">{cameraError}</p>
            <button
              onClick={() => void startCamera()}
              className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Top chrome: cancel + cart badge */}
      <button
        onClick={handleCancel}
        aria-label="Close camera"
        className="absolute z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)", right: 16 }}
      >
        <X className="w-5 h-5" />
      </button>

      {cartCount > 0 && (
        <div
          className="absolute z-50 h-10 min-w-10 px-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-1.5 text-xs font-bold shadow-lg"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)", left: 16 }}
        >
          <span>Cart</span>
          <span className="bg-white/25 rounded-full px-1.5 py-0.5 text-[10px]">{cartCount}</span>
        </div>
      )}

      {/* Scanning state — only shown until a product is recognised */}
      {!recognised && !searchOpen && !cameraError && (
        <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64 rounded-2xl border-2 border-white/70 overflow-hidden">
            <div
              className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_12px_2px_hsl(var(--primary))]"
              style={{ animation: "scanline 2.2s ease-in-out infinite" }}
            />
          </div>
          <span className="mt-5 text-xs text-white/90 bg-black/55 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <ScanLine className="w-3.5 h-3.5" />
            Point at a product
          </span>
        </div>
      )}

      {/* Fallback manual search panel — slides up when no confident match */}
      {searchOpen && !recognised && (
        <div
          className="fixed left-0 right-0 z-50 bg-card text-card-foreground rounded-t-3xl shadow-[0_-12px_32px_rgba(0,0,0,0.55)] animate-slide-up"
          style={{ bottom: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)", maxHeight: "70dvh", display: "flex", flexDirection: "column" }}
        >
          <div className="px-5 pt-5 pb-3 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
            <p className="text-xs text-muted-foreground mb-1">Couldn't identify the product</p>
            <p className="text-sm font-semibold text-foreground mb-3">Pick it from your inventory</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Search inventory…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="overflow-y-auto px-5 pb-2" style={{ flex: 1 }}>
            {filteredInventory.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No matching products</p>
            ) : (
              <ul className="space-y-1">
                {filteredInventory.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => handleManualSelect(p)}
                      className="w-full flex items-center justify-between gap-3 py-3 px-3 rounded-lg hover:bg-muted/60 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {p.currentStock} {p.sellingUnit}
                          {p.currentStock !== 1 ? "s" : ""} · ₦{p.sellingPrice.toLocaleString()}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Recognised product card — slides up */}
      {recognised && (
        <div
          className="fixed left-0 right-0 z-50 bg-card text-card-foreground rounded-t-3xl shadow-[0_-12px_32px_rgba(0,0,0,0.55)] animate-slide-up"
          style={{ bottom: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
        >
          <div className="px-5 pt-5">
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

            {/* Product row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{recognised.name}</p>
                <p className="text-xs text-muted-foreground">
                  {recognised.currentStock} {recognised.sellingUnit}
                  {recognised.currentStock !== 1 ? "s" : ""} in stock
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Unit price</p>
                <p className="text-sm font-bold text-primary">
                  ₦{recognised.sellingPrice.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="flex items-center justify-between bg-muted rounded-2xl p-2 mb-4">
              <span className="text-xs text-muted-foreground pl-2">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-full bg-card flex items-center justify-center text-foreground border border-border disabled:opacity-40"
                  disabled={qty <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-base font-bold text-foreground w-8 text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-9 h-9 rounded-full bg-card flex items-center justify-center text-foreground border border-border"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleContinue}
                className="h-12 rounded-xl border-2 border-primary text-primary font-semibold text-sm bg-transparent active:scale-[0.98] transition-transform"
              >
                Continue
              </button>
              <button
                onClick={handleCheckout}
                className="h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg active:scale-[0.98] transition-transform"
              >
                Checkout
              </button>
            </div>

            <button
              onClick={handleWrongProduct}
              className="mt-3 w-full text-center text-[11px] text-muted-foreground underline-offset-2 hover:underline"
            >
              Wrong product? Search again
            </button>
          </div>
        </div>
      )}

      {/* Local keyframes for the scanline (avoids touching tailwind config) */}
      <style>{`
        @keyframes scanline {
          0%   { top: 0%; opacity: 0.2; }
          50%  { top: 95%; opacity: 1; }
          100% { top: 0%; opacity: 0.2; }
        }
      `}</style>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : modal;
};

export default SalesScannerCamera;