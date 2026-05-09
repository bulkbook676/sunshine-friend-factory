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

const DistributorRevenueBreakdownPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const period = (params.get("period") as Period) || "daily";
  const { orders, ownSales } = useDistributor();

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

  const acc = new Map<string, { name: string; units: number; revenue: number }>();
  orders
    .filter((o) => o.status === "confirmed" && inRange(o.date))
    .forEach((o) =>
      o.items.forEach((i) => {
        const cur = acc.get(i.productId) ?? { name: i.productName, units: 0, revenue: 0 };
        cur.units += i.qty;
        cur.revenue += i.qty * i.unitPrice;
        acc.set(i.productId, cur);
      })
    );
  ownSales
    .filter((s) => inRange(s.date))
    .forEach((s) =>
      s.items.forEach((i) => {
        const cur = acc.get(i.productId) ?? { name: i.productName, units: 0, revenue: 0 };
        cur.units += i.qty;
        cur.revenue += i.qty * i.unitPrice;
        acc.set(i.productId, cur);
      })
    );
  const breakdown = [...acc.values()].sort((a, b) => b.revenue - a.revenue);
  const total = breakdown.reduce((s, p) => s + p.revenue, 0);

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-xl font-bold text-foreground mb-1">Revenue Breakdown</h1>
        <p className="text-sm text-muted-foreground mb-6 capitalize">{period} income per product</p>
        {breakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No revenue this period.</p>
        ) : (
          <div className="space-y-3 mb-6">
            {breakdown.map((p, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.units} units sold</p>
                </div>
                <p className="text-sm font-bold text-success">₦{p.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
        <div className="bg-primary/10 rounded-lg p-5 mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Total Revenue</span>
          <span className="text-2xl font-bold text-success">₦{total.toLocaleString()}</span>
        </div>
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorRevenueBreakdownPage;
