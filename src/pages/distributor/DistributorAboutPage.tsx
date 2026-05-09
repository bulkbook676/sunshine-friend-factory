import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import DistributorBottomNav from "@/components/DistributorBottomNav";
import { toast } from "sonner";

const APP_VERSION = "1.0.0";

const DistributorAboutPage = () => {
  const navigate = useNavigate();
  const open = (label: string) => toast.info(`${label} — coming soon`);

  const items = [
    { label: "Terms of service" },
    { label: "Privacy policy" },
    { label: "Contact support" },
    { label: "Rate the app" },
  ];

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-lg font-bold text-foreground mb-6">About This App</h1>

        <div className="bg-card rounded-lg p-4 border border-border mb-5">
          <p className="text-xs text-muted-foreground mb-1">Version</p>
          <p className="text-base font-bold text-foreground">Bulkbook {APP_VERSION}</p>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => open(item.label)}
              className={`w-full flex items-center justify-between p-4 active:opacity-70 ${
                idx > 0 ? "border-t border-border" : ""
              }`}
            >
              <span className="text-sm text-foreground text-left">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Bulkbook
        </p>
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorAboutPage;
