import { Bell, TrendingDown, Heart, Home, Tag } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const notifications = [
  {
    icon: TrendingDown,
    title: "Price Drop Alert",
    desc: "Marina Gate III dropped to AED 170,000/yr",
    time: "2h ago",
    color: "text-green-400",
  },
  {
    icon: Heart,
    title: "Listing Liked",
    desc: "Your saved property got 200+ new likes",
    time: "5h ago",
    color: "text-destructive",
  },
  {
    icon: Home,
    title: "New Match",
    desc: "New 3BR in DIFC matches your saved search",
    time: "1d ago",
    color: "text-primary",
  },
  {
    icon: Tag,
    title: "Exclusive Listing",
    desc: "A new off-market villa is available in Palm Jumeirah",
    time: "2d ago",
    color: "text-primary",
  },
];

const NotificationsPage = () => {
  return (
    <div className="h-dvh bg-background flex flex-col">
      <div className="pt-12 px-5 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground italic">Alerts and Notifications</h1>
          <Bell className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-24">
        {notifications.map((notif, i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-5 py-4 border-b border-border/50 hover:bg-secondary/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <notif.icon className={`w-4 h-4 ${notif.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-medium text-foreground">{notif.title}</p>
              <p className="font-body text-xs text-muted-foreground mt-0.5">{notif.desc}</p>
            </div>
            <span className="font-body text-[10px] text-muted-foreground flex-shrink-0">{notif.time}</span>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default NotificationsPage;
