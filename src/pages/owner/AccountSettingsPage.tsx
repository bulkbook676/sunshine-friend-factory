import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { toast } from "sonner";

/**
 * Account settings — phone (display + change) and password change.
 * All operations are mock; real wiring will live behind Cloud auth.
 */
const AccountSettingsPage = () => {
  const navigate = useNavigate();

  // Display values — would normally come from the auth context.
  const [phone] = useState("+234 803 555 1234");

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const validateAndSave = () => {
    if (!currentPwd) {
      toast.error("Enter your current password");
      return;
    }
    if (newPwd.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPwd === currentPwd) {
      toast.error("New password must differ from current");
      return;
    }
    toast.success("Password updated");
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
  };

  const inputCls =
    "w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground";

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-lg font-bold text-foreground mb-6">Account</h1>

        {/* Phone */}
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
          Phone number
        </p>
        <div className="bg-card rounded-2xl p-4 border border-border mb-6 flex items-center justify-between">
          <p className="text-sm text-foreground tabular-nums">{phone}</p>
          <button
            onClick={() => toast.info("Phone change requires verification")}
            className="text-xs text-primary font-medium"
          >
            Change
          </button>
        </div>

        {/* Password */}
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
          Change password
        </p>
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3 mb-6">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">
              Current password
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="Enter current password"
                className={inputCls}
              />
              <button
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPwd ? "Hide" : "Show"}
                type="button"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">
              New password
            </label>
            <input
              type={showPwd ? "text" : "password"}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="At least 8 characters"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">
              Confirm new password
            </label>
            <input
              type={showPwd ? "text" : "password"}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="Repeat new password"
              className={inputCls}
            />
          </div>
        </div>

        <button
          onClick={validateAndSave}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
        >
          Update password
        </button>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default AccountSettingsPage;