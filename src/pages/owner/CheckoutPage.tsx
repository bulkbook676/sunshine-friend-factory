import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDistributor } from "@/contexts/DistributorContext";
import { toast } from "sonner";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, grandTotal, cashTotal, goodwillTotal, placeOrder } = useCart();
  const { businessName } = useAuth();
  const { addIncomingOrder } = useDistributor();
  const [paymentMethod, setPaymentMethod] = useState<"Bank Transfer" | "Online Payment">("Bank Transfer");

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.distributorId]) {
      acc[item.distributorId] = { name: item.distributorName, items: [] as typeof items };
    }
    acc[item.distributorId].items.push(item);
    return acc;
  }, {} as Record<string, { name: string; items: typeof items }>);

  const handlePlaceOrder = () => {
    if (items.length === 0) return;
    const buyer = businessName || "Mama Nkechi Provisions";
    const newOrders = placeOrder(paymentMethod, buyer);
    // Mirror each order to the distributor side using SAME id so status syncs
    newOrders.forEach((o) => {
      addIncomingOrder({
        id: o.id,
        date: o.date,
        buyerId: "owner-current",
        buyerName: buyer,
        buyerLocation: "Alaba, Lagos",
        items: o.items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          qty: it.quantity,
          unitPrice: it.unitPrice,
          paymentType: it.paymentType,
        })),
        paymentMethod,
      });
    });
    toast.success("Your order is on the way. Distributors have been notified.");
    navigate("/owner/orders");
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-6">Checkout</h1>

        {/* Order Summary */}
        <h3 className="text-sm font-semibold text-foreground mb-3">Order Summary</h3>
        <div className="space-y-4 mb-6">
          {Object.entries(grouped).map(([did, group]) => (
            <div key={did} className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
                {group.name}
              </p>
              <div className="space-y-2">
                {group.items.map((it) => (
                  <div key={`${it.productId}-${it.paymentType}`} className="flex items-start justify-between gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{it.productName}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            it.paymentType === "goodwill"
                              ? "bg-warning/10 text-warning"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {it.paymentType === "goodwill" ? "Goodwill" : "Pay Now"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {it.quantity} × ₦{it.unitPrice.toLocaleString()}
                      </p>
                    </div>
                    <span className="text-foreground font-semibold">
                      ₦{(it.unitPrice * it.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="text-foreground font-semibold">₦{grandTotal.toLocaleString()}</span>
          </div>
          {goodwillTotal > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-warning">Amount to Pay Later (To be repaid later)</span>
              <span className="text-warning font-semibold">₦{goodwillTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-sm text-foreground font-semibold">Subtotal / Cash Payable</span>
            <span className="text-2xl font-bold text-primary">₦{cashTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment method */}
        <h3 className="text-sm font-semibold text-foreground mb-3">Payment Method</h3>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(["Bank Transfer", "Online Payment"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setPaymentMethod(m)}
              className={`p-4 rounded-lg border-2 text-sm font-medium transition-all ${
                paymentMethod === m
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={items.length === 0}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
        >
          Place Order
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;
