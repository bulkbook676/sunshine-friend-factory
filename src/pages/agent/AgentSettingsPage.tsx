import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Lock, Building2, ChevronRight, LogOut, Send, Mic, Square, Play, Pause, Eye, EyeOff, X, Swords, Check, FileText, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AgentBottomNav from "@/components/AgentBottomNav";
import { redeemAuthKey } from "@/data/subAccountStore";

interface Rec {
  id: string;
  text: string;
  hasVoice: boolean;
  time: string;
  seen: boolean;
}

const AgentSettingsPage = () => {
  const navigate = useNavigate();
  const { logout, userName, businessName, isAuthorized, setAuthorized, setLinkedBusiness, userId } = useAuth();
  const [activeSection, setActiveSection] = useState<"menu" | "linked" | "challenge" | "profile">("menu");
  const [recText, setRecText] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [playingBack, setPlayingBack] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recs, setRecs] = useState<Rec[]>([
    { id: "1", text: "Customers keep asking for Dano Cool Cow milk. We should stock it.", hasVoice: false, time: "Yesterday", seen: true },
    { id: "2", text: "The Dangote Sugar 500g is almost finished but many people are coming for it.", hasVoice: false, time: "2 days ago", seen: true },
    { id: "3", text: "", hasVoice: true, time: "3 days ago", seen: false },
  ]);

  // Auth code state
  const [authCode, setAuthCode] = useState(["", "", "", "", "", ""]);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState(false);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Challenge state
  const [challengeUser, setChallengeUser] = useState("");
  const [challengeMetric, setChallengeMetric] = useState<"units" | "revenue">("units");
  const [challengePeriod, setChallengePeriod] = useState<"today" | "week" | "month">("week");
  const [challengeTarget, setChallengeTarget] = useState("");
  const [challengeSent, setChallengeSent] = useState(false);

  const startRecording = () => {
    setRecording(true);
    setRecordDuration(0);
    timerRef.current = setInterval(() => {
      setRecordDuration((d) => d + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setHasRecording(true);
  };

  const handleSend = () => {
    if (!recText.trim() && !hasRecording) return;
    setRecs([
      { id: Date.now().toString(), text: recText, hasVoice: hasRecording, time: "Just now", seen: false },
      ...recs,
    ]);
    setRecText("");
    setHasRecording(false);
    setRecordDuration(0);
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...authCode];
    newCode[index] = value.slice(-1);
    setAuthCode(newCode);
    setAuthError("");
    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !authCode[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleAuthorize = () => {
    const code = authCode.join("");
    if (code.length < 6) {
      setAuthError("Please enter the full 6-digit code");
      return;
    }
    try {
      const linkedBusinessId = redeemAuthKey(code, userId || `agent-${userName || "anon"}`);
      setAuthorized(true);
      setLinkedBusiness(linkedBusinessId, linkedBusinessId);
      setAuthSuccess(true);
      setAuthError("");
      setTimeout(() => {
        setAuthSuccess(false);
        setActiveSection("linked");
      }, 1800);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Could not authorize. Try again.");
    }
  };

  const handleSendChallenge = () => {
    if (!challengeUser.trim() || !challengeTarget) return;
    setChallengeSent(true);
    setTimeout(() => setChallengeSent(false), 3000);
  };

  const handleDownloadCV = () => {
    // Generate a simple text-based CV as a downloadable file
    const cvContent = `
BULKBOOK VERIFIED SALES RECORD
================================

Agent Name: ${userName || "Chidi Okonkwo"}
Business: ${businessName || "Mama Nkechi Provisions"}
Location: Lagos, Nigeria
Period of Activity: 15 Jan 2025 — 31 Mar 2026

SALES SUMMARY
--------------
Total Sales Count: 1,247
Total Sales Value: ₦247,500
Average Daily Sales: 8.3 units/day

TOP PRODUCTS SOLD
------------------
1. Indomie Chicken — 482 units
2. Dangote Sugar — 318 units
3. Peak Milk — 247 units

BEST PERFORMING PERIODS
------------------------
Best Month: February 2026 (₦38,500)
Best Week: Week 3, Feb 2026 (₦12,200)

CONSISTENCY SCORE
------------------
78% of working days had recorded sales

CHALLENGES COMPLETED
---------------------
3 challenges completed, 2 won

COLLABORATIONS
---------------
12 sales credited through collaboration

================================
Generated by Bulkbook — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
`;
    const blob = new Blob([cvContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bulkbook_Sales_CV_${(userName || "Agent").replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auth code gate for linked business when unauthorized
  if (activeSection === "linked" && !isAuthorized && !authSuccess) {
    return (
      <div className="app-shell bg-background">
        <div className="page-content px-4 pt-4">
          <button onClick={() => setActiveSection("menu")} className="flex items-center gap-1 text-muted-foreground mb-8">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>

          <div className="flex flex-col items-center pt-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Enter your authorization code</h1>
            <p className="text-sm text-muted-foreground mb-8 text-center">Get this code from your business owner</p>

            <div className="flex gap-2 mb-4">
              {authCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { codeRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  className="w-12 h-14 rounded-xl bg-card border border-border text-center text-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              ))}
            </div>

            {authError && <p className="text-sm text-destructive mb-4">{authError}</p>}

            <button
              onClick={handleAuthorize}
              className="w-full max-w-xs py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
            >
              Authorize
            </button>
          </div>
        </div>
        <AgentBottomNav />
      </div>
    );
  }

  // Auth success screen
  if (authSuccess) {
    return (
      <div className="app-shell bg-background flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">You are now authorized</h2>
          <p className="text-sm text-muted-foreground">Welcome to {businessName || "your business"}.</p>
        </div>
      </div>
    );
  }

  // Challenge a Friend
  if (activeSection === "challenge") {
    return (
      <div className="app-shell bg-background">
        <div className="page-content px-4 pt-4">
          <button onClick={() => setActiveSection("menu")} className="flex items-center gap-1 text-muted-foreground mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>

          <h1 className="text-xl font-bold text-foreground mb-1">Challenge a Friend</h1>
          <p className="text-sm text-muted-foreground mb-6">Compete with another agent to hit a target</p>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Who do you want to challenge?</label>
              <input
                type="text"
                placeholder="Enter agent username"
                value={challengeUser}
                onChange={(e) => setChallengeUser(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Target metric</label>
              <div className="flex bg-muted rounded-xl p-1">
                <button
                  onClick={() => setChallengeMetric("units")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    challengeMetric === "units" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  Units Sold
                </button>
                <button
                  onClick={() => setChallengeMetric("revenue")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    challengeMetric === "revenue" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  Revenue
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Time period</label>
              <div className="flex bg-muted rounded-xl p-1">
                {(["today", "week", "month"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setChallengePeriod(p)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      challengePeriod === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Target {challengeMetric === "units" ? "units" : "amount (₦)"}
              </label>
              <input
                type="number"
                placeholder={challengeMetric === "units" ? "e.g. 50" : "e.g. 25000"}
                value={challengeTarget}
                onChange={(e) => setChallengeTarget(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <button
              onClick={handleSendChallenge}
              disabled={!challengeUser.trim() || !challengeTarget}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Swords className="w-4 h-4" />
              Send Challenge
            </button>

            {challengeSent && (
              <div className="bg-success/10 border border-success/20 rounded-xl p-3 text-center animate-fade-in">
                <p className="text-sm text-success font-medium">Challenge sent to {challengeUser}!</p>
                <p className="text-xs text-muted-foreground mt-1">Waiting for them to accept</p>
              </div>
            )}
          </div>
        </div>
        <AgentBottomNav />
      </div>
    );
  }

  // Personal Profile with Sales History CV
  if (activeSection === "profile") {
    return (
      <div className="app-shell bg-background">
        <div className="page-content px-4 pt-4 pb-6">
          <button onClick={() => setActiveSection("menu")} className="flex items-center gap-1 text-muted-foreground mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>

          <h1 className="text-xl font-bold text-foreground mb-1">Personal Profile</h1>
          <p className="text-sm text-muted-foreground mb-6">{userName || "Chidi Okonkwo"}</p>

          {/* Profile info */}
          <div className="bg-card rounded-2xl p-4 border border-border mb-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Full Name</span>
                <span className="text-sm font-medium text-foreground">{userName || "Chidi Okonkwo"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Role</span>
                <span className="text-sm font-medium text-foreground">Sales Agent</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Business</span>
                <span className="text-sm font-medium text-foreground">{businessName || "Mama Nkechi Provisions"}</span>
              </div>
            </div>
          </div>

          {/* Sales History & CV */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Sales History & CV</h2>
            </div>

            <div className="bg-card rounded-2xl p-4 border border-border space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Total Sales (All Time)</span>
                <span className="text-sm font-bold text-foreground">1,247 sales · ₦247,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">First Sale Date</span>
                <span className="text-sm font-medium text-foreground">15 Jan 2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Best Month</span>
                <span className="text-sm font-medium text-success">Feb 2026 — ₦38,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Avg Daily Sales</span>
                <span className="text-sm font-medium text-foreground">8.3 units</span>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-4 border border-border mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Top 3 Products (All Time)</h3>
              <div className="space-y-2">
                {[
                  { name: "Indomie Chicken", qty: 482 },
                  { name: "Dangote Sugar", qty: 318 },
                  { name: "Peak Milk", qty: 247 },
                ].map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">{i + 1}.</span>
                      <span className="text-sm text-foreground">{p.name}</span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{p.qty} units</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleDownloadCV}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download CV
            </button>
          </div>
        </div>
        <AgentBottomNav />
      </div>
    );
  }

  // Linked Business Page with Recommendations
  if (activeSection === "linked") {
    return (
      <div className="app-shell bg-background">
        <div className="page-content px-4 pt-4">
          <button onClick={() => setActiveSection("menu")} className="flex items-center gap-1 text-muted-foreground mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>

          <h1 className="text-xl font-bold text-foreground mb-1">Linked Business</h1>
          <p className="text-sm text-muted-foreground mb-6">{businessName || "Mama Nkechi Provisions"}</p>

          {/* Business info card */}
          <div className="bg-card rounded-2xl p-4 border border-border mb-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Business Name</span>
                <span className="text-sm font-medium text-foreground">{businessName || "Mama Nkechi Provisions"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Your Role</span>
                <span className="text-sm font-medium text-foreground">Sales Agent</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Joined</span>
                <span className="text-sm font-medium text-foreground">15 Jan 2025</span>
              </div>
            </div>
          </div>

          {/* Recommendations Section */}
          <div className="mb-6">
            <h2 className="text-base font-bold text-foreground mb-1">Send a Recommendation</h2>
            <p className="text-xs text-muted-foreground mb-4">Share what you're seeing on the ground with your business owner</p>

            <textarea
              placeholder="Type your observation or suggestion…"
              value={recText}
              onChange={(e) => setRecText(e.target.value)}
              rows={3}
              className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3"
            />

            <div className="mb-3">
              {!recording && !hasRecording && (
                <button
                  onMouseDown={startRecording}
                  onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm"
                >
                  <Mic className="w-4 h-4" />
                  Hold to Record
                </button>
              )}

              {recording && (
                <button
                  onMouseUp={stopRecording}
                  onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm w-full"
                >
                  <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                  <span className="flex-1 text-left">Recording... {formatDuration(recordDuration)}</span>
                  <div className="flex items-center gap-0.5">
                    {[3, 5, 2, 6, 4, 3, 5].map((h, i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-destructive rounded-full animate-pulse"
                        style={{ height: `${h * 3}px`, animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <Square className="w-4 h-4" />
                </button>
              )}

              {hasRecording && !recording && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-success/10 text-success text-sm">
                  <button onClick={() => setPlayingBack(!playingBack)}>
                    {playingBack ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 h-1 bg-success/20 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-success rounded-full" />
                  </div>
                  <span className="text-xs">{formatDuration(recordDuration)}</span>
                  <button onClick={() => { setHasRecording(false); setRecordDuration(0); }}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={!recText.trim() && !hasRecording}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Send Recommendation
            </button>
          </div>

          <h3 className="text-sm font-semibold text-foreground mb-3">Past Recommendations</h3>
          <div className="space-y-2">
            {recs.map((rec) => (
              <div key={rec.id} className="bg-card rounded-xl p-4 border border-border">
                {rec.text ? (
                  <p className="text-sm text-foreground">{rec.text}</p>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mic className="w-3.5 h-3.5" />
                    <span>Voice message</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">{rec.time}</span>
                  <div className="flex items-center gap-1">
                    {rec.seen ? (
                      <>
                        <Eye className="w-3 h-3 text-success" />
                        <span className="text-[10px] text-success">Seen</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">Pending</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <AgentBottomNav />
      </div>
    );
  }

  // Main settings menu
  return (
    <div className="app-shell bg-background">
      <div className="page-content px-4 pt-4">
        <h1 className="text-xl font-bold text-foreground mb-6">Settings</h1>

        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">{(userName || "C")[0]}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{userName || "Chidi Okonkwo"}</p>
            <p className="text-xs text-muted-foreground">Agent</p>
          </div>
        </div>

        <div className="space-y-1">
          {[
            { icon: User, label: "Personal Profile", desc: "Name, phone number, sales CV", action: () => setActiveSection("profile") },
            { icon: Lock, label: "Change PIN", desc: "Update your 4-digit login PIN", action: undefined },
            { icon: Building2, label: "Linked Business", desc: businessName || "Mama Nkechi Provisions", action: () => setActiveSection("linked") },
            { icon: Swords, label: "Challenge a Friend", desc: "Compete with another agent", action: () => setActiveSection("challenge") },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full flex items-center gap-3 py-4 border-b border-border"
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <button
          onClick={() => { logout(); navigate("/"); }}
          className="w-full flex items-center gap-3 py-4 text-destructive mt-6"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
      <AgentBottomNav />
    </div>
  );
};

export default AgentSettingsPage;
