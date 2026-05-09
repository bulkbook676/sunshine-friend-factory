import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { products } from "@/data/mockData";
import { useExpenses } from "@/contexts/ExpensesContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, endOfWeek, addDays, addWeeks, addMonths, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

type Period = "daily" | "weekly" | "monthly";

const ReportsPage = () => {
  const navigate = useNavigate();
  const { expenses } = useExpenses();
  const [period, setPeriod] = useState<Period>("daily");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());

  // Pick a deterministic salesHistory index based on the anchor date so the
  // mock numbers shift as the user navigates. Real data would be queried by
  // the actual date range.
  const idx = useMemo(() => {
    const dayOffset = Math.floor((Date.now() - anchorDate.getTime()) / 86400000);
    return Math.max(0, Math.min(6, 6 - (dayOffset % 7 + 7) % 7));
  }, [anchorDate]);

  // Period-aware multipliers so weekly/monthly summaries look bigger than daily.
  const periodMultiplier = period === "daily" ? 1 : period === "weekly" ? 5 : 22;

  const topProducts = [...products].sort((a, b) => b.salesHistory[idx] - a.salesHistory[idx]).slice(0, 3);
  const slowProducts = [...products].sort((a, b) => a.salesHistory[idx] - b.salesHistory[idx]).slice(0, 3);
  const totalRevenue = products.reduce((s, p) => s + p.salesHistory[idx] * p.sellingPrice, 0) * periodMultiplier;
  const totalProductCost = products.reduce((s, p) => s + p.salesHistory[idx] * (p.costPrice / p.unitsPerBuyingUnit), 0) * periodMultiplier;

  // Operational expenses total (use all for simplicity since we don't have real period filtering on mock)
  const operationalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalCost = totalProductCost + operationalExpenses;
  const netProfit = totalRevenue - totalCost;

  // Range navigation helpers
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
  const isAtPresent = period === "daily"
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
              className={`flex-1 h-9 rounded-md text-sm font-medium transition-colors capitalize ${
                period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Range navigation — adapts to period */}
        <div className="flex items-center justify-between bg-card rounded-2xl p-3 border border-border mb-4">
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
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Summary</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {period === "daily" && "Strong day for Indomie with 47 units moved. Dangote Sugar needs urgent restocking. Cabin Biscuit continues to stall — consider discounting or bundling."}
            {period === "weekly" && "Revenue is up 8% week-over-week. Indomie and Semovita are driving growth. Peak Milk sell-through rate is accelerating — increase stock to avoid stockout."}
            {period === "monthly" && "Month-to-date revenue is tracking 12% above last month. Top 3 SKUs account for 62% of turnover. Watch slow-moving Cabin Biscuit and consider clearing stock."}
          </p>
        </div>

        {/* Revenue & Cost cards */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={() => navigate(`/owner/reports/revenue?period=${period}`)}
            className="bg-card rounded-2xl p-4 border border-border text-left active:opacity-80 transition-opacity"
          >
            <p className="text-xs text-muted-foreground">Money Collected</p>
            <p className="text-xl font-bold text-success">₦{totalRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-primary mt-1">See details →</p>
          </button>
          <button
            onClick={() => navigate(`/owner/reports/cost?period=${period}`)}
            className="bg-card rounded-2xl p-4 border border-border text-left active:opacity-80 transition-opacity"
          >
            <p className="text-xs text-muted-foreground">Money Spent</p>
            <p className="text-xl font-bold text-foreground">₦{Math.round(totalCost).toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Incl. ₦{operationalExpenses.toLocaleString()} expenses</p>
            <p className="text-[10px] text-primary mt-0.5">See details →</p>
          </button>
        </div>

        {/* Your Profit card */}
        <button
          onClick={() => navigate(`/owner/reports/profit?period=${period}`)}
          className="w-full bg-card rounded-2xl p-4 border border-border text-left active:opacity-80 transition-opacity mb-4"
        >
          <p className="text-xs text-muted-foreground">Your Profit</p>
          <p className={`text-xl font-bold ${netProfit >= 0 ? "text-success" : "text-critical"}`}>
            ₦{Math.abs(Math.round(netProfit)).toLocaleString()}
            {netProfit < 0 && " (loss)"}
          </p>
          <p className={`text-[10px] mt-1 ${netProfit >= 0 ? "text-success" : "text-critical"}`}>
            {netProfit >= 0 ? "You are in profit" : "You are currently at a loss"}
          </p>
          <p className="text-[10px] text-primary mt-0.5">See details →</p>
        </button>

        {/* Top products */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Best Selling Products</h3>
          {topProducts.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">#{i + 1}</span>
                <span className="text-sm text-foreground">{p.name.split("(")[0].trim()}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-sm font-semibold text-foreground">{p.salesHistory[idx]}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Slowest */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Slowest Products</h3>
          {slowProducts.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-foreground">{p.name.split("(")[0].trim()}</span>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-critical" />
                <span className="text-sm font-semibold text-foreground">{p.salesHistory[idx]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default ReportsPage;
