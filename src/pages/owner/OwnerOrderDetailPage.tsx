import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Truck, PackageCheck, Clock } from "lucide-react";
import { useCart, OrderStatus } from "@/contexts/CartContext";
import { useDistributor } from "@/contexts/DistributorContext";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STEPS: { key: OrderStatus; label: string; icon: typeof Clock }[] = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: Check },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
];

const OwnerOrderDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { orders, updateOrderStatus } = useCart();
  const { setOrderStatus: setDistOrderStatus } = useDistributor();
  const [confirmDeliveredOpen, setConfirmDeliveredOpen] = useState(false);
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="app-shell dark bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Order not found</p>
      </div>
    );
  }

  const cashPaid = order.items
    .filter((i) => i.paymentType === "cash")
    .reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const goodwill = order.items
    .filter((i) => i.paymentType === "goodwill")
    .reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = cashPaid + goodwill;

  const stepIndex = STEPS.findIndex((s) => s.key === order.status);
  const isDeclined = order.status === "declined";

  const handleMarkReceived = () => {
    updateOrderStatus(order.id, "delivered");
    setDistOrderStatus(order.id, "delivered");
    toast.success(`${order.distributorName} has been notified of receipt`);
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-1">Order Details</h1>
        <p className="text-xs text-muted-foreground mb-6">{new Date(order.date).toLocaleString()}</p>

        {/* Distributor */}
        <button
          onClick={() => navigate(`/owner/distributor/${order.distributorId}`)}
          className="w-full bg-card rounded-lg p-4 border border-border flex items-center justify-between mb-4 active:opacity-80"
        >
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Distributor</p>
            <p className="text-sm font-semibold text-foreground">{order.distributorName}</p>
          </div>
          <span className="text-xs text-primary">View →</span>
        </button>

        {/* Timeline */}
        {!isDeclined && (
          <div className="bg-card rounded-lg p-4 border border-border mb-4">
            <p className="text-sm font-semibold text-foreground mb-4">Delivery Status</p>
            <div className="space-y-3">
              {STEPS.map((s, idx) => {
                const Icon = s.icon;
                const reached = idx <= stepIndex;
                const isCurrent = idx === stepIndex;
                const isDeliveredStep = s.key === "delivered";
                const canTapDelivered = isDeliveredStep && order.status === "shipped";
                const stepTimestamp =
                  s.key === "pending"
                    ? order.date
                    : s.key === "confirmed"
                      ? order.confirmedAt
                      : s.key === "shipped"
                        ? order.shippedAt
                        : order.deliveredAt;

                const content = (
                  <>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        reached
                          ? isDeliveredStep && order.status === "delivered"
                            ? "bg-success text-background"
                            : isCurrent
                              ? "bg-primary text-primary-foreground"
                              : "bg-success/20 text-success"
                          : canTapDelivered
                            ? "bg-primary/15 text-primary border border-primary border-dashed"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium capitalize ${
                          isDeliveredStep && order.status === "delivered"
                            ? "text-success"
                            : isCurrent
                              ? "text-primary"
                              : reached
                                ? "text-foreground"
                                : canTapDelivered
                                  ? "text-primary"
                                  : "text-muted-foreground"
                        }`}
                      >
                        {s.label}
                        {canTapDelivered && (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-primary">
                            Tap to confirm
                          </span>
                        )}
                      </p>
                      {stepTimestamp && reached && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(stepTimestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </>
                );

                return canTapDelivered ? (
                  <button
                    key={s.key}
                    onClick={() => setConfirmDeliveredOpen(true)}
                    className="w-full flex items-center gap-3 active:opacity-70 text-left"
                  >
                    {content}
                  </button>
                ) : (
                  <div key={s.key} className="flex items-center gap-3">
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isDeclined && (
          <div className="bg-critical/10 border border-critical/30 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-critical">Order declined by distributor</p>
          </div>
        )}

        {/* Items */}
        <h3 className="text-sm font-semibold text-foreground mb-2">Items</h3>
        <div className="space-y-2 mb-4">
          {order.items.map((i, idx) => (
            <div key={idx} className="bg-card rounded-lg p-3 border border-border">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{i.productName}</p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        i.paymentType === "goodwill"
                          ? "bg-warning/10 text-warning"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {i.paymentType === "goodwill" ? "Pay after selling" : "Pay Now"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {i.quantity} × ₦{i.unitPrice.toLocaleString()}
                  </p>
                </div>
                <span className="text-sm font-bold text-foreground">
                  ₦{(i.quantity * i.unitPrice).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Summary */}
        <div className="bg-card rounded-lg p-4 border border-border mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cash Paid</span>
            <span className="text-foreground font-semibold">₦{cashPaid.toLocaleString()}</span>
          </div>
          {goodwill > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-warning">Goodwill (deferred)</span>
              <span className="text-warning font-semibold">₦{goodwill.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-foreground font-semibold">Total Amount</span>
            <span className="text-xl font-bold text-foreground">₦{total.toLocaleString()}</span>
          </div>
        </div>

        {order.status === "shipped" && (
          <button
            onClick={() => setConfirmDeliveredOpen(true)}
            className="w-full h-12 rounded-lg bg-success text-background text-sm font-bold flex items-center justify-center gap-2"
          >
            <PackageCheck className="w-4 h-4" />
            Mark as Received
          </button>
        )}
      </div>

      {/* Confirm Delivered Dialog */}
      <AlertDialog open={confirmDeliveredOpen} onOpenChange={setConfirmDeliveredOpen}>
        <AlertDialogContent className="dark bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Confirm Receipt</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Confirm that you have received this order from {order.distributorName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border bg-background text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleMarkReceived();
                setConfirmDeliveredOpen(false);
              }}
              className="bg-success text-background hover:bg-success/90"
            >
              Confirm Receipt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OwnerOrderDetailPage;
