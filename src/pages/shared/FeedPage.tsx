import { useEffect, useState } from "react";
import { ArrowLeft, X, RefreshCw, ExternalLink, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedPageProps {
  variant: "owner" | "agent";
  BottomNav: React.ComponentType;
}

interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  excerpt: string;
}

const SOURCE_FILTERS = ["All", "BusinessDay", "Nairametrics", "Punch Business", "Vanguard Business"];

/** Compact relative-time formatter (e.g. "2 hrs ago"). */
const relativeTime = (iso: string): string => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diffMin = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} hr${diffH === 1 ? "" : "s"} ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} day${diffD === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
};

const FeedPage = ({ variant, BottomNav }: FeedPageProps) => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [reading, setReading] = useState<NewsItem | null>(null);

  const load = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("market-news", {
        body: force ? { refresh: 1 } : {},
      });
      if (error) throw error;
      const list = (data?.items ?? []) as NewsItem[];
      setItems(list);
      if (data?.stale) setError("Showing cached articles — couldn't reach all sources.");
      if (!list.length) setError("No articles available right now. Pull to refresh.");
    } catch (err) {
      console.error("[Feed] failed to load:", err);
      setError("Couldn't load market news. Tap refresh to try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = filter === "All" ? items : items.filter((i) => i.source === filter);

  return (
    <div className={`app-shell ${variant === "owner" ? "dark" : ""} bg-background`}>
      <div className="page-content px-4 pt-5">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold text-foreground">Feed</h1>
          <button
            onClick={() => load(true)}
            disabled={loading}
            className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Live market news from Nigerian business sources
        </p>

        {/* Source filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto -mx-4 px-4 pb-1">
          {SOURCE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {error && !loading && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-warning">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border">
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-4 w-full mb-1.5" />
                <Skeleton className="h-4 w-4/5 mb-3" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setReading(item)}
                className="w-full bg-card rounded-2xl p-4 border border-border text-left active:opacity-80"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-primary uppercase tracking-wider font-semibold">
                    {item.source}
                  </span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">
                    {relativeTime(item.publishedAt)}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5 leading-snug">
                  {item.title}
                </h3>
                {item.excerpt && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {item.excerpt}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* In-app browser overlay */}
      {reading && (
        <div className="absolute inset-0 z-40 bg-background animate-fade-in flex flex-col">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2 border-b border-border">
            <button
              onClick={() => setReading(null)}
              className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-primary uppercase tracking-wider font-semibold truncate">
                {reading.source}
              </p>
              <p className="text-xs text-foreground truncate">{reading.title}</p>
            </div>
            <a
              href={reading.link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0"
              aria-label="Open in browser"
            >
              <ExternalLink className="w-4 h-4 text-primary-foreground" />
            </a>
          </div>
          <iframe
            src={reading.link}
            title={reading.title}
            className="flex-1 w-full"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default FeedPage;
