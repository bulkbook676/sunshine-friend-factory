import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, CreditCard, Clock, AlertTriangle, UserPlus, Package } from "lucide-react";

const notifications = [
  { icon: ShoppingCart, color: "text-primary", title: "New order received", desc: "Mama Nkechi Provisions ordered 50 Peak Milk Tins", time: "2 hours ago", unread: true },
  { icon: CreditCard, color: "text-success", title: "Payment received", desc: "Adamu Stores paid ₦42,000", time: "5 hours ago", unread: true },
  { icon: Clock, color: "text-warning", title: "Goodwill repayment due in 7 days", desc: "Mama Nkechi Provisions — ₦17,500", time: "Today", unread: true },
  { icon: AlertTriangle, color: "text-critical", title: "Goodwill repayment overdue", desc: "Sade Foods — ₦8,200 (3 days overdue)", time: "Yesterday", unread: false },
  { icon: Package, color: "text-primary", title: "Followed business restocked", desc: "Lagos Foods Ltd added new products", time: "2 days ago", unread: false },
  { icon: UserPlus, color: "text-sky", title: "New follower", desc: "Bola Stores started following you", time: "3 days ago", unread: false },
];

const DistributorNotificationsPage = () => {
  const navigate = useNavigate();
  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-6">Alerts and Notifications</h1>

        <div className="space-y-2">
          {notifications.map((n, idx) => {
            const Icon = n.icon;
            return (
              <div key={idx} className="bg-card rounded-2xl p-4 border border-border flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className={`w-4 h-4 ${n.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    {n.unread && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DistributorNotificationsPage;
