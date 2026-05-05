import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Copy, Check, X, Lock, ShieldOff } from "lucide-react";
import { agents } from "@/data/mockData";
import DistributorBottomNav from "@/components/DistributorBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  canGenerateAuthKey,
  issueAuthKey,
  getTotalAgentSlots,
  isAgentAuthorized,
  revokeAgent,
} from "@/data/subAccountStore";
import { toast } from "sonner";

// Mock unread recommendations status (parity with owner page).
const unreadRecs: Record<string, number> = { "1": 2, "2": 0 };

const DistributorAgentsPage = () => {
  const navigate = useNavigate();
  const { businessName } = useAuth();
  // Distributor business id — namespaced so it doesn't collide with owner accounts.
  const businessId = `distributor:${businessName || "default-distributor"}`;

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [revokeTick, setRevokeTick] = useState(0);

  const canGenerate = useMemo(() => canGenerateAuthKey(businessId), [businessId]);
  const totalSlots = useMemo(() => getTotalAgentSlots(businessId), [businessId]);
  void revokeTick;
  const usedSlots = agents.filter(
    (a) => isAgentAuthorized(businessId, a.id, ["1", "2"].includes(a.id)),
  ).length;
  const slotsAvailable = usedSlots < totalSlots;

  const generateCode = () => {
    if (!canGenerate) {
      toast.error("Generate Key is paused. Record sales activity to re-enable.");
      return;
    }
    if (!slotsAvailable) {
      navigate("/distributor/settings/billing");
      return;
    }
    try {
      const issued = issueAuthKey(businessId);
      setAuthCode(issued.code);
      setCopied(false);
      setShowCodeModal(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate key");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(authCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = (e: React.MouseEvent, agentId: string, agentName: string) => {
    e.stopPropagation();
    if (!window.confirm(`Revoke ${agentName}'s access? They'll lose access immediately.`)) return;
    revokeAgent(businessId, agentId);
    setRevokeTick((t) => t + 1);
    toast.success(`${agentName}'s access has been revoked`);
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-foreground">Sub Accounts</h1>
          <button
            onClick={generateCode}
            disabled={!canGenerate}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${
              canGenerate ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {canGenerate ? <KeyRound className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            Generate Key
          </button>
        </div>
        {!canGenerate && (
          <p className="text-[11px] text-warning mb-4">
            Generate Key is paused. Record sales activity to re-enable.
          </p>
        )}
        {canGenerate && !slotsAvailable && (
          <button
            onClick={() => navigate("/distributor/settings/billing")}
            className="text-[11px] text-primary mb-4 underline-offset-2 hover:underline"
          >
            All slots used — tap Generate Key to unlock more.
          </button>
        )}

        <div className="space-y-3">
          {agents.map((agent) => {
            const unread = unreadRecs[agent.id] || 0;
            const authorized = isAgentAuthorized(
              businessId,
              agent.id,
              ["1", "2"].includes(agent.id),
            );
            return (
              <button
                key={agent.id}
                onClick={() => navigate(`/distributor/agent/${agent.id}`)}
                className="w-full bg-card rounded-lg p-4 border border-border flex items-center gap-3 text-left relative"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 relative">
                  <span className="text-sm font-bold text-primary">{agent.name[0]}</span>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{agent.name}</p>
                    <span className={`w-2 h-2 rounded-full ${agent.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{agent.role} · {agent.lastActive}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      authorized ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>
                      {authorized ? "Authorized" : "Pending"}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-primary">{agent.todaySales}</p>
                  <p className="text-[10px] text-muted-foreground">sales today</p>
                </div>
                {authorized && (
                  <button
                    onClick={(e) => handleRevoke(e, agent.id, agent.name)}
                    aria-label={`Revoke ${agent.name}`}
                    className="ml-2 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-critical hover:bg-critical/10 shrink-0"
                  >
                    <ShieldOff className="w-4 h-4" />
                  </button>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {showCodeModal && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="bg-card rounded-2xl p-6 border border-border w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">Authorization Key</h2>
              <button onClick={() => setShowCodeModal(false)} className="text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Share this code with your agent to authorize them</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              {authCode.split("").map((digit, i) => (
                <div key={i} className="w-10 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{digit}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mb-4">Expires in 24 hours</p>
            <button
              onClick={copyCode}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
        </div>
      )}

      <DistributorBottomNav />
    </div>
  );
};

export default DistributorAgentsPage;