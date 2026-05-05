import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mic, Eye, Play, Pause, Shield, ShieldOff, Lock } from "lucide-react";
import { agents } from "@/data/mockData";
import DistributorBottomNav from "@/components/DistributorBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAgentPermissions,
  setAgentPermissions,
  setAgentAuthorization,
  isAgentAuthorized,
} from "@/data/subAccountStore";
import { Switch } from "@/components/ui/switch";

interface AgentRec {
  id: string;
  text: string;
  hasVoice: boolean;
  time: string;
  seen: boolean;
  agentName: string;
}

const DistributorAgentDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { businessName } = useAuth();
  const businessId = `distributor:${businessName || "default-distributor"}`;
  const agent = agents.find((a) => a.id === id);
  const [activeTab, setActiveTab] = useState<"activity" | "recommendations">("activity");
  const [authorized, setAuthorized] = useState<boolean>(() =>
    isAgentAuthorized(businessId, id || "", ["1", "2"].includes(id || "")),
  );
  const [perms, setPerms] = useState(() => getAgentPermissions(businessId, id || ""));
  const [recs, setRecs] = useState<AgentRec[]>([
    { id: "1", text: "Customers keep asking for Dano Cool Cow milk. We should stock it.", hasVoice: false, time: "Yesterday", seen: false, agentName: agent?.name || "Agent" },
    { id: "2", text: "Peak Milk sachets sell faster than tins this week.", hasVoice: false, time: "2 days ago", seen: true, agentName: agent?.name || "Agent" },
    { id: "3", text: "", hasVoice: true, time: "3 days ago", seen: false, agentName: agent?.name || "Agent" },
  ]);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setPerms(getAgentPermissions(businessId, id));
    setAuthorized(isAgentAuthorized(businessId, id, ["1", "2"].includes(id)));
  }, [businessId, id]);

  if (!agent) {
    return (
      <div className="app-shell dark bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Agent not found</p>
      </div>
    );
  }

  const markSeen = (recId: string) => {
    setRecs((prev) => prev.map((r) => r.id === recId ? { ...r, seen: true } : r));
  };

  const toggleAuthorization = () => {
    if (!id) return;
    const next = !authorized;
    setAgentAuthorization(businessId, id, next);
    setAuthorized(next);
    if (!next) setPerms(getAgentPermissions(businessId, id));
  };

  const toggleAddProducts = (value: boolean) => {
    if (!id) return;
    const next = setAgentPermissions(businessId, id, { addProducts: value });
    setPerms(next);
  };

  const perfData = [12, 18, 8, 22, 14, 16, agent.todaySales];
  const maxPerf = Math.max(...perfData);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const unreadCount = recs.filter((r) => !r.seen).length;

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">{agent.name[0]}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{agent.name}</h1>
            <p className="text-sm text-muted-foreground">{agent.role} · {agent.lastActive}</p>
          </div>
        </div>

        <button
          onClick={toggleAuthorization}
          className={`w-full flex items-center justify-between p-3 rounded-lg border mb-4 ${
            authorized ? "bg-success/10 border-success/30" : "bg-warning/10 border-warning/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {authorized ? <Shield className="w-4 h-4 text-success" /> : <ShieldOff className="w-4 h-4 text-warning" />}
            <span className={`text-sm font-medium ${authorized ? "text-success" : "text-warning"}`}>
              {authorized ? "Authorized" : "Pending Authorization"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {authorized ? "Tap to revoke" : "Tap to authorize"}
          </span>
        </button>

        {authorized && (
          <div className="bg-card rounded-lg p-4 border border-border mb-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
              Permissions
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">Record sales</p>
                  <p className="text-[10px] text-muted-foreground">Always on while authorized</p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <Switch checked disabled />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">View inventory</p>
                  <p className="text-[10px] text-muted-foreground">Read only</p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <Switch checked disabled />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">Add new products</p>
                  <p className="text-[10px] text-muted-foreground">Cannot edit or remove existing products</p>
                </div>
                <Switch checked={perms.addProducts} onCheckedChange={toggleAddProducts} />
              </div>
            </div>
          </div>
        )}

        <div className="flex bg-muted rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "activity" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Activity
          </button>
          <button
            onClick={() => setActiveTab("recommendations")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors relative ${
              activeTab === "recommendations" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Recommendations
            {unreadCount > 0 && activeTab !== "recommendations" && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === "activity" && (
          <>
            <div className="bg-card rounded-lg p-4 border border-border mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Performance — 7 Days</h3>
              <div className="flex items-end justify-between gap-1 h-20">
                {perfData.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-sm bg-primary" style={{ height: `${(v / maxPerf) * 100}%`, minHeight: 4 }} />
                    <span className="text-[9px] text-muted-foreground">{days[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Today's Sales</h3>
              <div className="space-y-2">
                {agent.salesLog.map((sale, i) => (
                  <div key={i} className="bg-card rounded-lg p-3 border border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{sale.product}</p>
                      <p className="text-xs text-muted-foreground">{sale.qty} units · {sale.time}</p>
                    </div>
                    <p className="text-sm font-bold text-success">₦{sale.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "recommendations" && (
          <div className="space-y-3">
            {recs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recommendations yet</p>
            ) : (
              recs.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => !rec.seen && markSeen(rec.id)}
                  className={`bg-card rounded-lg p-4 border border-border cursor-pointer transition-colors ${
                    !rec.seen ? "border-l-2 border-l-primary" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!rec.seen && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-primary">{rec.agentName}</span>
                        <span className="text-[10px] text-muted-foreground">{rec.time}</span>
                      </div>
                      {rec.text ? <p className="text-sm text-foreground">{rec.text}</p> : null}
                      {rec.hasVoice && (
                        <div className="flex items-center gap-2 mt-2 bg-muted rounded-lg px-3 py-2">
                          <button onClick={(e) => { e.stopPropagation(); setPlayingId(playingId === rec.id ? null : rec.id); }}>
                            {playingId === rec.id ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-primary" />}
                          </button>
                          <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                            <div className="h-full w-1/3 bg-primary rounded-full" />
                          </div>
                          <Mic className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-2">
                        {rec.seen ? (
                          <>
                            <Eye className="w-3 h-3 text-success" />
                            <span className="text-[10px] text-success">Seen</span>
                          </>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Tap to mark as seen</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorAgentDetailPage;