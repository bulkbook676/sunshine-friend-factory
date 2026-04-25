import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useDistributor, DistributorExpenseType } from "@/contexts/DistributorContext";
import DistributorBottomNav from "@/components/DistributorBottomNav";
import { toast } from "sonner";

const TYPES: DistributorExpenseType[] = [
  "Fuel/Generator", "Rent", "Transport", "Handling", "Salary", "Electricity", "Miscellaneous",
];

const DistributorLogExpensePage = () => {
  const navigate = useNavigate();
  const { addOwnExpense } = useDistributor();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<DistributorExpenseType>("Fuel/Generator");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  const save = () => {
    if (!name || !amount) return;
    addOwnExpense({ name, amount: parseInt(amount), type, date, note: note || undefined });
    toast.success("Expense saved");
    navigate("/distributor/expenses");
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-6">
          <ArrowLeft className="w-5 h-5" /><span className="text-sm">Back</span>
        </button>
        <h1 className="text-xl font-bold text-foreground mb-6">Log Expense</h1>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Expense name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Generator fuel"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Amount (₦)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as DistributorExpenseType)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a short note"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground" />
          </div>
          <button onClick={save} disabled={!name || !amount}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
            Save Expense
          </button>
        </div>
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorLogExpensePage;