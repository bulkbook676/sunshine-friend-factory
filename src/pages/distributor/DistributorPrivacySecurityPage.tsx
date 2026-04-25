import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Download, Trash2 } from "lucide-react";
import DistributorBottomNav from "@/components/DistributorBottomNav";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const DistributorPrivacySecurityPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [twoFA, setTwoFA] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const onExport = () => {
    const data = JSON.stringify({ requestedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulkbook-data-export.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data export started");
  };

  const onDelete = () => {
    toast.success("Account scheduled for deletion");
    logout();
    navigate("/");
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-lg font-bold text-foreground mb-6">Privacy & Security</h1>

        <div className="bg-card rounded-lg p-4 border border-border mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Two-factor authentication</p>
              <p className="text-xs text-muted-foreground">Require a code at sign-in</p>
            </div>
          </div>
          <Switch checked={twoFA} onCheckedChange={(v) => { setTwoFA(v); toast.success(v ? "2FA enabled" : "2FA disabled"); }} />
        </div>

        <button
          onClick={onExport}
          className="w-full bg-card rounded-lg p-4 border border-border mb-3 flex items-center gap-3 active:opacity-70"
        >
          <Download className="w-5 h-5 text-primary" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">Export my data</p>
            <p className="text-xs text-muted-foreground">Download a JSON copy of your data</p>
          </div>
        </button>

        <button
          onClick={() => setConfirmDelete(true)}
          className="w-full bg-card rounded-lg p-4 border border-critical/40 flex items-center gap-3 active:opacity-70"
        >
          <Trash2 className="w-5 h-5 text-critical" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-critical">Delete my account</p>
            <p className="text-xs text-muted-foreground">Permanently remove your distributor profile</p>
          </div>
        </button>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-sm bg-card rounded-2xl p-5 border border-border">
            <h3 className="text-base font-bold text-foreground mb-2">Delete account?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This action is permanent. All your products, orders, and history will be removed.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 h-11 rounded-lg border border-border text-foreground text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="flex-1 h-11 rounded-lg bg-critical text-white text-sm font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <DistributorBottomNav />
    </div>
  );
};

export default DistributorPrivacySecurityPage;
