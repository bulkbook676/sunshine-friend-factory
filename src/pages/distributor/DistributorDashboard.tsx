import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Settings, Zap, ClipboardList, AlertTriangle, Package, Plus, Receipt, TrendingUp, Boxes } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDistributor } from "@/contexts/DistributorContext";
import DistributorBottomNav from "@/components/DistributorBottomNav";

const DistributorDashboard = () => {
  const navigate = useNavigate();
  const { businessName } = useAuth();
  const { products, orders, ownSales, ownExpenses } = useDistributor();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Health score calculation
  const inventoryValue = products.reduce((s, p) => s + p.costPrice * p.currentStock, 0);
  const cashReceived = orders
    .filter((o) => o.status === "confirmed")
    .reduce((s, o) => s + o.items.filter(i => i.paymentType === "cash").reduce((ss, i) => ss + i.qty * i.unitPrice, 0), 0);
  const cashInPromise = orders
    .filter((o) => o.status === "confirmed")
    .reduce((s, o) => s + o.items.filter(i => i.paymentType === "goodwill").reduce((ss, i) => ss + i.qty * i.unitPrice, 0), 0);
  const totalAssets = inventoryValue + cashReceived + cashInPromise;
  const totalCOGS = products.reduce((s, p) => s + p.costPrice * p.currentStock, 0);
  const score = totalAssets + totalCOGS > 0 ? Math.round((totalAssets / (totalAssets + totalCOGS)) * 100) : 0;

  const today = new Date().toDateString();
  const todaysOrders = orders.filter((o) => new Date(o.date).toDateString() === today);
  const todayValue = todaysOrders.reduce(
    (s, o) => s + o.items.reduce((ss, i) => ss + i.qty * i.unitPrice, 0),
    0
  );

  // Stock movement signals (use today's own sales as movement proxy)
  const todaysOwnSales = ownSales.filter((s) => new Date(s.date).toDateString() === today);
  const unitsSoldByProduct = new Map<string, number>();
  for (const sale of todaysOwnSales) {
    for (const it of sale.items) {
      unitsSoldByProduct.set(it.productId, (unitsSoldByProduct.get(it.productId) ?? 0) + it.qty);
    }
  }
  const topMovers = [...products]
    .map((p) => ({ ...p, soldToday: unitsSoldByProduct.get(p.id) ?? 0 }))
    .sort((a, b) => b.soldToday - a.soldToday)
    .slice(0, 3)
    .filter((p) => p.soldToday > 0);

  // Dead stock — for distributor, treat any product with zero own-sales in last 30d as candidate
  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  const recentSoldIds = new Set(
    ownSales.filter((s) => new Date(s.date).getTime() >= thirtyDaysAgo).flatMap((s) => s.items.map((i) => i.productId))
  );
  const deadStock = products.filter((p) => p.currentStock > 0 && !recentSoldIds.has(p.id));

  // Restock — products at or below 50% of opening stock (parity with owner)
  const restockItems = products.filter((p) => {
    const opening = p.openingStock && p.openingStock > 0 ? p.openingStock : Math.max(p.currentStock, 1);
    return opening > 0 && p.currentStock / opening <= 0.5;
  });

  const todaysExpensesTotal = ownExpenses
    .filter((e) => e.date === new Date().toISOString().split("T")[0])
    .reduce((s, e) => s + e.amount, 0);

  // Goodwill tracker rows — mirrors tracker page logic (mock sell-through).
  const goodwillRows = useMemo(() => {
    type Row = {
      key: string;
      productName: string;
      buyerId: string;
      buyerName: string;
      qtySent: number;
      qtySold: number;
      qtyRemaining: number;
      sellThroughPct: number;
      daysRemaining: number;
      status: "ontrack" | "duesoon" | "overdue";
    };
    const rows: Row[] = [];
    orders
      .filter((o) => o.status === "confirmed" && !o.goodwillPaid)
      .forEach((o) => {
        o.items
          .filter((i) => i.paymentType === "goodwill")
          .forEach((item) => {
            const product = products.find((p) => p.id === item.productId);
            const repaymentDays = product?.goodwillRepaymentDays ?? 30;
            const repaymentDate = new Date(new Date(o.date).getTime() + repaymentDays * 86400000);
            const daysRemaining = Math.ceil((repaymentDate.getTime() - Date.now()) / 86400000);
            const seed = (item.productId + o.id).split("").reduce((s, c) => s + c.charCodeAt(0), 0);
            const soldRatio = ((seed % 70) + 10) / 100;
            const qtySold = Math.min(item.qty, Math.floor(item.qty * soldRatio));
            const qtyRemaining = item.qty - qtySold;
            const sellThroughPct = item.qty > 0 ? Math.round((qtySold / item.qty) * 100) : 0;
            const status: Row["status"] = daysRemaining < 0 ? "overdue" : daysRemaining <= 14 ? "duesoon" : "ontrack";
            rows.push({
              key: `${o.id}-${item.productId}`,
              productName: item.productName,
              buyerId: o.buyerId,
              buyerName: o.buyerName,
              qtySent: item.qty,
              qtySold,
              qtyRemaining,
              sellThroughPct,
              daysRemaining,
              status,
            });
          });
      });
    const mocks: Row[] = [
      {
        key: "mock-peak-milk",
        productName: "Peak Milk (Tin)",
        buyerId: "mock-mama-nkechi",
        buyerName: "Mama Nkechi Provisions",
        qtySent: 200,
        qtySold: 143,
        qtyRemaining: 57,
        sellThroughPct: 72,
        daysRemaining: 14,
        status: "duesoon",
      },
      {
        key: "mock-dangote-sugar",
        productName: "Dangote Sugar (500g)",
        buyerId: "mock-oga-emeka",
        buyerName: "Oga Emeka Stores",
        qtySent: 100,
        qtySold: 18,
        qtyRemaining: 82,
        sellThroughPct: 18,
        daysRemaining: -3,
        status: "overdue",
      },
    ];
    return [...mocks, ...rows];
  }, [orders, products]);

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">{greeting},</p>
            <h1 className="text-lg font-bold text-foreground">{businessName || "Peak Milk Depot"}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/distributor/notifications")} className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-critical text-[9px] text-primary-foreground flex items-center justify-center font-bold">
                {orders.filter(o => o.status === "pending").length}
              </span>
            </button>
            <button onClick={() => navigate("/distributor/settings")} className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Settings className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Health Score */}
        <button
          onClick={() => navigate("/distributor/health")}
          className="w-full text-left bg-card rounded-2xl p-4 mb-4 border border-border active:opacity-80"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">Business Health</span>
            <Zap className="w-4 h-4 text-warning" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-bold ${score >= 71 ? "text-success" : score >= 41 ? "text-warning" : "text-critical"}`}>{score}</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted mt-3">
            <div
              className={`h-full rounded-full ${score >= 71 ? "bg-success" : score >= 41 ? "bg-warning" : "bg-critical"}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </button>

        {/* Record a Sale */}
        <button
          onClick={() => navigate("/distributor/record-sale")}
          className="w-full bg-primary rounded-lg p-4 mb-4 flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
        >
          <Plus className="w-5 h-5 text-primary-foreground" />
          <span className="text-sm font-bold text-primary-foreground">Record a Sale</span>
        </button>

        {/* Inventory entry — bottom nav no longer shows it as a tab */}
        <button
          onClick={() => navigate("/distributor/inventory")}
          className="w-full bg-card rounded-2xl p-4 mb-4 border border-border flex items-center justify-between active:opacity-80"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">My Inventory</p>
              <p className="text-xs text-muted-foreground">{products.length} products in stock</p>
            </div>
          </div>
          <span className="text-xs text-primary font-semibold">Open →</span>
        </button>

        {/* AI Brief */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Daily Brief</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            <strong>{todaysOrders.length} new orders</strong> received today. Peak Milk stock is running low. 
            <strong> 2 businesses</strong> are due for goodwill repayment this week.
          </p>
        </div>

        {/* Top Moving Products */}
        {topMovers.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Top Moving Products</h2>
            <div className="grid grid-cols-3 gap-2">
              {topMovers.map((p) => (
                <div key={p.id} className="bg-card rounded-2xl p-3 border border-border text-center">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                  </div>
                  <p className="text-xs font-medium text-foreground truncate">{p.name.split("(")[0].trim()}</p>
                  <p className="text-lg font-bold text-primary">{p.soldToday}</p>
                  <p className="text-[10px] text-muted-foreground">sold today</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Not Moving Alert */}
        {deadStock.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Stock that hasn't sold in 30 days</span>
            </div>
            {deadStock.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">{p.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">No sales 30d</span>
              </div>
            ))}
          </div>
        )}

        {/* Restock alerts */}
        {restockItems.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-warning" />
                <h2 className="text-sm font-semibold text-foreground">Restock Alerts</h2>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/15 text-warning font-medium">
                {restockItems.length}
              </span>
            </div>
            <div className="space-y-2">
              {restockItems.slice(0, 3).map((p) => (
                <div key={p.id} className="bg-card rounded-2xl p-3 border border-border flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.currentStock.toLocaleString()} left
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/distributor/restock/${p.id}`)}
                    className="px-3 py-1.5 rounded-md border border-primary text-primary text-xs font-semibold active:opacity-80"
                  >
                    Restock
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily expenses */}
        <button
          onClick={() => navigate("/distributor/expenses")}
          className="w-full bg-card rounded-2xl p-4 mb-4 border border-border flex items-center justify-between active:opacity-80"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-critical/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-critical" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Today's Expenses</p>
              <p className="text-xs text-muted-foreground">Tap to log or view history</p>
            </div>
          </div>
          <p className="text-lg font-bold text-critical">₦{todaysExpensesTotal.toLocaleString()}</p>
        </button>

        {/* Today's Orders */}
        <button
          onClick={() => navigate("/distributor/orders")}
          className="w-full bg-card rounded-2xl p-4 mb-4 border border-border flex items-center justify-between active:opacity-80"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Today's Orders</p>
              <p className="text-xs text-muted-foreground">{todaysOrders.length} orders received</p>
            </div>
          </div>
          <p className="text-lg font-bold text-primary">₦{todayValue.toLocaleString()}</p>
        </button>

        {/* Goodwill Tracker */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Goodwill Tracker</h2>
          <button
            onClick={() => navigate("/distributor/reports/goodwill")}
            className="text-xs text-primary font-semibold"
          >
            See all →
          </button>
        </div>
        {goodwillRows.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 border border-border text-center mb-6">
            <p className="text-sm text-muted-foreground">No goodwill products tracked yet</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {goodwillRows.map((c) => {
              const barColor =
                c.status === "overdue" ? "bg-critical" : c.status === "duesoon" ? "bg-warning" : "bg-success";
              const deadlineClass =
                c.status === "overdue" ? "text-critical" : c.status === "duesoon" ? "text-warning" : "text-success";
              return (
                <button
                  key={c.key}
                  onClick={() => navigate("/distributor/reports/goodwill")}
                  className="w-full bg-card rounded-2xl p-4 border border-border text-left active:opacity-80"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.productName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{c.buyerName}</p>
                    </div>
                    <span className={`text-[10px] font-semibold ${deadlineClass}`}>
                      {c.status === "overdue" ? `${-c.daysRemaining}d late` : `${c.daysRemaining}d left`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="bg-muted/40 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground">Sent</p>
                      <p className="text-xs font-bold text-foreground">{c.qtySent}</p>
                    </div>
                    <div className="bg-muted/40 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground">Sold</p>
                      <p className="text-xs font-bold text-success">{c.qtySold}</p>
                    </div>
                    <div className="bg-muted/40 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground">Left</p>
                      <p className="text-xs font-bold text-foreground">{c.qtyRemaining}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">How much has been sold</span>
                    <span className="text-foreground font-medium">{c.sellThroughPct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${c.sellThroughPct}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorDashboard;
