import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import AgentBottomNav from "@/components/AgentBottomNav";

// Mock current PIN for frontend testing — replace with backend validation later.
const MOCK_CURRENT_PIN = "1234";

const PinInput = ({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) => (
  <div>
    <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
    <input
      type="password"
      inputMode="numeric"
      maxLength={4}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
      placeholder="••••"
      className={`w-full h-12 px-4 rounded-lg border bg-card text-foreground text-center text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary ${
        error ? "border-destructive" : "border-input"
      }`}
    />
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const ChangePinPage = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [currentError, setCurrentError] = useState("");
  const [matchError, setMatchError] = useState("");

  const isComplete =
    current.length === 4 &&
    next.length === 4 &&
    confirm.length === 4 &&
    next === confirm;

  const handleConfirmChange = (v: string) => {
    setConfirm(v);
    if (v.length === 4 && next.length === 4 && v !== next) {
      setMatchError("PINs do not match");
    } else {
      setMatchError("");
    }
  };

  const handleSubmit = () => {
    setCurrentError("");
    setMatchError("");
    if (current !== MOCK_CURRENT_PIN) {
      setCurrentError("Current PIN is incorrect");
      return;
    }
    if (next !== confirm) {
      setMatchError("PINs do not match");
      return;
    }
    toast.success("PIN updated successfully");
    setTimeout(() => navigate("/agent/settings"), 600);
  };

  return (
    <div className="app-shell bg-background">
      <div className="page-content px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Change PIN</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Update your 4-digit login PIN
        </p>

        <div className="space-y-4">
          <PinInput
            label="Current PIN"
            value={current}
            onChange={(v) => {
              setCurrent(v);
              setCurrentError("");
            }}
            error={currentError}
          />
          <PinInput label="New PIN" value={next} onChange={setNext} />
          <PinInput
            label="Confirm New PIN"
            value={confirm}
            onChange={handleConfirmChange}
            error={matchError}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isComplete}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm mt-6 disabled:opacity-50"
        >
          Update PIN
        </button>
      </div>
      <AgentBottomNav />
    </div>
  );
};

export default ChangePinPage;