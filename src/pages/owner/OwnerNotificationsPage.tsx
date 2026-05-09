import { Bell, Package, Users, Zap, Settings } from "lucide-react";
import { notifications } from "@/data/mockData";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const iconMap: Record<string, any> = {
  restock: Package,
  agent: Users,
  insight: Zap,
  system: Settings,
};

const colorMap: Record<string, string> = {
  restock: "bg-warning/10 text-warning",
  agent: "bg-primary/10 text-primary",
  insight: "bg-sky/10 text-sky",
  system: "bg-muted text-muted-foreground",
};

const OwnerNotificationsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-lg font-bold text-foreground mb-4">Alerts and Notifications</h1>

        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = iconMap[n.type] || Bell;
            return (
              <div key={n.id} className={`bg-card rounded-lg p-4 border border-border flex gap-3 ${!n.read ? "border-l-2 border-l-primary" : ""}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorMap[n.type]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default OwnerNotificationsPage;
