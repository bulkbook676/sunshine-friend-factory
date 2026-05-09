import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useCart, OrderStatus } from "@/contexts/CartContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-secondary/20 text-secondary-foreground",
  shipped: "bg-primary/10 text-primary",
  delivered: "bg-success/10 text-success",
  declined: "bg-critical/10 text-critical",
};

const FILTERS: ("All" | OrderStatus)[] = ["All", "pending", "confirmed", "shipped", "delivered"];

const OwnerOrdersPage = () => {
  const navigate = useNavigate();
  const { orders } = useCart();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const filtered = useMemo(() => {
    if (filter === "All") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-4">My Orders</h1>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border capitalize transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingBag className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No orders here yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => {
              const cashPaid = o.items
                .filter((i) => i.paymentType === "cash")
                .reduce((s, i) => s + i.quantity * i.unitPrice, 0);
              const goodwill = o.items
                .filter((i) => i.paymentType === "goodwill")
                .reduce((s, i) => s + i.quantity * i.unitPrice, 0);
              const total = cashPaid + goodwill;
              return (
                <button
                  key={o.id}
                  onClick={() => navigate(`/owner/order/${o.id}`)}
                  className="w-full text-left bg-card rounded-2xl p-4 border border-border active:opacity-80"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/owner/distributor/${o.distributorId}`);
                        }}
                        className="text-sm font-semibold text-foreground hover:underline"
                      >
                        {o.distributorName}
                      </button>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(o.date).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium capitalize ${STATUS_COLORS[o.status]}`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {o.items.map((i, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate">
                          {i.productName} × {i.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="text-[11px] text-muted-foreground">
                      Cash: <span className="text-foreground font-medium">₦{cashPaid.toLocaleString()}</span>
                      {goodwill > 0 && (
                        <>
                          {" · "}
                          <span className="text-warning">Goodwill: ₦{goodwill.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                    <span className="text-sm font-bold text-foreground">₦{total.toLocaleString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default OwnerOrdersPage;
