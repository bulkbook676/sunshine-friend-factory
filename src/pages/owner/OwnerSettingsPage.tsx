import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  User,
  CreditCard,
  Info,
  ChevronRight,
  LogOut,
  Bell,
  Lock,
  Users,
  ClipboardCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import ProfileSummaryCard from "@/components/ProfileSummaryCard";

const OwnerSettingsPage = () => {
  const navigate = useNavigate();
  const { logout, businessName, userName } = useAuth();

  const sections = [
    {
      title: "Business Profile",
      items: [
        {
          icon: Building2,
          label: "Business name, location, type",
          action: () => navigate("/owner/settings/business-profile"),
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Phone number, password",
          action: () => navigate("/owner/settings/account"),
        },
      ],
    },
    {
      title: "Billing",
      items: [
        { icon: CreditCard, label: "Sub account plan & upgrade", action: () => navigate("/owner/billing") },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: Bell,
          label: "Manage alerts and updates",
          action: () => navigate("/owner/settings/notifications"),
        },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        {
          icon: Lock,
          label: "2FA, data export, delete account",
          action: () => navigate("/owner/settings/privacy"),
        },
      ],
    },
    {
      title: "Partners",
      items: [
        {
          icon: Users,
          label: "Share health reports with partners",
          action: () => navigate("/owner/settings/partners"),
        },
      ],
    },
    {
      title: "Audit",
      items: [
        {
          icon: ClipboardCheck,
          label: "Stock audit — review agent counts",
          action: () => navigate("/owner/stock-audit"),
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          icon: Info,
          label: "About Bulkbook",
          action: () => navigate("/owner/settings/about"),
        },
      ],
    },
  ];

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-lg font-bold text-foreground mb-6">Settings</h1>

        {/* Profile card */}
        <ProfileSummaryCard
          name={userName || "Nkechi Okafor"}
          role="Owner"
          business={businessName || "Mama Nkechi Provisions"}
          bio="Building Mama Nkechi into the most reliable provisions store in Surulere."
          followers={1284}
          following={342}
          totalSales="₦4.2M"
        />

        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">{section.title}</p>
            {section.items.map((item: any, i) => (
              <button key={i} onClick={item.action} className="w-full flex items-center gap-3 py-3 border-b border-border last:border-0">
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 text-left">
                  <span className="text-sm text-foreground block">{item.label}</span>
                  {item.sublabel && <span className="text-[10px] text-primary">{item.sublabel}</span>}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        ))}

        <button
          onClick={() => { logout(); navigate("/"); }}
          className="w-full flex items-center gap-3 py-3 text-critical mt-4"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default OwnerSettingsPage;
