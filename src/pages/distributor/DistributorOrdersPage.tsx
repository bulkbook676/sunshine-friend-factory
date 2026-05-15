import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useDistributor } from "@/contexts/DistributorContext";
import DistributorBottomNav from "@/components/DistributorBottomNav";

const DistributorOrdersPage = () => {
  const navigate = useNavigate();
  const { orders } = useDistributor();

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-5">
        <h1 className="text-2xl font-bold text-foreground mb-6">Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 border border-border text-center">
            <p className="text-sm text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const total = o.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
              // Map raw statuses to plain English (no "pending")
              const statusLabel =
                o.status === "pending" || o.status === "confirmed"
                  ? "Received"
                  : o.status === "shipped"
                  ? "Shipped"
                  : o.status === "delivered"
                  ? "Delivered"
                  : "Cancelled";
              return (
                <button
                  key={o.id}
                  onClick={() => navigate(`/distributor/order/${o.id}`)}
                  className="w-full bg-card rounded-2xl p-4 border border-border text-left active:opacity-80"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{o.buyerName}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(o.date).toLocaleString()}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium capitalize ${
                        o.status === "pending" || o.status === "confirmed"
                          ? "bg-secondary/20 text-foreground"
                          : o.status === "shipped"
                          ? "bg-primary/10 text-primary"
                          : o.status === "delivered"
                          ? "bg-success/10 text-success"
                          : "bg-critical/10 text-critical"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">{o.items.length} items</span>
                    <span className="text-sm font-bold text-foreground">₦{total.toLocaleString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorOrdersPage;
