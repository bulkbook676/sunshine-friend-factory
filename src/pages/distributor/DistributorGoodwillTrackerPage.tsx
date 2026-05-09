import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { useDistributor } from "@/contexts/DistributorContext";
import DistributorBottomNav from "@/components/DistributorBottomNav";

type Filter = "all" | "ontrack" | "duesoon" | "overdue";

/**
 * Goodwill Product Tracker — distributor view.
 * Aggregates per-product, per-buyer goodwill stock sent vs sold.
 * Sales data is mocked (would come from owner sales records via backend).
 */
const DistributorGoodwillTrackerPage = () => {
  const navigate = useNavigate();
  const { orders, products } = useDistributor();
  const [filter, setFilter] = useState<Filter>("all");

  const cards = useMemo(() => {
    type Card = {
      key: string;
      productId: string;
      productName: string;
      buyerId: string;
      buyerName: string;
      qtySent: number;
      qtySold: number;
      qtyRemaining: number;
      sellThroughPct: number;
      repaymentDate: Date;
      daysRemaining: number;
      status: "ontrack" | "duesoon" | "overdue";
      paymentTotal: number;
      orderId: string;
    };
    const list: Card[] = [];
    orders
      .filter((o) => o.status === "confirmed" && !o.goodwillPaid)
      .forEach((o) => {
        const goodwillItems = o.items.filter((i) => i.paymentType === "goodwill");
        if (goodwillItems.length === 0) return;
        // Repayment days from product or default 30
        goodwillItems.forEach((item) => {
          const product = products.find((p) => p.id === item.productId);
          const repaymentDays = product?.goodwillRepaymentDays ?? 30;
          const orderDate = new Date(o.date);
          const repaymentDate = new Date(orderDate.getTime() + repaymentDays * 86400000);
          const daysRemaining = Math.ceil(
            (repaymentDate.getTime() - Date.now()) / 86400000,
          );
          // Mock sold quantity — pseudo-random but stable per item.
          const seed = (item.productId + o.id).split("").reduce((s, c) => s + c.charCodeAt(0), 0);
          const soldRatio = ((seed % 70) + 10) / 100; // 10–80%
          const qtySold = Math.min(item.qty, Math.floor(item.qty * soldRatio));
          const qtyRemaining = item.qty - qtySold;
          const sellThroughPct = item.qty > 0 ? Math.round((qtySold / item.qty) * 100) : 0;
          const status: Card["status"] =
            daysRemaining < 0 ? "overdue" : daysRemaining <= 14 ? "duesoon" : "ontrack";
          list.push({
            key: `${o.id}-${item.productId}`,
            productId: item.productId,
            productName: item.productName,
            buyerId: o.buyerId,
            buyerName: o.buyerName,
            qtySent: item.qty,
            qtySold,
            qtyRemaining,
            sellThroughPct,
            repaymentDate,
            daysRemaining,
            status,
            paymentTotal: item.qty * item.unitPrice,
            orderId: o.id,
          });
        });
      });
    return list;
  }, [orders, products]);

  const filtered = cards.filter((c) => filter === "all" || c.status === filter);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "ontrack", label: "Paying on time" },
    { key: "duesoon", label: "Pay back soon" },
    { key: "overdue", label: "Late — follow up" },
  ];

  const statusColor = (s: "ontrack" | "duesoon" | "overdue") =>
    s === "overdue"
      ? "text-critical bg-critical/10"
      : s === "duesoon"
        ? "text-warning bg-warning/10"
        : "text-success bg-success/10";

  const barColor = (s: "ontrack" | "duesoon" | "overdue") =>
    s === "overdue" ? "bg-critical" : s === "duesoon" ? "bg-warning" : "bg-success";

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-lg font-bold text-foreground mb-1">Goodwill Product Tracker</h1>
        <p className="text-xs text-muted-foreground mb-4">
          Track repayment progress on products you've sent on goodwill terms
        </p>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {cards.length === 0
                ? "No goodwill products tracked yet. Send products on goodwill terms to see tracking here."
                : "No products match this filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <div key={c.key} className="bg-card rounded-2xl p-4 border border-border">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {c.productName}
                    </p>
                    <button
                      onClick={() => navigate(`/distributor/owner/${c.buyerId}`)}
                      className="text-xs text-primary underline-offset-2 hover:underline truncate block max-w-full text-left"
                    >
                      {c.buyerName}
                    </button>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${statusColor(c.status)}`}>
                    {c.status === "overdue"
                      ? `${-c.daysRemaining}d overdue`
                      : `${c.daysRemaining}d left`}
                  </span>
                </div>

                {/* Quantities */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-[10px] text-muted-foreground">Sent</p>
                    <p className="text-sm font-bold text-foreground">{c.qtySent}</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-[10px] text-muted-foreground">Sold</p>
                    <p className="text-sm font-bold text-success">{c.qtySold}</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-[10px] text-muted-foreground">Remaining</p>
                    <p className="text-sm font-bold text-foreground">{c.qtyRemaining}</p>
                  </div>
                </div>

                {/* How much has been sold */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">How much has been sold</span>
                    <span className="text-foreground font-medium">{c.sellThroughPct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${barColor(c.status)}`}
                      style={{ width: `${c.sellThroughPct}%` }}
                    />
                  </div>
                </div>

                {/* Pay back by */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Repayment due</span>
                  <span className="text-foreground font-medium">
                    {c.repaymentDate.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorGoodwillTrackerPage;