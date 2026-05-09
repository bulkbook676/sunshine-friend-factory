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

const DistributorCostBreakdownPage = () => {
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

  // Cost of goods sold by product
  const cogsMap = new Map<string, { name: string; units: number; cost: number }>();
  const addCogs = (productId: string, productName: string, qty: number) => {
    const p = products.find((pp) => pp.id === productId);
    const unitCost = p?.costPrice ?? 0;
    const cur = cogsMap.get(productId) ?? { name: productName, units: 0, cost: 0 };
    cur.units += qty;
    cur.cost += qty * unitCost;
    cogsMap.set(productId, cur);
  };
  orders
    .filter((o) => o.status === "confirmed" && inRange(o.date))
    .forEach((o) => o.items.forEach((i) => addCogs(i.productId, i.productName, i.qty)));
  ownSales
    .filter((s) => inRange(s.date))
    .forEach((s) => s.items.forEach((i) => addCogs(i.productId, i.productName, i.qty)));

  const cogsList = [...cogsMap.values()].sort((a, b) => b.cost - a.cost);
  const cogsTotal = cogsList.reduce((s, p) => s + p.cost, 0);

  const periodExpenses = ownExpenses.filter((e) => inRange(e.date));
  const expensesTotal = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const total = cogsTotal + expensesTotal;

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-xl font-bold text-foreground mb-1">Cost Breakdown</h1>
        <p className="text-sm text-muted-foreground mb-6 capitalize">{period} cost of goods + expenses</p>

        <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
          Price you paid for the goods Sold
        </h3>
        {cogsList.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-4">No COGS this period.</p>
        ) : (
          <div className="space-y-2 mb-5">
            {cogsList.map((p, i) => (
              <div key={i} className="bg-card rounded-lg p-3 border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.units} units</p>
                </div>
                <p className="text-sm font-bold text-foreground">₦{p.cost.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
          Operational Expenses
        </h3>
        {periodExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-4">No expenses this period.</p>
        ) : (
          <div className="space-y-2 mb-5">
            {periodExpenses.map((e) => (
              <div key={e.id} className="bg-card rounded-lg p-3 border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.type}</p>
                </div>
                <p className="text-sm font-bold text-foreground">₦{e.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-primary/10 rounded-lg p-5 mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Total Cost</span>
          <span className="text-2xl font-bold text-foreground">₦{total.toLocaleString()}</span>
        </div>
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorCostBreakdownPage;
