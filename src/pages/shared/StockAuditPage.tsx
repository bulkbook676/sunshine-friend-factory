import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ClipboardCheck, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { products } from "@/data/mockData";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import DistributorBottomNav from "@/components/DistributorBottomNav";

interface AgentSubmission {
  agentName: string;
  submittedAt: string;
  counts: Record<string, number>;
}

// Mock submissions from agents — represents what agents typed as physical counts.
const mockSubmissions: AgentSubmission[] = [
  {
    agentName: "Chidi Okonkwo",
    submittedAt: "Today · 4:12 PM",
    counts: {
      "1": 245, // matches → green
      "2": 14,  // mismatch (system 18) → red
      "3": 62,  // matches → green
      "4": 40,  // mismatch (system 48) → red
      "5": 5,   // matches → green
      "6": 30,  // matches → green
    },
  },
];

interface Props {
  variant: "owner" | "distributor";
}

const StockAuditPage = ({ variant }: Props) => {
  const navigate = useNavigate();
  const BottomNav = variant === "owner" ? OwnerBottomNav : DistributorBottomNav;
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  const submission = mockSubmissions[0];
  const rows = products.map((p) => {
    const physical = submission?.counts[p.id];
    const hasCount = physical !== undefined;
    const diff = hasCount ? physical - p.currentStock : 0;
    const matches = hasCount && diff === 0;
    return { product: p, physical, hasCount, diff, matches };
  });

  const totalCounted = rows.filter((r) => r.hasCount).length;
  const matched = rows.filter((r) => r.matches).length;
  const discrepancies = rows.filter((r) => r.hasCount && !r.matches).length;
  const selected = rows.find((r) => r.product.id === selectedRow);

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <div className="flex items-center gap-2 mb-1">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Stock Audit</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {submission ? `Last submitted by ${submission.agentName} · ${submission.submittedAt}` : "No submissions yet"}
        </p>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-card rounded-xl p-3 border border-border">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Counted</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{totalCounted}</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-success/30">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Matched</p>
            <p className="text-lg font-bold text-success mt-0.5">{matched}</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-destructive/30">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Discrepancies</p>
            <p className="text-lg font-bold text-destructive mt-0.5">{discrepancies}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-12 px-3 py-2 border-b border-border bg-muted/30">
            <p className="col-span-6 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Product</p>
            <p className="col-span-3 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold text-right">System</p>
            <p className="col-span-3 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold text-right">Physical</p>
          </div>
          {rows.map((r) => {
            const isMatch = r.matches;
            const isMismatch = r.hasCount && !r.matches;
            const tone = isMatch
              ? "text-success"
              : isMismatch
              ? "text-destructive"
              : "text-muted-foreground";
            return (
              <button
                key={r.product.id}
                onClick={() => r.hasCount && setSelectedRow(r.product.id)}
                className={`w-full grid grid-cols-12 items-center px-3 py-3 border-b border-border last:border-0 text-left active:opacity-70 ${
                  isMatch ? "bg-success/5" : isMismatch ? "bg-destructive/5" : ""
                }`}
              >
                <div className="col-span-6 flex items-center gap-2 min-w-0">
                  {isMatch && <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />}
                  {isMismatch && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                  <span className="text-sm text-foreground truncate">{r.product.name}</span>
                </div>
                <span className="col-span-3 text-sm text-foreground text-right tabular-nums">
                  {r.product.currentStock}
                </span>
                <span className={`col-span-3 text-sm font-semibold text-right tabular-nums ${tone}`}>
                  {r.hasCount ? r.physical : "—"}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground mt-3">
          Tap any row to see the full discrepancy breakdown.
        </p>
      </div>

      {/* Detail sheet */}
      {selected && (
        <div
          className="absolute inset-0 z-40 bg-black/60 flex items-end"
          onClick={() => setSelectedRow(null)}
        >
          <div
            className="w-full bg-card rounded-t-2xl border-t border-border p-5 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Product</p>
                <h2 className="text-base font-bold text-foreground">{selected.product.name}</h2>
              </div>
              <button onClick={() => setSelectedRow(null)} className="text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-[10px] uppercase text-muted-foreground">System</p>
                <p className="text-lg font-bold text-foreground">{selected.product.currentStock}</p>
              </div>
              <div
                className={`rounded-lg p-3 ${
                  selected.matches ? "bg-success/10" : "bg-destructive/10"
                }`}
              >
                <p className="text-[10px] uppercase text-muted-foreground">Physical (agent)</p>
                <p
                  className={`text-lg font-bold ${
                    selected.matches ? "text-success" : "text-destructive"
                  }`}
                >
                  {selected.physical}
                </p>
              </div>
            </div>

            {selected.matches ? (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Counts tally — no action needed.
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-destructive text-sm mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Discrepancy: {selected.diff > 0 ? "+" : ""}
                  {selected.diff} {selected.product.sellingUnit}s
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Submitted by {submission?.agentName}. Review whether the missing or extra units came from
                  unrecorded sales, returns, damages, or theft.
                </p>
                <button
                  onClick={() => setSelectedRow(null)}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                >
                  Got it
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default StockAuditPage;