import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Clock, Coins, ChevronRight, Edit2, ToggleLeft, ToggleRight } from "lucide-react";
import { useService } from "@/contexts/ServiceContext";
import { useAuth } from "@/contexts/AuthContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";

const ServicesChipsPage = () => {
  const navigate = useNavigate();
  const { services, chipDefinition, setChipDefinition, autoApproveChips, setAutoApproveChips, agentAllocations, addChipsToAgent } = useService();
  const [editingChipDef, setEditingChipDef] = useState(false);
  const [chipDefDraft, setChipDefDraft] = useState(chipDefinition);
  const [addChipsAgent, setAddChipsAgent] = useState<string | null>(null);
  const [chipsToAdd, setChipsToAdd] = useState("");

  const handleAddChips = () => {
    if (!addChipsAgent || !chipsToAdd) return;
    addChipsToAgent(addChipsAgent, parseFloat(chipsToAdd));
    setAddChipsAgent(null);
    setChipsToAdd("");
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-5">
        <h1 className="text-lg font-bold text-foreground mb-5">Services & Chips</h1>

        {/* My Services */}
        <h2 className="text-sm font-semibold text-foreground mb-3">My Services</h2>
        <div className="space-y-3 mb-6">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate(`/owner/service/${s.id}`)}
              className="w-full bg-card rounded-2xl p-4 border border-border text-left active:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-foreground">{s.name}</p>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mb-2">{s.description}</p>
              <div className="flex gap-3">
                {s.tiers.slice(0, 2).map((t) => (
                  <div key={t.id} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{t.duration}min · {t.chips} chip{t.chips !== 1 ? "s" : ""} · ₦{t.price}</span>
                  </div>
                ))}
              </div>
            </button>
          ))}
          {services.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No services yet. Add your first service.</p>
          )}
        </div>

        {/* Chip Management */}
        <h2 className="text-sm font-semibold text-foreground mb-3">Chip Management</h2>

        <div className="bg-card rounded-2xl p-4 border border-border mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">What does 1 chip represent?</span>
            </div>
            <button onClick={() => { setEditingChipDef(!editingChipDef); setChipDefDraft(chipDefinition); }}>
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          {editingChipDef ? (
            <div className="space-y-2">
              <input
                value={chipDefDraft}
                onChange={(e) => setChipDefDraft(e.target.value)}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground"
              />
              <button onClick={() => { setChipDefinition(chipDefDraft); setEditingChipDef(false); }} className="text-xs text-primary font-medium">Save</button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{chipDefinition}</p>
          )}
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border mb-6">
          <button
            onClick={() => setAutoApproveChips(!autoApproveChips)}
            className="w-full flex items-center justify-between"
          >
            <span className="text-sm text-foreground">Auto-approve agent chip requests</span>
            {autoApproveChips ? (
              <ToggleRight className="w-6 h-6 text-primary" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-muted-foreground" />
            )}
          </button>
          <p className="text-xs text-muted-foreground mt-1">
            {autoApproveChips ? "Chip requests are fulfilled instantly" : "You must manually approve each request"}
          </p>
        </div>

        {/* Agent Chip Allocations */}
        <h2 className="text-sm font-semibold text-foreground mb-3">Agent Chip Allocations</h2>
        <div className="space-y-2 mb-6">
          {agentAllocations.map((a) => (
            <div key={a.agentName} className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">{a.agentName}</p>
                <button
                  onClick={() => setAddChipsAgent(addChipsAgent === a.agentName ? null : a.agentName)}
                  className="text-xs px-3 py-1 rounded-lg bg-primary text-primary-foreground font-medium"
                >
                  Add Chips
                </button>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Allocated: <strong className="text-foreground">{a.allocated}</strong></span>
                <span>Used: <strong className="text-foreground">{a.used}</strong></span>
                <span>Remaining: <strong className={`${a.allocated - a.used <= 3 ? "text-critical" : "text-success"}`}>{a.allocated - a.used}</strong></span>
              </div>
              {addChipsAgent === a.agentName && (
                <div className="flex gap-2 mt-3">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={chipsToAdd}
                    onChange={(e) => setChipsToAdd(e.target.value)}
                    className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-foreground"
                  />
                  <button onClick={handleAddChips} className="px-4 py-2 rounded-lg bg-success text-primary-foreground text-sm font-medium">Add</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate("/owner/service/add")}
        className="absolute bottom-24 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-20"
      >
        <Plus className="w-6 h-6" />
      </button>

      <OwnerBottomNav />
    </div>
  );
};

export default ServicesChipsPage;
