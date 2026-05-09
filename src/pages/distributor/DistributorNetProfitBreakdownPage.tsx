import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { useDistributor } from "@/contexts/DistributorContext";
import DistributorBottomNav from "@/components/DistributorBottomNav";

type Period = "daily" | "weekly" | "monthly";

const DistributorNetProfitBreakdownPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const period = (params.get("period") as Period) || "daily";
  const { orders, ownSales, ownExpenses, products } = useDistributor();

  const range = useMemo(() => {
    const now = new Date();
    if (period === "daily") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (period === "weekly")
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    return { start: startOfMonth(now), end: endOfMonth(now) };
  }, [period]);

  const inRange = (iso: string) => {
    try {
      return isWithinInterval(parseISO(iso), range);
    } catch {
      return false;
    }
  };

  const confirmedOrders = orders.filter((o) => o.status === "confirmed" && inRange(o.date));
  const periodOwnSales = ownSales.filter((s) => inRange(s.date));
  const periodExpenses = ownExpenses.filter((e) => inRange(e.date));

  const revenue =
    confirmedOrders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.qty * i.unitPrice, 0), 0) +
    periodOwnSales.reduce((s, x) => s + x.total, 0);
  const cogs =
    confirmedOrders.reduce(
      (s, o) =>
        s +
        o.items.reduce((ss, i) => {
          const p = products.find((pp) => pp.id === i.productId);
          return ss + (p?.costPrice ?? 0) * i.qty;
        }, 0),
      0
    ) +
    periodOwnSales.reduce(
      (s, x) =>
        s +
        x.items.reduce((ss, i) => {
          const p = products.find((pp) => pp.id === i.productId);
          return ss + (p?.costPrice ?? 0) * i.qty;
        }, 0),
      0
    );
  const expenses = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const profit = revenue - cogs - expenses;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-xl font-bold text-foreground mb-1">Your Profit Breakdown</h1>
        <p className="text-sm text-muted-foreground mb-6 capitalize">{period} profitability</p>

        <div className="space-y-3 mb-5">
          <div className="bg-card rounded-lg p-4 border border-border flex items-center justify-between">
            <span className="text-sm text-foreground">Money Collected</span>
            <span className="text-sm font-bold text-success">₦{revenue.toLocaleString()}</span>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border flex items-center justify-between">
            <span className="text-sm text-foreground">— Price you paid for the goods Sold</span>
            <span className="text-sm font-bold text-foreground">₦{Math.round(cogs).toLocaleString()}</span>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border flex items-center justify-between">
            <span className="text-sm text-foreground">— Operational Expenses</span>
            <span className="text-sm font-bold text-foreground">₦{expenses.toLocaleString()}</span>
          </div>
        </div>

        <div
          className={`rounded-lg p-5 mb-6 ${
            profit >= 0 ? "bg-success/10 border border-success/30" : "bg-critical/10 border border-critical/30"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">Your Profit</span>
            <span
              className={`text-2xl font-bold ${profit >= 0 ? "text-success" : "text-critical"}`}
            >
              ₦{Math.abs(Math.round(profit)).toLocaleString()}
              {profit < 0 && " (loss)"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Margin: {margin.toFixed(1)}%</p>
        </div>
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorNetProfitBreakdownPage;
