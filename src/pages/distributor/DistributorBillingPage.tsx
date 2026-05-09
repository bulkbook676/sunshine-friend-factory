import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Plus, Trash2, Download } from "lucide-react";
import DistributorBottomNav from "@/components/DistributorBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSubscriptions,
  cancelSubscription,
  renewSubscription,
  getPaymentHistory,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  getPendingRenewals,
} from "@/data/subAccountStore";
import { toast } from "sonner";

const DistributorBillingPage = () => {
  const navigate = useNavigate();
  const { businessName } = useAuth();
  const businessId = `dist-${businessName || "default"}`;
  const [, forceTick] = useState(0);
  const refresh = () => forceTick((n) => n + 1);

  const [methodModal, setMethodModal] = useState(false);
  const [methodType, setMethodType] = useState<"card" | "bank">("card");
  const [last4, setLast4] = useState("");
  const [label, setLabel] = useState("");

  const subs = getSubscriptions(businessId);
  const pending = getPendingRenewals(businessId);
  const history = getPaymentHistory(businessId);
  const methods = getPaymentMethods(businessId);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

  const downloadReceipt = (id: string, amount: number, date: string) => {
    const text = `Bulkbook Receipt\nID: ${id}\nDate: ${fmtDate(date)}\nAmount: ₦${amount.toLocaleString()}\n`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddMethod = () => {
    if (last4.length !== 4 || !/^\d{4}$/.test(last4))
      return toast.error("Enter the last 4 digits");
    if (!label.trim()) return toast.error("Add a label");
    addPaymentMethod(businessId, { type: methodType, last4, label: label.trim() });
    setMethodModal(false);
    setLast4("");
    setLabel("");
    toast.success("Payment method added");
    refresh();
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-lg font-bold text-foreground mb-6">Payments and Plans</h1>

        {/* Plan */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-5">
          <p className="text-xs text-muted-foreground mb-1">Current plan</p>
          <p className="text-base font-bold text-foreground">Distributor Pro</p>
          <p className="text-xs text-muted-foreground mt-1">Listing, orders, goodwill, and analytics included</p>
        </div>

        {/* Subscriptions */}
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
          Active Subscriptions
        </h3>
        {subs.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-5">No active subscriptions.</p>
        ) : (
          <div className="space-y-2 mb-5">
            {subs.map((s) => (
              <div key={s.id} className="bg-card rounded-2xl p-3 border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.agentName}</p>
                  <p className="text-xs text-muted-foreground">Renews {fmtDate(s.nextRenewal)}</p>
                </div>
                <button
                  onClick={() => {
                    cancelSubscription(businessId, s.id);
                    toast.success("Subscription cancelled");
                    refresh();
                  }}
                  className="text-xs text-critical font-medium px-2 py-1 rounded hover:bg-critical/10"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pending renewals */}
        {pending.length > 0 && (
          <>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
              Pending Renewals
            </h3>
            <div className="space-y-2 mb-5">
              {pending.map((s) => (
                <div key={s.id} className="bg-card rounded-2xl p-3 border border-warning/40 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.agentName}</p>
                    <p className="text-xs text-warning">Due {fmtDate(s.nextRenewal)}</p>
                  </div>
                  <button
                    onClick={() => {
                      renewSubscription(businessId, s.id);
                      toast.success("Renewed");
                      refresh();
                    }}
                    className="text-xs text-primary font-medium px-2 py-1 rounded hover:bg-primary/10"
                  >
                    Renew
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Payment history */}
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
          Payment History
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-5">No payments yet.</p>
        ) : (
          <div className="space-y-2 mb-5">
            {history.map((p) => (
              <div key={p.id} className="bg-card rounded-2xl p-3 border border-border flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.description}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(p.date)} • ₦{p.amount.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => downloadReceipt(p.id, p.amount, p.date)}
                  className="text-muted-foreground"
                  aria-label="Download receipt"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Methods */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            Payment Methods
          </h3>
          <button
            onClick={() => setMethodModal(true)}
            className="text-xs text-primary font-medium flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        {methods.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payment methods.</p>
        ) : (
          <div className="space-y-2 mb-5">
            {methods.map((m) => (
              <div key={m.id} className="bg-card rounded-2xl p-3 border border-border flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.type === "card" ? "Card" : "Bank"} •••• {m.last4}</p>
                </div>
                <button
                  onClick={() => {
                    removePaymentMethod(businessId, m.id);
                    toast.success("Removed");
                    refresh();
                  }}
                  className="text-muted-foreground"
                  aria-label="Remove method"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add method modal */}
      {methodModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
          <div className="w-full max-w-[430px] bg-card rounded-t-2xl p-5 border-t border-border">
            <h3 className="text-base font-bold text-foreground mb-4">Add payment method</h3>
            <div className="flex gap-2 mb-3">
              {(["card", "bank"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setMethodType(t)}
                  className={`flex-1 h-10 rounded-lg text-sm font-medium capitalize ${
                    methodType === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={methodType === "card" ? "Card label (e.g. Visa)" : "Bank name"}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground mb-2"
            />
            <input
              value={last4}
              maxLength={4}
              inputMode="numeric"
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
              placeholder="Last 4 digits"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setMethodModal(false)}
                className="flex-1 h-11 rounded-lg border border-border text-foreground text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMethod}
                className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-bold"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <DistributorBottomNav />
    </div>
  );
};

export default DistributorBillingPage;
