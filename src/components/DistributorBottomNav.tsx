import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, ClipboardList, BarChart3, Newspaper } from "lucide-react";

const DistributorBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const items = [
    { icon: Home, label: "Home", path: "/distributor" },
    { icon: Users, label: "Agents", path: "/distributor/agents" },
    { icon: ClipboardList, label: "Orders", path: "/distributor/orders" },
    { icon: BarChart3, label: "Reports", path: "/distributor/reports" },
    { icon: Newspaper, label: "Feed", path: "/distributor/feed" },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default DistributorBottomNav;
