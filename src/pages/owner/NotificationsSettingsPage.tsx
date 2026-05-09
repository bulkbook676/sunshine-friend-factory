import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { Switch } from "@/components/ui/switch";

interface ToggleRow {
  key: string;
  label: string;
  description: string;
}

const ROWS: ToggleRow[] = [
  { key: "restock", label: "Restock alerts", description: "Low and critical stock warnings" },
  { key: "agent", label: "Agent activity", description: "Sales recorded by sub accounts" },
  { key: "orders", label: "New orders", description: "Distributor orders placed or updated" },
  { key: "health", label: "Health score updates", description: "Major changes to your health score" },
  { key: "feed", label: "Feed updates", description: "New articles in your feed" },
  { key: "partners", label: "Partner reports", description: "When a partner report is delivered" },
];

const NotificationsSettingsPage = () => {
  const navigate = useNavigate();
  const [master, setMaster] = useState(true);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(ROWS.map((r) => [r.key, true])),
  );

  const toggle = (key: string, value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  };

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
        <h1 className="text-lg font-bold text-foreground mb-6">Alerts and Notifications</h1>

        {/* Master */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-5 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">All notifications</p>
            <p className="text-xs text-muted-foreground">
              Master switch — turn off to silence everything
            </p>
          </div>
          <Switch checked={master} onCheckedChange={setMaster} />
        </div>

        <div className="space-y-1">
          {ROWS.map((r) => (
            <div
              key={r.key}
              className={`bg-card rounded-2xl p-4 border border-border flex items-center justify-between ${
                master ? "" : "opacity-50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{r.label}</p>
                <p className="text-[11px] text-muted-foreground">{r.description}</p>
              </div>
              <Switch
                checked={master && prefs[r.key]}
                disabled={!master}
                onCheckedChange={(v) => toggle(r.key, v)}
              />
            </div>
          ))}
        </div>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default NotificationsSettingsPage;