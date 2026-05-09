import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Package, Truck, ShoppingCart, Plus, Minus, Users } from "lucide-react";
import { distributors, DistributorProduct } from "@/data/distributors";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";
import FollowButton from "@/components/FollowButton";
import { getFollowerCount, seedFollowerBase, subscribeFollow } from "@/data/followStore";
import { useEffect, useState as useReactState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const DistributorProfilePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const distributor = distributors.find((d) => d.id === id);
  const { addItem, itemCount } = useCart();
  const { businessName } = useAuth();
  const viewerId = `owner:${businessName || "viewer"}`;
  const targetId = `distributor:${id}`;
  // Seed mock follower base once per distributor
  if (distributor) seedFollowerBase(targetId, 142);
  const [followerCount, setFollowerCount] = useReactState(getFollowerCount(targetId));
  useEffect(() => {
    const unsub = subscribeFollow(() => setFollowerCount(getFollowerCount(targetId)));
    return () => { unsub(); };
  }, [targetId]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedProduct, setSelectedProduct] = useState<DistributorProduct | null>(null);
  const [qty, setQty] = useState(1);
  const [paymentType, setPaymentType] = useState<"cash" | "goodwill">("cash");

  const categories = useMemo(() => {
    if (!distributor) return ["All"];
    const set = new Set<string>();
    distributor.products.forEach((p) => set.add(p.category));
    return ["All", ...Array.from(set)];
  }, [distributor]);

  const filteredProducts = useMemo(() => {
    if (!distributor) return [];
    if (activeCategory === "All") return distributor.products;
    return distributor.products.filter((p) => p.category === activeCategory);
  }, [distributor, activeCategory]);

  if (!distributor) {
    return (
      <div className="app-shell dark bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Distributor not found</p>
      </div>
    );
  }

  const openProduct = (p: DistributorProduct) => {
    setSelectedProduct(p);
    setQty(1);
    setPaymentType("cash");
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addItem({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      distributorId: distributor.id,
      distributorName: distributor.name,
      unitPrice: selectedProduct.price,
      quantity: qty,
      paymentType,
      goodwillSupported: !!selectedProduct.goodwillAvailable,
      goodwillRepaymentDays: selectedProduct.goodwillAvailable ? selectedProduct.goodwillRepaymentDays : undefined,
    });
    toast.success(`${selectedProduct.name} added to cart`);
    setSelectedProduct(null);
  };

  const subtotal = selectedProduct ? selectedProduct.price * qty : 0;
  const meetsFreeShipping =
    distributor.freeShippingThreshold !== undefined && subtotal >= distributor.freeShippingThreshold;

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        {/* Top row: back + cart icon */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <button
            onClick={() => navigate("/owner/cart")}
            className="relative w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
          >
            <ShoppingCart className="w-5 h-5 text-foreground" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-[9px] text-primary-foreground flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold text-primary">{distributor.logo}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{distributor.name}</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{distributor.location}</span>
            </div>
            {distributor.freeShippingThreshold && (
              <div className="flex items-center gap-1 mt-0.5">
                <Truck className="w-3 h-3 text-success" />
                <span className="text-xs text-success">
                  Free shipping on orders above ₦{distributor.freeShippingThreshold.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                activeCategory === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Followers + Follow */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-sm">
              <span className="font-bold text-foreground">{followerCount.toLocaleString()}</span>{" "}
              Followers
            </span>
          </div>
          <FollowButton viewerId={viewerId} targetId={targetId} />
        </div>

        {/* Products */}
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Products ({filteredProducts.length})
        </h3>
        <div className="space-y-3 mb-6">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => openProduct(p)}
              className="w-full bg-card rounded-2xl p-4 border border-border flex items-center gap-3 active:opacity-80 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.availableQty.toLocaleString()} available</p>
                {p.goodwillAvailable && (
                  <span className="inline-block mt-1 text-xs">🤝</span>
                )}
              </div>
              <p className="text-sm font-bold text-foreground">₦{p.price.toLocaleString()}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Product bottom sheet */}
      <Sheet open={!!selectedProduct} onOpenChange={(o) => !o && setSelectedProduct(null)}>
        <SheetContent
          side="bottom"
          className="dark bg-card border-border p-0 h-[85vh] rounded-t-2xl flex flex-col mx-auto max-w-[430px]"
        >
          {selectedProduct && (
            <>
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="aspect-square bg-primary/10 flex items-center justify-center">
                  <Package className="w-20 h-20 text-primary" />
                </div>
                <div className="p-5 space-y-4 pb-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selectedProduct.name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedProduct.availableQty.toLocaleString()} available
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price per unit</span>
                    <span className="text-lg font-bold text-foreground">
                      ₦{selectedProduct.price.toLocaleString()}
                    </span>
                  </div>

                  {meetsFreeShipping && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success/10">
                      <Truck className="w-4 h-4 text-success" />
                      <span className="text-xs text-success font-medium">Free shipping unlocked</span>
                    </div>
                  )}

                  {/* Payment type */}
                  {selectedProduct.goodwillAvailable && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Payment method</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPaymentType("cash")}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border ${
                            paymentType === "cash"
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          Pay Now
                        </button>
                        <button
                          onClick={() => setPaymentType("goodwill")}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border ${
                            paymentType === "goodwill"
                              ? "bg-warning text-background border-warning"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          Goodwill
                        </button>
                      </div>
                      {paymentType === "goodwill" && selectedProduct.goodwillRepaymentDays && (
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          Repay within {selectedProduct.goodwillRepaymentDays} days
                        </p>
                      )}
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Quantity</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4 text-foreground" />
                      </button>
                      <input
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-foreground text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={() => setQty(qty + 1)}
                        className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4 text-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-sm text-muted-foreground">Amount to Collect Now</span>
                    <span className="text-xl font-bold text-primary">₦{subtotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Fixed Add to Cart at bottom */}
              <div className="p-4 border-t border-border bg-card">
                <button
                  onClick={handleAddToCart}
                  className="w-full h-12 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <OwnerBottomNav />
    </div>
  );
};

export default DistributorProfilePage;
