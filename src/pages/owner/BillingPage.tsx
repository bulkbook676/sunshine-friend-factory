import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Building2,
  Plus,
  X,
  Download,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { toast } from "sonner";
import {
  FREE_AGENT_SLOTS,
  getSubscriptions,
  getPaidSlotCount,
  getTotalAgentSlots,
  cancelSubscription,
  renewSubscription,
  getPendingRenewals,
  getPaymentHistory,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
} from "@/data/subAccountStore";

/**
 * Settings → Billing.
 * Mock UI — no real payment processing. State lives in subAccountStore.
 */
const BillingPage = () => {
  const navigate = useNavigate();
  const { businessName } = useAuth();
  const businessId = businessName || "default-business";

  // Force re-render after store mutations (mock store is not reactive)
  const [, forceTick] = useState(0);
  const refresh = () => forceTick((n) => n + 1);

  const subs = getSubscriptions(businessId);
  const activeSubs = subs.filter((s) => s.status === "active");
  const pendingRenewals = getPendingRenewals(businessId, 7);
  const totalSlots = getTotalAgentSlots(businessId);
  const paidCount = getPaidSlotCount(businessId);
  const history = getPaymentHistory(businessId);
  const methods = getPaymentMethods(businessId);

  const planName = paidCount > 0 ? "Paid" : "Free";
  const renewalDate = activeSubs[0]?.nextRenewal;

  const [showAddMethod, setShowAddMethod] = useState(false);
  const [methodType, setMethodType] = useState<"card" | "bank">("card");
  const [methodLast4, setMethodLast4] = useState("");
  const [methodLabel, setMethodLabel] = useState("");

  const handleCancel = (id: string) => {
    cancelSubscription(businessId, id);
    toast.success("Subscription cancelled");
    refresh();
  };

  const handleRenew = (id: string) => {
    renewSubscription(businessId, id);
    toast.success("Subscription renewed");
    refresh();
  };

  const handleAddMethod = () => {
    const last4 = methodLast4.replace(/\D/g, "").slice(-4);
    if (last4.length !== 4) {
      toast.error("Enter the last 4 digits");
      return;
    }
    if (!methodLabel.trim()) {
      toast.error("Add a label");
      return;
    }
    addPaymentMethod(businessId, {
      type: methodType,
      last4,
      label: methodLabel.trim(),
    });
    toast.success("Payment method added");
    setMethodLast4("");
    setMethodLabel("");
    setShowAddMethod(false);
    refresh();
  };

  const handleRemoveMethod = (id: string) => {
    removePaymentMethod(businessId, id);
    toast.success("Payment method removed");
    refresh();
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const downloadReceipt = (id: string, amount: number, date: string) => {
    const text = [
      "Bulkbook Receipt",
      "----------------",
      `Receipt ID: ${id}`,
      `Date: ${fmtDate(date)}`,
      `Amount: ₦${amount.toLocaleString()}`,
      `Business: ${businessName || "—"}`,
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulkbook-receipt-${id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-lg font-bold text-foreground mb-6">Payments and Plans</h1>

        {/* Current plan */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
            Current plan
          </p>
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-xl font-bold text-foreground">{planName}</p>
            <p className="text-xs text-muted-foreground">
              {totalSlots} agent slot{totalSlots > 1 ? "s" : ""}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {FREE_AGENT_SLOTS} free + {paidCount} paid
          </p>
          {renewalDate && (
            <p className="text-xs text-muted-foreground mt-1">
              Next renewal: {fmtDate(renewalDate)}
            </p>
          )}
        </div>

        {/* Active subscriptions */}
        <div className="mb-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
            Active subscriptions
          </p>
          {activeSubs.length === 0 ? (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-sm text-muted-foreground">
                No paid subscriptions yet.
              </p>
              <button
                onClick={() => navigate("/owner/billing/unlock-agents")}
                className="text-xs text-primary font-medium mt-2"
              >
                + Add agent slots
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {activeSubs.map((s) => (
                <div
                  key={s.id}
                  className="bg-card rounded-2xl p-3 border border-border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {s.agentName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ₦{s.monthlyCost.toLocaleString()}/mo · renews{" "}
                        {fmtDate(s.nextRenewal)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancel(s.id)}
                      className="text-xs text-critical font-medium ml-3"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending renewals */}
        {pendingRenewals.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
              Pending renewals
            </p>
            <div className="space-y-2">
              {pendingRenewals.map((s) => (
                <div
                  key={s.id}
                  className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0" />
                      <p className="text-sm font-medium text-foreground truncate">
                        {s.agentName}
                      </p>
                    </div>
                    <p className="text-xs text-warning mt-0.5">
                      Due {fmtDate(s.nextRenewal)} · ₦
                      {s.monthlyCost.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRenew(s.id)}
                    className="text-xs font-bold text-warning ml-3 px-3 py-1.5 rounded-md bg-warning/20"
                  >
                    Renew Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment history */}
        <div className="mb-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
            Payment history
          </p>
          {history.length === 0 ? (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((p) => (
                <div
                  key={p.id}
                  className="bg-card rounded-2xl p-3 border border-border flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {p.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(p.date)} · ₦{p.amount.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadReceipt(p.id, p.amount, p.date)}
                    className="ml-3 text-primary"
                    aria-label="Download receipt"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment methods */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Payment methods
            </p>
            <button
              onClick={() => setShowAddMethod(true)}
              className="text-xs text-primary font-medium flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          {methods.length === 0 ? (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-sm text-muted-foreground">
                No payment methods saved.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {methods.map((m) => (
                <div
                  key={m.id}
                  className="bg-card rounded-2xl p-3 border border-border flex items-center gap-3"
                >
                  {m.type === "card" ? (
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {m.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ····{m.last4}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveMethod(m.id)}
                    className="text-muted-foreground"
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add payment method modal */}
      {showAddMethod && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="bg-card rounded-2xl p-5 border border-border w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">
                Add payment method
              </h2>
              <button
                onClick={() => setShowAddMethod(false)}
                className="text-muted-foreground"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setMethodType("card")}
                className={`p-2.5 rounded-lg border text-sm font-medium ${
                  methodType === "card"
                    ? "bg-primary/10 border-primary text-foreground"
                    : "bg-muted border-border text-muted-foreground"
                }`}
              >
                Card
              </button>
              <button
                onClick={() => setMethodType("bank")}
                className={`p-2.5 rounded-lg border text-sm font-medium ${
                  methodType === "bank"
                    ? "bg-primary/10 border-primary text-foreground"
                    : "bg-muted border-border text-muted-foreground"
                }`}
              >
                Bank
              </button>
            </div>
            <input
              type="text"
              value={methodLabel}
              onChange={(e) => setMethodLabel(e.target.value)}
              placeholder={
                methodType === "card" ? "e.g. Visa personal" : "e.g. GTBank business"
              }
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground mb-2"
            />
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={methodLast4}
              onChange={(e) =>
                setMethodLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="Last 4 digits"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground mb-4"
            />
            <button
              onClick={handleAddMethod}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
            >
              Save method
            </button>
          </div>
        </div>
      )}

      <OwnerBottomNav />
    </div>
  );
};

export default BillingPage;