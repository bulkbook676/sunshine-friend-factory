import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDistributor } from "@/contexts/DistributorContext";
import { toast } from "sonner";

const CATEGORIES = ["Dairy", "Beverages", "Grains", "Provisions", "Cosmetics", "Electronics", "Building Materials", "Other"];

const DistributorProfilePage = () => {
  const navigate = useNavigate();
  const { businessName } = useAuth();
  const dist = useDistributor();
  const [form, setForm] = useState({
    businessName: dist.businessName || businessName,
    state: dist.state,
    area: dist.area,
    freeShippingThreshold: dist.freeShippingThreshold?.toString() || "",
    defaultGoodwillDays: dist.defaultGoodwillDays.toString(),
  });
  const [categories, setCategories] = useState<string[]>(dist.categories);

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const toggleCat = (c: string) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const save = () => {
    dist.setProfile({
      businessName: form.businessName,
      state: form.state,
      area: form.area,
      categories,
      freeShippingThreshold: form.freeShippingThreshold ? parseFloat(form.freeShippingThreshold) : undefined,
      defaultGoodwillDays: parseInt(form.defaultGoodwillDays) || 30,
    });
    toast.success("Profile updated");
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-5 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-6">Your Business Details</h1>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Business Name</label>
            <input
              value={form.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">State</label>
              <input
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Area</label>
              <input
                value={form.area}
                onChange={(e) => update("area", e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleCat(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    categories.includes(c)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Free Shipping Threshold (₦)</label>
            <input
              type="number"
              placeholder="Leave blank if not offering"
              value={form.freeShippingThreshold}
              onChange={(e) => update("freeShippingThreshold", e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Default Goodwill Repayment (days)</label>
            <select
              value={form.defaultGoodwillDays}
              onChange={(e) => update("defaultGoodwillDays", e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>

          <button
            onClick={save}
            className="w-full h-12 mt-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DistributorProfilePage;
