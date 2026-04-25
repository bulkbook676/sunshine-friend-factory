import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, AlertTriangle, Wallet } from "lucide-react";
import { useDistributor } from "@/contexts/DistributorContext";
import DistributorBottomNav from "@/components/DistributorBottomNav";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const DistributorPromiseTrackerPage = () => {
  const navigate = useNavigate();
  const { orders, markGoodwillPaid, recordGoodwillDeposit } = useDistributor();

  const goodwillTotalFor = (o: (typeof orders)[number]) =>
    o.items.filter((i) => i.paymentType === "goodwill").reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const depositsTotalFor = (o: (typeof orders)[number]) =>
    (o.goodwillDeposits ?? []).reduce((s, d) => s + d.amount, 0);
  const outstandingFor = (o: (typeof orders)[number]) =>
    Math.max(0, goodwillTotalFor(o) - depositsTotalFor(o));

  const promises = orders
    .filter(
      (o) =>
        ["confirmed", "shipped", "delivered"].includes(o.status) &&
        o.items.some((i) => i.paymentType === "goodwill") &&
        !o.goodwillPaid
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalOutstanding = promises.reduce((s, o) => s + outstandingFor(o), 0);

  const [depositOpenFor, setDepositOpenFor] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

  const handleMarkPaid = (id: string) => {
    markGoodwillPaid(id);
    toast.success("Marked as paid");
  };

  const submitDeposit = () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (depositOpenFor) {
      const o = promises.find((p) => p.id === depositOpenFor);
      const remaining = o ? outstandingFor(o) : 0;
      if (o && amt > remaining) {
        toast.error(`Amount exceeds outstanding ₦${remaining.toLocaleString()}`);
        return;
      }
      recordGoodwillDeposit(depositOpenFor, amt);
      toast.success(`Deposit of ₦${amt.toLocaleString()} recorded`);
      setDepositOpenFor(null);
      setDepositAmount("");
    }
  };

  const formatTimestamp = (iso: string) =>
    new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-base font-bold text-foreground">Cash In Promise</h1>
          <div className="w-12" />
        </div>

        <div className="text-center mb-6">
          <p className="text-xs text-muted-foreground mb-1">Total Outstanding</p>
          <p className="text-3xl font-bold text-primary">₦{totalOutstanding.toLocaleString()}</p>
        </div>

        {promises.length === 0 ? (
          <div className="text-center py-12">
            <Check className="w-12 h-12 text-success mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No outstanding goodwill orders</p>
          </div>
        ) : (
          <div className="space-y-3">
            {promises.map((o) => {
              const days = daysSince(o.date);
              const borderColor = days > 14 ? "border-critical" : days > 7 ? "border-warning" : "border-border";
              const remaining = outstandingFor(o);
              const goodwillTotal = goodwillTotalFor(o);
              const totalDeposited = depositsTotalFor(o);
              const lastDeposit = o.goodwillDeposits && o.goodwillDeposits.length > 0
                ? o.goodwillDeposits[o.goodwillDeposits.length - 1]
                : null;
              return (
                <div key={o.id} className={`bg-card rounded-xl p-4 border ${borderColor}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        ₦{remaining.toLocaleString()}
                        {totalDeposited > 0 && (
                          <span className="text-xs text-muted-foreground font-normal">
                            {" "}of ₦{goodwillTotal.toLocaleString()}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-foreground mt-0.5">{o.buyerName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {o.items.filter((i) => i.paymentType === "goodwill").map((i) => i.productName).join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {days > 7 && (
                        <AlertTriangle className={`w-3.5 h-3.5 ${days > 14 ? "text-critical" : "text-warning"}`} />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          days > 14 ? "text-critical" : days > 7 ? "text-warning" : "text-muted-foreground"
                        }`}
                      >
                        {days}d ago
                      </span>
                    </div>
                  </div>

                  {lastDeposit && (
                    <p className="text-xs text-success mb-2">
                      Deposited ₦{lastDeposit.amount.toLocaleString()} · {formatTimestamp(lastDeposit.date)}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-2">
                    <p className="text-[10px] text-muted-foreground">{new Date(o.date).toLocaleDateString()}</p>
                    <div className="flex flex-col gap-1.5 items-end">
                      <button
                        onClick={() => handleMarkPaid(o.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success text-primary-foreground text-xs font-medium"
                      >
                        <Check className="w-3 h-3" />
                        Mark as Paid
                      </button>
                      <button
                        onClick={() => {
                          setDepositOpenFor(o.id);
                          setDepositAmount("");
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/30"
                      >
                        <Wallet className="w-3 h-3" />
                        Record Deposit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!depositOpenFor} onOpenChange={(o) => !o && setDepositOpenFor(null)}>
        <DialogContent className="dark bg-card border-border max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">How much did they deposit?</DialogTitle>
          </DialogHeader>
          <div className="relative mt-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
            <input
              type="number"
              autoFocus
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full h-12 pl-7 pr-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <button
              onClick={() => setDepositOpenFor(null)}
              className="px-4 h-10 rounded-lg border border-border text-foreground text-sm"
            >
              Cancel
            </button>
            <button
              onClick={submitDeposit}
              className="px-4 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
            >
              Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DistributorBottomNav />
    </div>
  );
};

export default DistributorPromiseTrackerPage;