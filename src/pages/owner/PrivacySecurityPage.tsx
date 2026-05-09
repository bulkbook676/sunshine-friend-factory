import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Download, Trash2, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const PrivacySecurityPage = () => {
  const navigate = useNavigate();
  const { logout, role } = useAuth();

  const [twoFA, setTwoFA] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const onChangePin = () => {
    if (pin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }
    toast.success("PIN updated");
    setPin("");
    setPinModal(false);
  };

  const onExport = () => {
    const blob = new Blob(
      [JSON.stringify({ requestedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulkbook-data-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data export ready");
  };

  const onDelete = () => {
    toast.success("Account scheduled for deletion in 14 days");
    logout();
    navigate("/");
  };

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
        <h1 className="text-lg font-bold text-foreground mb-6">
          Password and Security
        </h1>

        {/* Two-factor */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-3 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Two-factor authentication
              </p>
              <p className="text-[11px] text-muted-foreground">
                Require a code on every login
              </p>
            </div>
          </div>
          <Switch checked={twoFA} onCheckedChange={setTwoFA} />
        </div>

        {/* Change PIN (agents only — show always but agents see it most) */}
        {role === "agent" && (
          <button
            onClick={() => setPinModal(true)}
            className="w-full bg-card rounded-2xl p-4 border border-border mb-3 flex items-center gap-3"
          >
            <KeyRound className="w-4 h-4 text-foreground" />
            <div className="flex-1 text-left">
              <p className="text-sm text-foreground">Change PIN</p>
              <p className="text-[11px] text-muted-foreground">
                Update your 4-digit access PIN
              </p>
            </div>
          </button>
        )}

        {/* Export */}
        <button
          onClick={onExport}
          className="w-full bg-card rounded-2xl p-4 border border-border mb-3 flex items-center gap-3"
        >
          <Download className="w-4 h-4 text-foreground" />
          <div className="flex-1 text-left">
            <p className="text-sm text-foreground">Export my data</p>
            <p className="text-[11px] text-muted-foreground">
              Download a copy of your account data
            </p>
          </div>
        </button>

        {/* Delete */}
        <button
          onClick={() => setConfirmDelete(true)}
          className="w-full bg-critical/10 border border-critical/30 rounded-lg p-4 flex items-center gap-3"
        >
          <Trash2 className="w-4 h-4 text-critical" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-critical">Delete account</p>
            <p className="text-[11px] text-critical/80">
              Permanent — 14 day grace period
            </p>
          </div>
        </button>
      </div>

      {pinModal && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="bg-card rounded-2xl p-5 border border-border w-full max-w-sm">
            <h2 className="text-base font-bold text-foreground mb-3">
              Change PIN
            </h2>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="••••"
              className="w-full bg-muted border border-border rounded-lg px-3 py-3 text-center text-xl tracking-[0.5em] text-foreground mb-4"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setPinModal(false);
                  setPin("");
                }}
                className="py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={onChangePin}
                className="py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="bg-card rounded-2xl p-5 border border-border w-full max-w-sm">
            <h2 className="text-base font-bold text-foreground mb-2">
              Delete account?
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              This permanently removes your business, sales, inventory and
              partners after a 14 day grace period. You can reactivate within
              that window.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="py-2.5 rounded-xl bg-critical text-primary-foreground text-sm font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <OwnerBottomNav />
    </div>
  );
};

export default PrivacySecurityPage;