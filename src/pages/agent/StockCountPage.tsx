import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Send } from "lucide-react";
import { products } from "@/data/mockData";
import AgentBottomNav from "@/components/AgentBottomNav";

const StockCountPage = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return ["All", ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = category === "All" || p.category === category;
      const matchSearch =
        !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const updateCount = (id: string, val: string) => {
    setCounts((prev) => ({ ...prev, [id]: val }));
  };

  if (submitted) {
    return (
      <div className="app-shell bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in px-6">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Send className="w-7 h-7 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Count Submitted</h2>
          <p className="text-sm text-muted-foreground mt-1">Your stock count has been sent to the owner</p>
          <button onClick={() => navigate("/agent")} className="mt-6 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell bg-background">
      <div className="page-content px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-xl font-bold text-foreground mb-2">Stock Count</h1>
        <p className="text-sm text-muted-foreground mb-6">Enter the physical count for each product</p>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                category === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No products match your search.</p>
          )}
          {filtered.map((p) => {
            return (
              <div key={p.id} className="bg-card rounded-xl p-4 border border-border">
                <p className="text-sm font-medium text-foreground mb-2">{p.name}</p>
                <input
                  type="number"
                  placeholder="Physical count"
                  value={counts[p.id] || ""}
                  onChange={(e) => updateCount(p.id, e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setSubmitted(true)}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base mt-6 mb-4"
        >
          Submit Count
        </button>
      </div>
      <AgentBottomNav />
    </div>
  );
};

export default StockCountPage;
