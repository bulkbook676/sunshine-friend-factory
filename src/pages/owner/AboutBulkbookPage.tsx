import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Lock,
  HelpCircle,
  Star,
  ChevronRight,
} from "lucide-react";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { toast } from "sonner";

const APP_VERSION = "1.0.0";

const AboutBulkbookPage = () => {
  const navigate = useNavigate();

  const open = (label: string) => toast.info(`${label} — coming soon`);

  const items = [
    { icon: FileText, label: "Terms of service", action: () => open("Terms of service") },
    { icon: Lock, label: "Privacy policy", action: () => open("Privacy policy") },
    { icon: HelpCircle, label: "Contact support", action: () => open("Contact support") },
    { icon: Star, label: "Rate the app", action: () => open("Rate the app") },
  ];

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
          About This App
        </h1>

        <div className="bg-card rounded-2xl p-5 border border-border mb-5 text-center">
          <p className="text-2xl font-bold text-primary mb-1">Bulkbook</p>
          <p className="text-xs text-muted-foreground">
            Version {APP_VERSION}
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {items.map((item, i) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${
                i < items.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground flex-1">
                {item.label}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-6">
          © {new Date().getFullYear()} Bulkbook. Made for Nigerian businesses.
        </p>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default AboutBulkbookPage;