import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, AlertTriangle, Wallet } from "lucide-react";
import { useSales } from "@/contexts/SalesContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const PromiseTrackerPage = () => {
  const navigate = useNavigate();
  const { getPromiseSales, markPromisePaid, getCashInPromise, recordPromiseDeposit, getOutstanding, getDepositsTotal } =
    useSales();
  const promises = getPromiseSales().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const totalOutstanding = getCashInPromise();

  const [depositOpenFor, setDepositOpenFor] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  const getDaysOutstanding = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    return Math.floor(diff / 86400000);
  };

  const handleMarkPaid = (id: string) => {
    markPromisePaid(id);
    toast.success("Marked as paid — moved to Money you've already collected");
  };

  const openDeposit = (id: string) => {
    setDepositOpenFor(id);
    setDepositAmount("");
  };

  const submitDeposit = () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (depositOpenFor) {
      const sale = promises.find((s) => s.id === depositOpenFor);
      const remaining = sale ? getOutstanding(sale) : 0;
      if (sale && amt > remaining) {
        toast.error(`Amount exceeds outstanding ₦${remaining.toLocaleString()}`);
        return;
      }
      recordPromiseDeposit(depositOpenFor, amt);
      toast.success(`Deposit of ₦${amt.toLocaleString()} recorded`);
      setDepositOpenFor(null);
      setDepositAmount("");
    }
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-base font-bold text-foreground">Money owed to you</h1>
          <div className="w-12" />
        </div>

        <div className="text-center mb-6">
          <p className="text-xs text-muted-foreground mb-1">Total Owed to You</p>
          <p className="text-3xl font-bold text-primary">₦{totalOutstanding.toLocaleString()}</p>
        </div>

        {promises.length === 0 ? (
          <div className="text-center py-12">
            <Check className="w-12 h-12 text-success mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No outstanding promises</p>
          </div>
        ) : (
          <div className="space-y-3">
            {promises.map((s) => {
              const days = getDaysOutstanding(s.date);
              const borderColor = days > 14 ? "border-critical" : days > 7 ? "border-warning" : "border-border";
              const remaining = getOutstanding(s);
              const totalDeposited = getDepositsTotal(s);
              const lastDeposit = s.deposits && s.deposits.length > 0 ? s.deposits[s.deposits.length - 1] : null;
              return (
                <div key={s.id} className={`bg-card rounded-xl p-4 border ${borderColor}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        ₦{remaining.toLocaleString()}
                        {totalDeposited > 0 && (
                          <span className="text-xs text-muted-foreground font-normal">
                            {" "}
                            of ₦{s.total.toLocaleString()}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.items.map((i) => i.name).join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {days > 7 && (
                        <AlertTriangle
                          className={`w-3.5 h-3.5 ${days > 14 ? "text-critical" : "text-warning"}`}
                        />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          days > 14
                            ? "text-critical"
                            : days > 7
                              ? "text-warning"
                              : "text-muted-foreground"
                        }`}
                      >
                        {days}d ago
                      </span>
                    </div>
                  </div>

                  {lastDeposit ? (
                    <p className="text-xs text-success mb-2">
                      Deposited ₦{lastDeposit.amount.toLocaleString()} · {formatTimestamp(lastDeposit.date)}
                    </p>
                  ) : (
                    s.customerNote && <p className="text-xs text-primary mb-2">"{s.customerNote}"</p>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-2">
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(s.date).toLocaleDateString()}
                    </p>
                    <div className="flex flex-col gap-1.5 items-end">
                      <button
                        onClick={() => handleMarkPaid(s.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success text-primary-foreground text-xs font-medium"
                      >
                        <Check className="w-3 h-3" />
                        They've Paid
                      </button>
                      <button
                        onClick={() => openDeposit(s.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/30"
                      >
                        <Wallet className="w-3 h-3" />
                        Deposit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deposit dialog */}
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
              placeholder="e.g. 500"
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

      <OwnerBottomNav />
    </div>
  );
};

export default PromiseTrackerPage;
