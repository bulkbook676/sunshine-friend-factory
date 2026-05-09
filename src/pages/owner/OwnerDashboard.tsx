import { useNavigate } from "react-router-dom";
import { Bell, Settings, TrendingUp, TrendingDown, AlertTriangle, Package, Zap, ShoppingCart, Receipt, Plus, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { products, computeStockStatus } from "@/data/mockData";
import { distributorFeedItems } from "@/data/distributors";
import { useMemo } from "react";
import { useExpenses } from "@/contexts/ExpensesContext";
import { useCart } from "@/contexts/CartContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { businessName } = useAuth();
  const { getTodaysExpenses } = useExpenses();
  const { activeOrderCount } = useCart();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const productsWithStatus = useMemo(
    () => products.map((p) => ({ ...p, status: computeStockStatus(p) })),
    [],
  );
  const topMovers = productsWithStatus.filter((p) => p.status === "healthy").slice(0, 3);
  const deadStock = productsWithStatus.filter((p) => p.status === "dead");
  const restockItems = productsWithStatus.filter((p) => p.status === "low" || p.status === "critical");
  const todayRevenue = products.reduce((s, p) => s + p.salesHistory[6] * p.sellingPrice, 0);
  const todayCost = products.reduce((s, p) => s + p.salesHistory[6] * (p.costPrice / p.unitsPerBuyingUnit), 0);
  const todaysExpenses = getTodaysExpenses();
  const todaysExpenseTotal = todaysExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">{greeting},</p>
            <h1 className="text-lg font-bold text-foreground">{businessName || "Mama Nkechi Provisions"}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/owner/notifications")} className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-critical text-[9px] text-primary-foreground flex items-center justify-center font-bold">3</span>
            </button>
            <button onClick={() => navigate("/owner/settings")} className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Settings className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Health Score */}
        <div onClick={() => navigate("/owner/health")} className="bg-card rounded-2xl p-4 mb-4 border border-border cursor-pointer active:opacity-80 transition-opacity">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">Business Health</span>
            <Zap className="w-4 h-4 text-warning" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-warning">72</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted mt-3">
            <div className="h-full rounded-full bg-warning" style={{ width: "72%" }} />
          </div>
        </div>

        {/* Record a Sale Button */}
        <button
          onClick={() => navigate("/owner/record-sale")}
          className="w-full bg-primary rounded-lg p-4 mb-4 flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
        >
          <Plus className="w-5 h-5 text-primary-foreground" />
          <span className="text-sm font-bold text-primary-foreground">Record a Sale</span>
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
            Your best seller today is <strong>Indomie</strong>. You are running low on <strong>Peak Milk</strong>. 
            Cabin Biscuit has not moved in <strong>9 days</strong> — consider a price drop.
          </p>
        </div>

        {/* Top Movers */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Top Moving Products</h2>
          <div className="grid grid-cols-3 gap-2">
            {topMovers.map((p) => (
              <div key={p.id} className="bg-card rounded-2xl p-3 border border-border text-center">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
                <p className="text-xs font-medium text-foreground truncate">{p.name.split("(")[0].trim()}</p>
                <p className="text-lg font-bold text-primary">{p.salesHistory[6]}</p>
                <p className="text-[10px] text-muted-foreground">sold today</p>
              </div>
            ))}
          </div>
        </div>

        {/* Not Moving */}
        {deadStock.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Not Moving Alert</span>
            </div>
            {deadStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">{p.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">No sales 9d</span>
              </div>
            ))}
          </div>
        )}

        {/* Restock Alerts */}
        <button onClick={() => navigate("/owner/restock")} className="w-full bg-card rounded-2xl p-4 mb-3 border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-warning" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Restock Alerts</p>
              <p className="text-xs text-muted-foreground">{restockItems.length} products need restocking</p>
            </div>
          </div>
          <span className="w-6 h-6 rounded-full bg-warning text-primary-foreground text-xs font-bold flex items-center justify-center">
            {restockItems.length}
          </span>
        </button>

        {/* My Orders */}
        <button onClick={() => navigate("/owner/orders")} className="w-full bg-card rounded-2xl p-4 mb-4 border border-border flex items-center justify-between active:opacity-80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">My Orders</p>
              <p className="text-xs text-muted-foreground">{activeOrderCount} active orders</p>
            </div>
          </div>
          {activeOrderCount > 0 && (
            <span className="min-w-6 h-6 px-2 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {activeOrderCount}
            </span>
          )}
        </button>

        {/* Revenue / Cost / Expenses Snapshot */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Today's Revenue</p>
            <p className="text-xl font-bold text-success">₦{todayRevenue.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-success" />
              <span className="text-[10px] text-success">+12%</span>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Today's Cost</p>
            <p className="text-xl font-bold text-foreground">₦{Math.round(todayCost).toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">steady</span>
            </div>
          </div>
        </div>

        {/* Today's Expenses */}
        <button
          onClick={() => navigate("/owner/expenses")}
          className="w-full bg-card rounded-2xl p-4 mb-6 border border-border flex items-center justify-between active:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-critical/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-critical" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Today's Expenses</p>
              <p className="text-xs text-muted-foreground">{todaysExpenses.length} logged today</p>
            </div>
          </div>
          <p className="text-lg font-bold text-critical">₦{todaysExpenseTotal.toLocaleString()}</p>
        </button>

        {/* Distributor Feed */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Distributor Feed</h2>
          </div>
          <div className="space-y-3">
            {distributorFeedItems.slice(0, 8).map((item) => (
              <div key={item.id} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">₦{item.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{item.availableQty.toLocaleString()} available</p>
                    <button
                      onClick={() => navigate(`/owner/distributor/${item.distributorId}`)}
                      className="text-xs text-primary font-medium mt-1"
                    >
                      {item.distributorName}
                    </button>
                  </div>
                  {item.goodwillAvailable && (
                    <span className="text-xs">🤝</span>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-2 rounded-lg border border-primary text-primary text-xs font-medium flex items-center justify-center gap-1">
                    <ShoppingCart className="w-3 h-3" />
                    Add to Cart
                  </button>
                  <button className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                    Checkout
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default OwnerDashboard;
