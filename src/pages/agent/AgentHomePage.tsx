import { useNavigate } from "react-router-dom";
import { ShoppingCart, TrendingUp, Flame, Target, Building2, Receipt } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useExpenses } from "@/contexts/ExpensesContext";
import ServiceTimers from "@/components/ServiceTimer";
import AgentBottomNav from "@/components/AgentBottomNav";

const AgentHomePage = () => {
  const navigate = useNavigate();
  const { userName, isAuthorized, businessName, businessTarget, personalTarget, businessType } = useAuth();
  const { getAgentExpenses } = useExpenses();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const isService = businessType === "service";

  const todaySales = 14;
  const dailyTarget = 25;
  const totalValue = 8750;

  const recentSales = [
    { time: "4:30 PM", product: "Indomie Chicken", qty: 5, value: 1000 },
    { time: "3:15 PM", product: "Dangote Sugar", qty: 3, value: 1650 },
    { time: "2:00 PM", product: "Peak Milk", qty: 2, value: 800 },
    { time: "11:45 AM", product: "Semovita 2kg", qty: 1, value: 1500 },
    { time: "10:00 AM", product: "Indomie Chicken", qty: 3, value: 600 },
  ];

  const todaysTotal = recentSales.reduce((s, sale) => s + sale.value, 0);
  const allTimeTotal = 247500;

  const hasPersonalTarget = !!personalTarget;

  // Agent's own expenses this week
  const agentExpenses = getAgentExpenses(userName || "Agent");
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const weekExpenses = agentExpenses.filter((e) => new Date(e.date) >= startOfWeek);
  const weekExpenseTotal = weekExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="app-shell bg-background">
      <div className="page-content px-4 pt-5">
        {/* Greeting */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="text-xl font-bold text-foreground">{userName || "Chidi"} 👋</h1>
        </div>

        {/* Service Timers — only for service businesses */}
        {isService && <ServiceTimers />}

        {/* Personal Target Progress — only if set */}
        {hasPersonalTarget && (
          <button
            onClick={() => navigate("/agent/target-breakdown")}
            className="w-full bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-4 text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Your Target — {personalTarget.period}</span>
              </div>
              <span className="text-sm font-bold text-primary">
                {personalTarget.progress}/{personalTarget.target}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (personalTarget.progress / personalTarget.target) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {personalTarget.type === "sales"
                ? `${Math.max(0, personalTarget.target - personalTarget.progress)} more sales to go`
                : `₦${Math.max(0, personalTarget.target - personalTarget.progress).toLocaleString()} to go`}
            </p>
          </button>
        )}

        {/* Business-wide Target — if owner set one */}
        {businessTarget && (
          <div className="bg-accent/30 border border-primary/15 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium text-foreground">{businessName || "Business"} Target</span>
              </div>
              <span className="text-sm font-bold text-secondary">
                {businessTarget.metric === "revenue"
                  ? `₦${businessTarget.progress.toLocaleString()}`
                  : businessTarget.progress}
                /
                {businessTarget.metric === "revenue"
                  ? `₦${businessTarget.target.toLocaleString()}`
                  : businessTarget.target}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-secondary transition-all"
                style={{ width: `${Math.min(100, (businessTarget.progress / businessTarget.target) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Action — only for authorized agents */}
        {isAuthorized && (
          <button
            onClick={() => navigate("/agent/record-sale")}
            className="w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 mb-4 shadow-lg bg-primary text-primary-foreground shadow-primary/20"
          >
            <ShoppingCart className="w-5 h-5" />
            {isService ? "Record a Session" : "Record a Sale"}
          </button>
        )}

        {/* Today's Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-card rounded-2xl p-3 border border-border text-center">
            <p className="text-2xl font-bold text-primary">{todaySales}</p>
            <p className="text-[10px] text-muted-foreground">{isService ? "Sessions" : "Sales"}</p>
          </div>
          <div className="bg-card rounded-2xl p-3 border border-border text-center">
            <p className="text-lg font-bold text-foreground">₦{totalValue.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Value</p>
          </div>
          <div className="bg-card rounded-2xl p-3 border border-border text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-warning" />
              <span className="text-lg font-bold text-foreground">5</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Days in a Row</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">{isService ? "Recent Sessions" : "Sales You Recorded Today"}</h2>
          <div className="space-y-2">
            {recentSales.map((sale, i) => (
              <div key={i} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{sale.product}</p>
                  <p className="text-xs text-muted-foreground">{sale.qty} units · {sale.time}</p>
                </div>
                <p className="text-sm font-bold text-success">₦{sale.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Log Expense button */}
        <button
          onClick={() => navigate("/agent/log-expense")}
          className="w-full py-3 rounded-2xl border border-border bg-card text-sm font-medium text-muted-foreground flex items-center justify-center gap-2 mb-4"
        >
          <Receipt className="w-4 h-4" />
          Log Expense
        </button>

        {/* Daily Total + Total Since You Started */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-2xl p-4 border border-border text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Collected Today</p>
            <p className="text-xl font-bold text-success">₦{todaysTotal.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Since You Started</p>
            <p className="text-xl font-bold text-primary">₦{allTimeTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>
      <AgentBottomNav />
    </div>
  );
};

export default AgentHomePage;
