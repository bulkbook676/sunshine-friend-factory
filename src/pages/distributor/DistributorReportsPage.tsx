import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  addMonths,
  startOfMonth,
  endOfMonth,
  isSameDay,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { useDistributor } from "@/contexts/DistributorContext";
import DistributorBottomNav from "@/components/DistributorBottomNav";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type Period = "daily" | "weekly" | "monthly";

const DistributorReportsPage = () => {
  const navigate = useNavigate();
  const { orders, products, ownSales, ownExpenses } = useDistributor();
  const [period, setPeriod] = useState<Period>("daily");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());

  // Compute date range for selected period
  const range = useMemo(() => {
    if (period === "daily") {
      const start = new Date(anchorDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(anchorDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (period === "weekly") {
      return {
        start: startOfWeek(anchorDate, { weekStartsOn: 1 }),
        end: endOfWeek(anchorDate, { weekStartsOn: 1 }),
      };
    }
    return { start: startOfMonth(anchorDate), end: endOfMonth(anchorDate) };
  }, [period, anchorDate]);

  const inRange = (iso: string) => {
    try {
      return isWithinInterval(parseISO(iso), range);
    } catch {
      return false;
    }
  };

  // Confirmed incoming orders + own counter sales within range
  const confirmedOrders = orders.filter(
    (o) => o.status === "confirmed" && inRange(o.date)
  );
  const periodOwnSales = ownSales.filter((s) => inRange(s.date));
  const periodExpenses = ownExpenses.filter((e) => inRange(e.date));

  const orderRevenue = confirmedOrders.reduce(
    (s, o) => s + o.items.reduce((ss, i) => ss + i.qty * i.unitPrice, 0),
    0
  );
  const ownSalesRevenue = periodOwnSales.reduce((s, x) => s + x.total, 0);
  const totalRevenue = orderRevenue + ownSalesRevenue;

  // Cost of goods sold = sum of cost price * qty across both order items + own sales
  const orderCOGS = confirmedOrders.reduce(
    (s, o) =>
      s +
      o.items.reduce((ss, i) => {
        const p = products.find((pp) => pp.id === i.productId);
        return ss + (p?.costPrice ?? 0) * i.qty;
      }, 0),
    0
  );
  const ownCOGS = periodOwnSales.reduce(
    (s, x) =>
      s +
      x.items.reduce((ss, i) => {
        const p = products.find((pp) => pp.id === i.productId);
        return ss + (p?.costPrice ?? 0) * i.qty;
      }, 0),
    0
  );
  const cogs = orderCOGS + ownCOGS;
  const expenseTotal = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const totalCost = cogs + expenseTotal;
  const netProfit = totalRevenue - totalCost;

  // Top products (units sold across all order/own sale items in range)
  const productUnits = new Map<string, { name: string; qty: number }>();
  confirmedOrders.forEach((o) =>
    o.items.forEach((i) => {
      const cur = productUnits.get(i.productId) ?? { name: i.productName, qty: 0 };
      cur.qty += i.qty;
      productUnits.set(i.productId, cur);
    })
  );
  periodOwnSales.forEach((x) =>
    x.items.forEach((i) => {
      const cur = productUnits.get(i.productId) ?? { name: i.productName, qty: 0 };
      cur.qty += i.qty;
      productUnits.set(i.productId, cur);
    })
  );
  const topProducts = [...productUnits.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 3);

  // Goodwill repayment tracker — confirmed orders that include goodwill items and not fully paid
  const goodwillEntries = orders
    .filter((o) => o.status === "confirmed" && !o.goodwillPaid)
    .flatMap((o) => {
      const items = o.items.filter((i) => i.paymentType === "goodwill");
      if (items.length === 0) return [];
      const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
      const deposited =
        o.goodwillDeposits?.reduce((s, d) => s + d.amount, 0) ?? 0;
      const outstanding = Math.max(0, total - deposited);
      const dueInDays =
        30 -
        Math.floor(
          (Date.now() - new Date(o.date).getTime()) / (1000 * 60 * 60 * 24)
        );
      return [
        {
          orderId: o.id,
          buyerId: o.buyerId,
          buyerName: o.buyerName,
          summary: items.map((i) => i.productName).join(", "),
          outstanding,
          total,
          dueInDays,
          progressPct: Math.min(100, Math.round((deposited / (total || 1)) * 100)),
        },
      ];
    });

  // Range navigation
  const goPrev = () => {
    if (period === "daily") setAnchorDate((d) => addDays(d, -1));
    else if (period === "weekly") setAnchorDate((d) => addWeeks(d, -1));
    else setAnchorDate((d) => addMonths(d, -1));
  };
  const goNext = () => {
    if (period === "daily") setAnchorDate((d) => addDays(d, 1));
    else if (period === "weekly") setAnchorDate((d) => addWeeks(d, 1));
    else setAnchorDate((d) => addMonths(d, 1));
  };
  const isAtPresent =
    period === "daily"
      ? isSameDay(anchorDate, new Date())
      : period === "weekly"
        ? endOfWeek(anchorDate, { weekStartsOn: 1 }) >= new Date()
        : endOfMonth(anchorDate) >= new Date();

  const rangeLabel = useMemo(() => {
    if (period === "daily") {
      return isSameDay(anchorDate, new Date()) ? "Today" : format(anchorDate, "EEE, MMM d");
    }
    if (period === "weekly") {
      const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
      const end = endOfWeek(anchorDate, { weekStartsOn: 1 });
      return `${format(start, "MMM d")} — ${format(end, "MMM d")}`;
    }
    return format(anchorDate, "MMMM yyyy");
  }, [period, anchorDate]);

  const summary = useMemo(() => {
    if (totalRevenue === 0) {
      return `No sales recorded for ${rangeLabel.toLowerCase()}. Confirm orders or record counter sales to see performance.`;
    }
    const top = topProducts[0];
    if (period === "daily") {
      return `Moved ₦${totalRevenue.toLocaleString()} across ${
        confirmedOrders.length + periodOwnSales.length
      } transactions today.${top ? ` ${top.name} led with ${top.qty} units.` : ""}`;
    }
    if (period === "weekly") {
      return `This week brought in ₦${totalRevenue.toLocaleString()} on ${
        confirmedOrders.length + periodOwnSales.length
      } transactions.${top ? ` Top mover: ${top.name}.` : ""}`;
    }
    return `Month-to-date revenue is ₦${totalRevenue.toLocaleString()} with ${
      confirmedOrders.length + periodOwnSales.length
    } transactions.${top ? ` ${top.name} dominates with ${top.qty} units.` : ""}`;
  }, [period, totalRevenue, topProducts, confirmedOrders.length, periodOwnSales.length, rangeLabel]);

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-5">
        <h1 className="text-lg font-bold text-foreground mb-4">Reports</h1>

        {/* Period type toggle */}
        <div className="flex rounded-lg bg-muted p-1 mb-4">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 h-9 rounded-md text-[11px] font-medium transition-colors capitalize ${
                period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => navigate("/distributor/reports/goodwill")}
            className="flex-1 h-9 rounded-md text-[11px] font-medium text-muted-foreground"
          >
            Goodwill Tracker
          </button>
        </div>

        {/* Range navigation */}
        <div className="flex items-center justify-between bg-card rounded-lg p-3 border border-border mb-4">
          <button
            onClick={goPrev}
            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-muted/50">
                <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{rangeLabel}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={anchorDate}
                onSelect={(d) => d && setAnchorDate(d)}
                disabled={(d) => d > new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <button
            onClick={goNext}
            disabled={isAtPresent}
            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center disabled:opacity-30"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Summary</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{summary}</p>
        </div>

        {/* Revenue & Cost cards */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={() => navigate(`/distributor/reports/revenue?period=${period}`)}
            className="bg-card rounded-lg p-4 border border-border text-left active:opacity-80 transition-opacity"
          >
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-xl font-bold text-success">₦{totalRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-primary mt-1">Tap for breakdown →</p>
          </button>
          <button
            onClick={() => navigate(`/distributor/reports/cost?period=${period}`)}
            className="bg-card rounded-lg p-4 border border-border text-left active:opacity-80 transition-opacity"
          >
            <p className="text-xs text-muted-foreground">Cost</p>
            <p className="text-xl font-bold text-foreground">₦{Math.round(totalCost).toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Incl. ₦{expenseTotal.toLocaleString()} expenses
            </p>
            <p className="text-[10px] text-primary mt-0.5">Tap for breakdown →</p>
          </button>
        </div>

        {/* Net Profit card */}
        <button
          onClick={() => navigate(`/distributor/reports/profit?period=${period}`)}
          className="w-full bg-card rounded-lg p-4 border border-border text-left active:opacity-80 transition-opacity mb-4"
        >
          <p className="text-xs text-muted-foreground">Net Profit</p>
          <p className={`text-xl font-bold ${netProfit >= 0 ? "text-success" : "text-critical"}`}>
            ₦{Math.abs(Math.round(netProfit)).toLocaleString()}
            {netProfit < 0 && " (loss)"}
          </p>
          <p className={`text-[10px] mt-1 ${netProfit >= 0 ? "text-success" : "text-critical"}`}>
            {netProfit >= 0 ? "You are in profit" : "You are currently at a loss"}
          </p>
          <p className="text-[10px] text-primary mt-0.5">Tap for breakdown →</p>
        </button>

        {/* Top products */}
        {topProducts.length > 0 && (
          <div className="bg-card rounded-lg p-4 border border-border mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Top Products</h3>
            {topProducts.map((p, i) => (
              <div
                key={p.name}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">#{i + 1}</span>
                  <span className="text-sm text-foreground">{p.name.split("(")[0].trim()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-success" />
                  <span className="text-sm font-semibold text-foreground">{p.qty}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Goodwill Repayment Tracker */}
        {goodwillEntries.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Businesses Due for Repayment
            </h3>
            <div className="space-y-3 mb-6">
              {goodwillEntries.map((g) => {
                const status =
                  g.dueInDays < 0 ? "overdue" : g.dueInDays <= 7 ? "warning" : "good";
                const colorClass =
                  status === "overdue"
                    ? "text-critical bg-critical/10"
                    : status === "warning"
                      ? "text-warning bg-warning/10"
                      : "text-success bg-success/10";
                return (
                  <button
                    key={g.orderId}
                    onClick={() => navigate("/distributor/promises")}
                    className="w-full bg-card rounded-lg p-4 border border-border text-left active:opacity-80"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-foreground">
                        {g.buyerName}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${colorClass}`}
                      >
                        {g.dueInDays < 0
                          ? `${-g.dueInDays}d overdue`
                          : `${g.dueInDays}d left`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">{g.summary}</span>
                      <span className="text-foreground font-medium">
                        ₦{g.outstanding.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">Repaid</span>
                        <span className="text-foreground">{g.progressPct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-success"
                          style={{ width: `${g.progressPct}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorReportsPage;
