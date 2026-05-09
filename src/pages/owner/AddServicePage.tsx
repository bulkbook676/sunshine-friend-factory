import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useService, SessionTier } from "@/contexts/ServiceContext";

const AddServicePage = () => {
  const navigate = useNavigate();
  const { addService } = useService();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tiers, setTiers] = useState<Omit<SessionTier, "id">[]>([
    { sessions: 1, duration: 30, chips: 1, price: 500 },
  ]);

  const updateTier = (idx: number, key: keyof Omit<SessionTier, "id">, value: number) => {
    setTiers(prev => prev.map((t, i) => i === idx ? { ...t, [key]: value } : t));
  };

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    setTiers(prev => [...prev, {
      sessions: last.sessions + 1,
      duration: last.duration + 30,
      chips: +(last.chips + 0.5).toFixed(1),
      price: last.price + 500,
    }]);
  };

  const removeTier = (idx: number) => {
    if (tiers.length <= 1) return;
    setTiers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    addService({
      name: name.trim(),
      description: description.trim(),
      tiers: tiers.map((t, i) => ({ ...t, id: `new-${Date.now()}-${i}` })),
    });
    navigate("/owner/services");
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-lg font-bold text-foreground mb-1">Define a Service</h1>
        <p className="text-sm text-muted-foreground mb-6">Set up your service and pricing tiers</p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Service Name</label>
            <input
              placeholder="e.g. PlayStation session, Haircut, Browsing hour"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Description</label>
            <input
              placeholder="Brief description of what this service includes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Session Tiers */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-3">Session Tiers</label>
            <div className="space-y-3">
              {tiers.map((tier, idx) => (
                <div key={idx} className="bg-card rounded-2xl p-4 border border-border relative">
                  {tiers.length > 1 && (
                    <button onClick={() => removeTier(idx)} className="absolute top-2 right-2 text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <p className="text-xs text-primary font-medium mb-3">Tier {idx + 1}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Sessions</label>
                      <input
                        type="number"
                        value={tier.sessions}
                        onChange={(e) => updateTier(idx, "sessions", +e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-input bg-muted text-foreground text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Duration (min)</label>
                      <input
                        type="number"
                        value={tier.duration}
                        onChange={(e) => updateTier(idx, "duration", +e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-input bg-muted text-foreground text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Chips</label>
                      <input
                        type="number"
                        step="0.5"
                        value={tier.chips}
                        onChange={(e) => updateTier(idx, "chips", +e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-input bg-muted text-foreground text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Price (₦)</label>
                      <input
                        type="number"
                        value={tier.price}
                        onChange={(e) => updateTier(idx, "price", +e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-input bg-muted text-foreground text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addTier}
              className="w-full mt-3 py-2.5 rounded-lg border border-dashed border-primary text-primary text-sm font-medium flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Another Session Tier
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full h-12 mt-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
          >
            Save Service
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddServicePage;
