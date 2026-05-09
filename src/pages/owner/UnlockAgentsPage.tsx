import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, CreditCard, Building2, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { toast } from "sonner";
import {
  AGENT_SLOT_PRICE_NGN,
  addSubscriptions,
  getPaidSlotCount,
} from "@/data/subAccountStore";

/**
 * Single full-screen subscription page shown when the owner tries to authorize
 * a second agent and their free slot is already used.
 *
 * Mock UI only — no real payment processing.
 */
const UnlockAgentsPage = () => {
  const navigate = useNavigate();
  const { businessName } = useAuth();
  const businessId = businessName || "default-business";

  const [count, setCount] = useState(1);
  const [method, setMethod] = useState<"card" | "transfer">("card");
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(() => count * AGENT_SLOT_PRICE_NGN, [count]);
  const currentPaid = getPaidSlotCount(businessId);

  const dec = () => setCount((c) => Math.max(1, c - 1));
  const inc = () => setCount((c) => Math.min(99, c + 1));

  const subscribe = () => {
    if (submitting) return;
    setSubmitting(true);
    // Simulate network latency for the mock flow
    setTimeout(() => {
      addSubscriptions(businessId, count);
      toast.success(
        `Subscribed — ${count} additional slot${count > 1 ? "s" : ""} unlocked`,
      );
      navigate("/owner/agents");
    }, 600);
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Unlock More Agents
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Your free plan includes 1 authorized agent. Add more for{" "}
          <span className="text-foreground font-semibold">
            ₦{AGENT_SLOT_PRICE_NGN.toLocaleString()}/month
          </span>{" "}
          per agent.
        </p>

        {currentPaid > 0 && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-5">
            <p className="text-xs text-primary">
              You currently have {currentPaid} paid slot
              {currentPaid > 1 ? "s" : ""} active.
            </p>
          </div>
        )}

        {/* Quantity selector */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
            Additional slots
          </p>
          <div className="flex items-center justify-between">
            <button
              onClick={dec}
              disabled={count <= 1}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center disabled:opacity-40"
              aria-label="Decrease"
            >
              <Minus className="w-4 h-4 text-foreground" />
            </button>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground tabular-nums">
                {count}
              </p>
              <p className="text-[10px] text-muted-foreground">
                agent{count > 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={inc}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
              aria-label="Increase"
            >
              <Plus className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>

        {/* Total */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total monthly cost</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              ₦{total.toLocaleString()}
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground">/month</p>
        </div>

        {/* Payment method */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
            Payment method
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMethod("card")}
              className={`p-3 rounded-lg border flex items-center gap-2 ${
                method === "card"
                  ? "bg-primary/10 border-primary"
                  : "bg-card border-border"
              }`}
            >
              <CreditCard className="w-4 h-4 text-foreground" />
              <span className="text-sm font-medium text-foreground">Card</span>
              {method === "card" && (
                <Check className="w-3 h-3 text-primary ml-auto" />
              )}
            </button>
            <button
              onClick={() => setMethod("transfer")}
              className={`p-3 rounded-lg border flex items-center gap-2 ${
                method === "transfer"
                  ? "bg-primary/10 border-primary"
                  : "bg-card border-border"
              }`}
            >
              <Building2 className="w-4 h-4 text-foreground" />
              <span className="text-sm font-medium text-foreground">
                Transfer
              </span>
              {method === "transfer" && (
                <Check className="w-3 h-3 text-primary ml-auto" />
              )}
            </button>
          </div>
        </div>

        <button
          onClick={subscribe}
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60"
        >
          {submitting ? "Processing…" : "Subscribe"}
        </button>
        <p className="text-[10px] text-muted-foreground text-center mt-3">
          You can cancel any active slot at any time from Billing.
        </p>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default UnlockAgentsPage;