import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useDistributor } from "@/contexts/DistributorContext";
import DistributorBottomNav from "@/components/DistributorBottomNav";
import { toast } from "sonner";

const DistributorExpensesHistoryPage = () => {
  const navigate = useNavigate();
  const { ownExpenses, deleteOwnExpense } = useDistributor();
  const sorted = [...ownExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const total = sorted.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" /><span className="text-sm">Back</span>
          </button>
          <button onClick={() => navigate("/distributor/expenses/log")}
            className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-1">Expenses</h1>
        <div className="bg-critical/10 border border-critical/20 rounded-2xl p-4 mb-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-critical">₦{total.toLocaleString()}</p>
        </div>
        <div className="space-y-2 mb-6">
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No expenses logged yet</p>
          ) : sorted.map((e) => (
            <div key={e.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{e.type}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-critical">₦{e.amount.toLocaleString()}</p>
                <button onClick={() => { deleteOwnExpense(e.id); toast.success("Deleted"); }}
                  className="text-muted-foreground"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorExpensesHistoryPage;