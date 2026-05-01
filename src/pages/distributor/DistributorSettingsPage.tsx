import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Pencil, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDistributor } from "@/contexts/DistributorContext";
import DistributorBottomNav from "@/components/DistributorBottomNav";
import ProfileSummaryCard from "@/components/ProfileSummaryCard";
import { toast } from "sonner";

const DistributorSettingsPage = () => {
  const navigate = useNavigate();
  const { logout, businessName, userName } = useAuth();
  const { autoApproveGoodwill, defaultGoodwillDays, setProfile } = useDistributor();
  const [editingRepayment, setEditingRepayment] = useState(false);
  const [draftRepayment, setDraftRepayment] = useState<string>(defaultGoodwillDays.toString());
  const [customMode, setCustomMode] = useState(false);

  const saveRepayment = () => {
    const next = parseInt(draftRepayment);
    if (!next || next <= 0) {
      toast.error("Enter a valid number of days");
      return;
    }
    setProfile({ defaultGoodwillDays: next });
    setEditingRepayment(false);
    setCustomMode(false);
    toast.success(`Repayment period set to ${next} days`);
  };

  const accountSection = {
    title: "Account",
    items: [
      { label: "Business Profile", action: () => navigate("/distributor/profile") },
      { label: "Phone & Password", action: () => navigate("/distributor/settings/account") },
      { label: "Agents", action: () => navigate("/distributor/agents") },
    ],
  };

  const otherSection = {
    title: "Other",
    items: [
      { label: "Notifications", action: () => navigate("/distributor/settings/notifications") },
      { label: "Partners", action: () => navigate("/distributor/settings/partners") },
      { label: "Billing", action: () => navigate("/distributor/settings/billing") },
      { label: "Privacy & Security", action: () => navigate("/distributor/settings/privacy") },
      { label: "About Bulkbook", action: () => navigate("/distributor/settings/about") },
    ],
  };

  const presetMatch = [30, 60, 90].includes(parseInt(draftRepayment));

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

        {/* Profile card */}
        <ProfileSummaryCard
          name={userName || "Tunde Adebayo"}
          role="Distributor"
          business={businessName || "Adebayo Wholesale Depot"}
          bio="Verified bulk supplier serving 38 retailers across Lagos & Ogun State."
          followers={2147}
          following={89}
          totalSales="₦18.5M"
        />

        {/* Account */}
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
            {accountSection.title}
          </h3>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {accountSection.items.map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                className={`w-full flex items-center justify-between p-4 active:opacity-70 ${
                  idx > 0 ? "border-t border-border" : ""
                }`}
              >
                <span className="text-sm text-foreground text-left">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Goodwill Settings */}
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
            Goodwill Settings
          </h3>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {/* Repayment period — view + edit */}
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Default repayment period</p>
              {editingRepayment ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={customMode || !presetMatch ? "custom" : draftRepayment}
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setCustomMode(true);
                        } else {
                          setCustomMode(false);
                          setDraftRepayment(e.target.value);
                        }
                      }}
                      className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="30">30 days</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                      <option value="custom">Custom…</option>
                    </select>
                    <button
                      onClick={saveRepayment}
                      className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center"
                      aria-label="Save"
                    >
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </button>
                  </div>
                  {(customMode || !presetMatch) && (
                    <input
                      type="number"
                      value={draftRepayment}
                      onChange={(e) => setDraftRepayment(e.target.value)}
                      placeholder="Days"
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{defaultGoodwillDays} days</span>
                  <button
                    onClick={() => {
                      setDraftRepayment(defaultGoodwillDays.toString());
                      setCustomMode(![30, 60, 90].includes(defaultGoodwillDays));
                      setEditingRepayment(true);
                    }}
                    className="flex items-center gap-1 text-xs text-primary font-medium px-2 py-1 rounded hover:bg-primary/10"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                </div>
              )}
            </div>
            {/* Auto-approve */}
            <button
              onClick={() => setProfile({ autoApproveGoodwill: !autoApproveGoodwill })}
              className="w-full flex items-center justify-between p-4 border-t border-border active:opacity-70"
            >
              <span className="text-sm text-foreground text-left">
                {autoApproveGoodwill ? "Auto-approve goodwill orders: ON" : "Auto-approve goodwill orders: OFF"}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Other */}
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
            {otherSection.title}
          </h3>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {otherSection.items.map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                className={`w-full flex items-center justify-between p-4 active:opacity-70 ${
                  idx > 0 ? "border-t border-border" : ""
                }`}
              >
                <span className="text-sm text-foreground text-left">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="w-full h-12 rounded-lg border border-critical text-critical text-sm font-semibold mb-6"
        >
          Log Out
        </button>
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorSettingsPage;
