import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { useExpenses } from "@/contexts/ExpensesContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { toast } from "sonner";

type Filter = "all" | "week" | "month" | "custom";

const ExpensesHistoryPage = () => {
  const navigate = useNavigate();
  const { expenses, deleteExpense } = useExpenses();
  const [filter, setFilter] = useState<Filter>("all");
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filtered = expenses.filter((e) => {
    if (filter === "all") return true;
    const d = new Date(e.date);
    if (filter === "week") return d >= startOfWeek;
    if (filter === "month") return d >= startOfMonth;
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const handleDelete = (id: string) => {
    deleteExpense(id);
    setSwipedId(null);
    toast.success("Expense deleted");
  };

  const filters: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
  ];

  const typeBadgeColor: Record<string, string> = {
    "Fuel/Generator": "bg-warning/20 text-warning",
    "Rent": "bg-primary/20 text-primary",
    "Salary": "bg-success/20 text-success",
    "Packaging": "bg-secondary/20 text-secondary",
    "Transport": "bg-accent/30 text-foreground",
    "Market Levy": "bg-muted text-muted-foreground",
    "Electricity": "bg-warning/20 text-warning",
    "Miscellaneous": "bg-muted text-muted-foreground",
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <button
            onClick={() => navigate("/owner/expenses/log")}
            className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center"
          >
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>

        <h1 className="text-xl font-bold text-foreground mb-1">Expenses</h1>

        {/* Total */}
        <div className="bg-critical/10 border border-critical/20 rounded-2xl p-4 mb-4">
          <p className="text-xs text-muted-foreground">Total for selected period</p>
          <p className="text-2xl font-bold text-critical">₦{total.toLocaleString()}</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f.value ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Expense list */}
        <div className="space-y-2 mb-6">
          {filtered.map((e) => (
            <div key={e.id} className="relative overflow-hidden rounded-lg">
              {/* Swipe actions */}
              {swipedId === e.id && (
                <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 pr-2 z-10">
                  <button
                    onClick={() => { /* edit handled inline for now */ setSwipedId(null); }}
                    className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center"
                  >
                    <Pencil className="w-4 h-4 text-primary-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="w-9 h-9 rounded-lg bg-critical flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 text-primary-foreground" />
                  </button>
                </div>
              )}
              <div
                onClick={() => setSwipedId(swipedId === e.id ? null : e.id)}
                className={`bg-card border border-border p-4 flex items-center justify-between cursor-pointer transition-transform ${
                  swipedId === e.id ? "-translate-x-20" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeBadgeColor[e.type] || "bg-muted text-muted-foreground"}`}>
                      {e.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()}</span>
                    {e.role === "agent" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-medium">
                        {e.loggedBy}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm font-bold text-critical">₦{e.amount.toLocaleString()}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No expenses logged yet</p>
          )}
        </div>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default ExpensesHistoryPage;
