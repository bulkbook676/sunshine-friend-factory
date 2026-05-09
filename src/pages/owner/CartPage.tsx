import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";

const CartPage = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, updateItemPaymentType, grandTotal, cashTotal, goodwillTotal } = useCart();

  // Group by distributor
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.distributorId]) {
      acc[item.distributorId] = { name: item.distributorName, items: [] as typeof items };
    }
    acc[item.distributorId].items.push(item);
    return acc;
  }, {} as Record<string, { name: string; items: typeof items }>);

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-6">My Cart</h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingCart className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Your cart is empty</p>
            <button
              onClick={() => navigate("/owner")}
              className="mt-4 text-sm text-primary font-medium"
            >
              Browse distributors
            </button>
          </div>
        ) : (
          <>
            {Object.entries(grouped).map(([did, group]) => (
              <div key={did} className="mb-6">
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                  {group.name}
                </h3>
                <div className="space-y-2">
                  {group.items.map((it) => {
                    const goodwillSupported = !!it.goodwillSupported;
                    return (
                      <div
                        key={`${it.productId}-${it.paymentType}`}
                        className="bg-card rounded-lg p-4 border border-border"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{it.productName}</p>
                            <span className="text-xs text-muted-foreground">
                              ₦{it.unitPrice.toLocaleString()} / unit
                            </span>
                          </div>
                          <button
                            onClick={() => removeItem(it.productId, it.paymentType)}
                            className="text-muted-foreground"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Payment method selector */}
                        {goodwillSupported && (
                          <div className="flex gap-2 mb-3">
                            <button
                              onClick={() => updateItemPaymentType(it.productId, it.paymentType, "cash")}
                              className={`flex-1 py-1.5 rounded-md text-[11px] font-medium border ${
                                it.paymentType === "cash"
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              Pay Now
                            </button>
                            <button
                              onClick={() => updateItemPaymentType(it.productId, it.paymentType, "goodwill")}
                              className={`flex-1 py-1.5 rounded-md text-[11px] font-medium border ${
                                it.paymentType === "goodwill"
                                  ? "bg-warning text-background border-warning"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              Goodwill
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(it.productId, it.paymentType, it.quantity - 1)
                              }
                              className="w-7 h-7 rounded-md bg-muted flex items-center justify-center"
                            >
                              <Minus className="w-3 h-3 text-foreground" />
                            </button>
                            <span className="text-sm font-medium text-foreground min-w-[20px] text-center">
                              {it.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(it.productId, it.paymentType, it.quantity + 1)
                              }
                              className="w-7 h-7 rounded-md bg-muted flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3 text-foreground" />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-foreground">
                            ₦{(it.unitPrice * it.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Totals breakdown */}
            <div className="bg-card rounded-lg p-4 border border-border mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-foreground font-semibold">₦{grandTotal.toLocaleString()}</span>
              </div>
              {goodwillTotal > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-warning">Goodwill (deferred)</span>
                  <span className="text-warning font-semibold">₦{goodwillTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm text-foreground font-semibold">Cash Payable Now</span>
                <span className="text-2xl font-bold text-primary">₦{cashTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/owner/checkout")}
              className="w-full h-12 rounded-lg bg-primary text-primary-foreground text-sm font-bold"
            >
              Proceed to Checkout
            </button>
          </>
        )}
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default CartPage;
