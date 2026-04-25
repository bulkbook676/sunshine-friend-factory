import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Mail, AtSign, X, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DistributorBottomNav from "@/components/DistributorBottomNav";
import { toast } from "sonner";
import {
  addPartner,
  listPartners,
  removePartner,
  updatePartnerFrequency,
  markReportSent,
  type ReportFrequency,
} from "@/data/partnersStore";

// Distributor-facing labels (maps to existing ReportFrequency keys)
const DIST_FREQUENCY_LABELS: Record<ReportFrequency, string> = {
  monthly: "Monthly",
  quarterly: "Every 3 months",
  biannual: "Every 6 months",
};

const DistributorPartnersPage = () => {
  const navigate = useNavigate();
  const { businessName } = useAuth();
  const businessId = `dist-${businessName || "default"}`;

  const [contact, setContact] = useState("");
  const [frequency, setFrequency] = useState<ReportFrequency>("monthly");
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);

  const partners = listPartners(businessId);

  const handleAdd = () => {
    const result = addPartner(businessId, contact, frequency);
    if ("error" in result) return toast.error(result.error);
    toast.success(`Added ${result.displayName}`);
    setContact("");
    refresh();
  };

  const fmt = (iso?: string) =>
    !iso
      ? "Never"
      : new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-lg font-bold text-foreground mb-1">Business Partners</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Share your distributor performance reports with trusted partners or investors.
        </p>

        <div className="bg-card rounded-lg p-4 border border-border mb-6">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
            Add partner
          </p>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Email address or Bulkbook username"
            className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground mb-3"
          />
          <div className="grid grid-cols-3 gap-2 mb-3">
            {(Object.keys(DIST_FREQUENCY_LABELS) as ReportFrequency[]).map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`px-2 py-2 rounded-lg text-[11px] font-medium border ${
                  frequency === f
                    ? "bg-primary/10 border-primary text-foreground"
                    : "bg-muted border-border text-muted-foreground"
                }`}
              >
                {DIST_FREQUENCY_LABELS[f]}
              </button>
            ))}
          </div>
          <button
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
          >
            <UserPlus className="w-4 h-4" />
            Add Partner
          </button>
        </div>

        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
          Partners ({partners.length})
        </p>
        {partners.length === 0 ? (
          <div className="bg-card rounded-lg p-4 border border-border text-center">
            <p className="text-sm text-muted-foreground">No partners yet. Add one above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {partners.map((p) => (
              <div key={p.id} className="bg-card rounded-lg p-3 border border-border">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {p.channel === "email" ? (
                      <Mail className="w-4 h-4 text-primary" />
                    ) : (
                      <AtSign className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.contact}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Last sent: {fmt(p.lastSentAt)}</p>
                  </div>
                  <button
                    onClick={() => {
                      removePartner(businessId, p.id);
                      toast.success(`Removed ${p.displayName}`);
                      refresh();
                    }}
                    className="text-muted-foreground"
                    aria-label="Remove partner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {(Object.keys(DIST_FREQUENCY_LABELS) as ReportFrequency[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        updatePartnerFrequency(businessId, p.id, f);
                        refresh();
                      }}
                      className={`px-1 py-1.5 rounded-md text-[10px] font-medium border ${
                        p.frequency === f
                          ? "bg-primary/10 border-primary text-foreground"
                          : "bg-muted/50 border-border text-muted-foreground"
                      }`}
                    >
                      {DIST_FREQUENCY_LABELS[f]}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    markReportSent(businessId, p.id);
                    toast.success(`Report queued for ${p.displayName}`);
                    refresh();
                  }}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted text-foreground text-xs font-medium"
                >
                  <Send className="w-3 h-3" />
                  Send report now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorPartnersPage;
