import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import DistributorBottomNav from "@/components/DistributorBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const DistributorAccountSettingsPage = () => {
  const navigate = useNavigate();
  const { phone: authPhone } = useAuth() as { phone?: string };
  const [phone] = useState(authPhone || "+234 800 000 0000");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const validateAndSave = () => {
    if (!currentPwd) return toast.error("Enter your current password");
    if (newPwd.length < 8) return toast.error("New password must be at least 8 characters");
    if (newPwd !== confirmPwd) return toast.error("New passwords do not match");
    if (newPwd === currentPwd) return toast.error("New password must differ from current");
    toast.success("Password updated");
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-lg font-bold text-foreground mb-6">Account</h1>

        {/* Phone */}
        <div className="bg-card rounded-lg p-4 border border-border mb-6">
          <p className="text-xs text-muted-foreground mb-1">Phone number</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{phone}</span>
            <button
              onClick={() => toast.info("We'll send a verification code shortly")}
              className="text-xs text-primary font-medium px-2 py-1 rounded hover:bg-primary/10"
            >
              Change
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="bg-card rounded-lg p-4 border border-border space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Change password
          </p>
          {[
            { label: "Current password", value: currentPwd, set: setCurrentPwd },
            { label: "New password", value: newPwd, set: setNewPwd },
            { label: "Confirm new password", value: confirmPwd, set: setConfirmPwd },
          ].map((f, i) => (
            <div key={i} className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.label}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground"
              />
              {i === 0 && (
                <button
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
          ))}
          <button
            onClick={validateAndSave}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-bold"
          >
            Update password
          </button>
        </div>
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorAccountSettingsPage;
