import { useState } from "react";
import { Flame, TrendingUp, Star, Zap, Target, Swords, Receipt } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useExpenses } from "@/contexts/ExpensesContext";
import AgentBottomNav from "@/components/AgentBottomNav";

const PerformancePage = () => {
  const { setPersonalTarget, userName } = useAuth();
  const { getAgentExpenses } = useExpenses();
  const weeklyTotal = 87;
  const bestDay = "Thursday";
  const topProduct = "Indomie Chicken";
  const streak = 5;
  const tipsEarned = 1200;

  const monthlyData = [62, 78, 85, 87];
  const maxMonthly = Math.max(...monthlyData);
  const months = ["Week 1", "Week 2", "Week 3", "Week 4"];

  // Target state
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [targetType, setTargetType] = useState<"sales" | "revenue">("sales");
  const [targetPeriod, setTargetPeriod] = useState<"today" | "week" | "month">("week");
  const [targetValue, setTargetValue] = useState("");
  const [activeTarget, setActiveTarget] = useState<{ type: string; target: number; period: string; progress: number } | null>(null);

  // Mock challenge
  const [activeChallenge] = useState<{
    challenger: string;
    target: number;
    metric: string;
    period: string;
    myProgress: number;
    theirProgress: number;
  } | null>({
    challenger: "Ada Obi",
    target: 50,
    metric: "units",
    period: "This Week",
    myProgress: 32,
    theirProgress: 28,
  });

  const handleSetTarget = () => {
    if (!targetValue) return;
    const parsedTarget = parseInt(targetValue);
    const periodLabel = targetPeriod === "today" ? "Today" : targetPeriod === "week" ? "This Week" : "This Month";
    const currentProgress = targetType === "sales" ? weeklyTotal : 8750;
    setActiveTarget({
      type: targetType,
      target: parsedTarget,
      period: periodLabel,
      progress: currentProgress,
    });
    setPersonalTarget({
      type: targetType,
      target: parsedTarget,
      period: periodLabel,
      progress: currentProgress,
    });
    setShowTargetForm(false);
    setTargetValue("");
  };

  return (
    <div className="app-shell bg-background">
      <div className="page-content px-4 pt-5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-foreground">My Performance</h1>
          <button
            onClick={() => setShowTargetForm(!showTargetForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
          >
            <Target className="w-3.5 h-3.5" />
            Set Your Target
          </button>
        </div>

        {/* Target form */}
        {showTargetForm && (
          <div className="bg-card rounded-2xl p-4 border border-border mb-4 animate-fade-in">
            <h3 className="text-sm font-semibold text-foreground mb-3">Set Personal Target</h3>
            <div className="flex bg-muted rounded-xl p-1 mb-3">
              <button
                onClick={() => setTargetType("sales")}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  targetType === "sales" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Sales Count
              </button>
              <button
                onClick={() => setTargetType("revenue")}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  targetType === "revenue" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Revenue
              </button>
            </div>
            <div className="flex bg-muted rounded-xl p-1 mb-3">
              {(["today", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setTargetPeriod(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    targetPeriod === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder={targetType === "sales" ? "Target number of sales" : "Target revenue (₦)"}
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground mb-3"
            />
            <button
              onClick={handleSetTarget}
              disabled={!targetValue}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
            >
              Confirm Target
            </button>
          </div>
        )}

        {/* Active target progress */}
        {activeTarget && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">My Target — {activeTarget.period}</span>
              </div>
              <span className="text-sm font-bold text-primary">
                {activeTarget.progress}/{activeTarget.target}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (activeTarget.progress / activeTarget.target) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {activeTarget.type === "sales"
                ? `${Math.max(0, activeTarget.target - activeTarget.progress)} more sales to go`
                : `₦${Math.max(0, activeTarget.target - activeTarget.progress).toLocaleString()} to go`}
            </p>
          </div>
        )}

        {/* Challenge graph */}
        {activeChallenge && (
          <div className="bg-card rounded-2xl p-4 border border-border mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Swords className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Active Challenge</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{activeChallenge.period}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Target: {activeChallenge.target} {activeChallenge.metric} · vs {activeChallenge.challenger}
            </p>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-primary">You</span>
                  <span className="text-xs font-bold text-primary">{activeChallenge.myProgress}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(activeChallenge.myProgress / activeChallenge.target) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-warning">{activeChallenge.challenger}</span>
                  <span className="text-xs font-bold text-warning">{activeChallenge.theirProgress}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-warning transition-all"
                    style={{ width: `${(activeChallenge.theirProgress / activeChallenge.target) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-success font-medium mt-3 text-center">
              {activeChallenge.myProgress > activeChallenge.theirProgress
                ? "You're in the lead! 🔥"
                : activeChallenge.myProgress === activeChallenge.theirProgress
                ? "It's a tie!"
                : "You're behind — push harder! 💪"}
            </p>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">Weekly Sales</p>
            <p className="text-3xl font-bold text-primary mt-1">{weeklyTotal}</p>
            <p className="text-[10px] text-muted-foreground">units sold</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">Best Day</p>
            <p className="text-lg font-bold text-foreground mt-1">{bestDay}</p>
            <p className="text-[10px] text-success">22 units</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">Top Product</p>
            <p className="text-sm font-bold text-foreground mt-1">{topProduct}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 text-warning" />
              <span className="text-[10px] text-muted-foreground">38 sold</span>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">Tips Earned</p>
            <p className="text-lg font-bold text-success mt-1">₦{tipsEarned.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">this week</p>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-warning/5 border border-warning/20 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <Flame className="w-8 h-8 text-warning" />
          <div>
            <p className="text-sm font-semibold text-foreground">{streak}-day streak! 🔥</p>
            <p className="text-xs text-muted-foreground">Keep recording sales daily to build your streak</p>
          </div>
        </div>

        {/* AI motivation */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Coach's Note</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Great week, Chidi! You're consistently improving — this week's total is 12% higher than last week. 
            Focus on pushing Dangote Sugar — it's a fast mover and customers are looking for it. Keep going! 💪
          </p>
        </div>

        {/* Monthly chart */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Progress</h3>
          <div className="flex items-end justify-between gap-2 h-24">
            {monthlyData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-foreground">{v}</span>
                <div className="w-full rounded-lg bg-primary" style={{ height: `${(v / maxMonthly) * 100}%`, minHeight: 8 }} />
                <span className="text-[9px] text-muted-foreground">{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses Logged */}
        {(() => {
          const agentExp = getAgentExpenses(userName || "Agent");
          const now = new Date();
          const sow = new Date(now);
          sow.setDate(now.getDate() - now.getDay());
          sow.setHours(0, 0, 0, 0);
          const weekExp = agentExp.filter((e) => new Date(e.date) >= sow);
          const weekTotal = weekExp.reduce((s, e) => s + e.amount, 0);
          return (
            <div className="bg-card rounded-2xl p-4 border border-border mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="w-4 h-4 text-critical" />
                <span className="text-sm font-semibold text-foreground">Expenses Logged</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">This week: <span className="text-critical font-bold">₦{weekTotal.toLocaleString()}</span></p>
              <div className="space-y-2">
                {weekExp.length === 0 && <p className="text-xs text-muted-foreground">No expenses this week</p>}
                {weekExp.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">{e.name}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(e.date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm font-bold text-critical">₦{e.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
      <AgentBottomNav />
    </div>
  );
};

export default PerformancePage;
