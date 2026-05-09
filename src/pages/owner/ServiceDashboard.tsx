import { useNavigate } from "react-router-dom";
import { Bell, Settings, Zap, TrendingUp, Receipt, Coins, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useService } from "@/contexts/ServiceContext";
import { useExpenses } from "@/contexts/ExpensesContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";

const ServiceDashboard = () => {
  const navigate = useNavigate();
  const { businessName } = useAuth();
  const { services, getTodaysSessions, agentAllocations, chipRequests, approveChipRequest, denyChipRequest, serviceSales } = useService();
  const { getTodaysExpenses } = useExpenses();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const todaySessions = getTodaysSessions();
  const todayRevenue = todaySessions.reduce((s, sale) => s + sale.amount, 0);
  const todaysExpenses = getTodaysExpenses();
  const todaysExpenseTotal = todaysExpenses.reduce((s, e) => s + e.amount, 0);

  // Group today's sessions by service
  const sessionsByService: Record<string, number> = {};
  todaySessions.forEach(s => { sessionsByService[s.serviceName] = (sessionsByService[s.serviceName] || 0) + 1; });

  // Low chips agents
  const lowChipAgents = agentAllocations.filter(a => (a.allocated - a.used) <= 3);

  // Pending chip requests
  const pendingRequests = chipRequests.filter(r => r.status === "pending");

  // Health score for service business
  const totalRevenue = serviceSales.reduce((s, sale) => s + sale.amount, 0);
  const totalExpenses = todaysExpenseTotal; // simplified
  const score = totalRevenue + totalExpenses > 0 ? Math.round((totalRevenue / (totalRevenue + totalExpenses)) * 100) : 50;
  const scoreColor = score <= 40 ? "text-critical" : score <= 70 ? "text-warning" : "text-success";
  const scoreBg = score <= 40 ? "bg-critical" : score <= 70 ? "bg-warning" : "bg-success";

  // AI brief for service
  const busiestService = Object.entries(sessionsByService).sort((a, b) => b[1] - a[1])[0];
  const lowAgent = lowChipAgents[0];

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">{greeting},</p>
            <h1 className="text-lg font-bold text-foreground">{businessName || "My Service Business"}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/owner/notifications")} className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-foreground" />
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-critical text-[9px] text-primary-foreground flex items-center justify-center font-bold">{pendingRequests.length}</span>
              )}
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
            <span className={`text-4xl font-bold ${scoreColor}`}>{score}</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted mt-3">
            <div className={`h-full rounded-full ${scoreBg}`} style={{ width: `${score}%` }} />
          </div>
        </div>

        {/* AI Brief */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Daily Brief</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {busiestService
              ? `Your busiest session today is ${busiestService[0]} with ${busiestService[1]} session${busiestService[1] > 1 ? "s" : ""}.`
              : "No sessions recorded yet today."}{" "}
            {lowAgent ? `${lowAgent.agentName} is running low on chips — consider topping up.` : "All agents have healthy chip balances."}
          </p>
        </div>

        {/* Today's Sessions */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Today's Sessions</h2>
          {Object.keys(sessionsByService).length === 0 ? (
            <div className="bg-card rounded-2xl p-4 border border-border text-center">
              <p className="text-sm text-muted-foreground">No sessions yet today</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(sessionsByService).map(([name, count]) => (
                <div key={name} className="bg-card rounded-2xl p-3 border border-border text-center">
                  <p className="text-2xl font-bold text-primary">{count}</p>
                  <p className="text-xs text-muted-foreground truncate">{name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Chips Alert */}
        {lowChipAgents.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-sm font-semibold text-foreground">Low Chips Alert</span>
            </div>
            {lowChipAgents.map((a) => (
              <div key={a.agentName} className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm text-foreground">{a.agentName}</span>
                  <span className="text-xs text-critical ml-2">{a.allocated - a.used} chips left</span>
                </div>
                <button
                  onClick={() => navigate("/owner/services")}
                  className="text-xs px-3 py-1 rounded-lg bg-primary text-primary-foreground font-medium"
                >
                  Add Chips
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pending Chip Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-warning/5 border border-warning/20 rounded-2xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Pending Chip Requests</h3>
            {pendingRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm text-foreground">{r.agentName} — {r.amount} chips</p>
                  {r.note && <p className="text-xs text-muted-foreground">{r.note}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveChipRequest(r.id)} className="text-xs px-3 py-1 rounded-lg bg-success text-primary-foreground font-medium">Approve</button>
                  <button onClick={() => denyChipRequest(r.id)} className="text-xs px-3 py-1 rounded-lg bg-critical text-primary-foreground font-medium">Deny</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Revenue / Expenses */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Today's Revenue</p>
            <p className="text-xl font-bold text-success">₦{todayRevenue.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-success" />
              <span className="text-[10px] text-success">{todaySessions.length} sessions</span>
            </div>
          </div>
          <button
            onClick={() => navigate("/owner/expenses")}
            className="bg-card rounded-2xl p-4 border border-border text-left"
          >
            <p className="text-xs text-muted-foreground mb-1">Today's Expenses</p>
            <p className="text-xl font-bold text-critical">₦{todaysExpenseTotal.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <Receipt className="w-3 h-3 text-critical" />
              <span className="text-[10px] text-muted-foreground">{todaysExpenses.length} logged</span>
            </div>
          </button>
        </div>

        <div className="mb-6" />
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default ServiceDashboard;
