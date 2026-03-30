const { useState, useEffect, useRef, useMemo } = React;

// ============================================================
// FALLBACK CONFIG — Used if no admin-created campaigns exist
// ============================================================
const FALLBACK_CONFIG = {
  id: "legacy",
  brandName: "Natural Stacks",
  productName: "Dopamine Brain Food",
  ratePerVideo: 25,
  totalVideos: 15,
  startDate: "2026-03-25",
  endDate: "2026-04-24",
  briefLink: "https://discord.com/channels/...",
  showcaseLink: "https://affiliate-us.tiktok.com/api/v1/share/AJK4Uc0dUuXO",
  tier: 10,
  creators: [],
};

// ============================================================
// STORAGE HELPERS
// ============================================================
const STORAGE_PREFIX = "retainers_";

function storageGet(key) {
  try {
    const val = window.localStorage.getItem(STORAGE_PREFIX + key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    if (value === null || typeof value === "undefined") {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
      return;
    }
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage write failed:", e);
  }
}

function loadCampaigns() {
  try {
    const raw = localStorage.getItem("retainers_campaigns");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function getCampaignsForUser(username) {
  const campaigns = loadCampaigns();
  if (campaigns.length === 0) return [FALLBACK_CONFIG];
  const matched = campaigns.filter((c) =>
    c.creators && c.creators.some((h) => h.toLowerCase() === username.toLowerCase())
  );
  return matched;
}

function loadUserData(username, campaignId) {
  return storageGet("user_" + campaignId + "_" + username);
}

function saveUserData(username, campaignId, data) {
  storageSet("user_" + campaignId + "_" + username, data);
}

function getLastUser() {
  return storageGet("last_user");
}

function setLastUser(username) {
  storageSet("last_user", username);
}

// ============================================================
// DATE & CAMPAIGN UTILITIES
// ============================================================

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateShort(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getCampaignDays(config) {
  const start = parseDate(config.startDate);
  const end = parseDate(config.endDate);
  const days = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(formatDateISO(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function getTodayISO() {
  return formatDateISO(new Date());
}

function getDaysRemaining(config) {
  const end = parseDate(config.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function getPostedCount(days) {
  return Object.values(days).filter((d) => d.posted).length;
}

function getCurrentStreak(campaignDays, daysData) {
  let streak = 0;
  const today = getTodayISO();
  for (let i = campaignDays.length - 1; i >= 0; i--) {
    if (campaignDays[i] > today) continue;
    if (daysData[campaignDays[i]]?.posted) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function buildDefaultUserData(username, config) {
  const campaignDays = getCampaignDays(config);
  const days = {};
  campaignDays.forEach((date) => {
    days[date] = { posted: false, link: "" };
  });
  return {
    username,
    campaignId: config.id,
    campaign: config.brandName.toLowerCase().replace(/\s+/g, "-"),
    rate: config.ratePerVideo,
    totalVideos: config.totalVideos,
    startDate: config.startDate,
    endDate: config.endDate,
    days,
  };
}

// ============================================================
// COMPONENTS
// ============================================================

function LoginScreen({ onLogin }) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = input.trim();
    if (!name) return;
    const username = name.startsWith("@") ? name : "@" + name;
    onLogin(username);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-dark-card rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-accent mb-2">⚡</div>
          <h1 className="text-2xl font-bold mb-1">Campaign Tracker</h1>
          <p className="text-muted text-sm">Track your retainer progress</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm text-muted mb-2">
            Enter your Discord username
          </label>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="@janedoe"
            className="w-full bg-dark-bg border border-muted rounded-xl px-4 py-4 text-lg text-white placeholder-muted focus:outline-none focus:border-accent transition-colors min-h-[48px]"
          />
          <button
            type="submit"
            className="w-full mt-4 bg-accent hover:bg-accent-hover text-white font-bold text-lg rounded-xl py-4 transition-colors min-h-[48px] active:scale-95"
          >
            Start Tracking
          </button>
        </form>
      </div>
    </div>
  );
}

function NoCampaignsScreen({ username, onSwitchUser }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-dark-card rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-bold mb-2">No Campaigns Found</h2>
        <p className="text-muted text-sm mb-6">
          There are no active campaigns assigned to <span className="text-white font-semibold">{username}</span>. Contact your campaign manager if you believe this is an error.
        </p>
        <button onClick={onSwitchUser} className="w-full bg-accent hover:bg-accent-hover text-white font-bold rounded-xl py-3 transition-colors">
          Try Different Username
        </button>
      </div>
    </div>
  );
}

function CampaignPicker({ campaigns, onSelect, username, onSwitchUser }) {
  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Your Campaigns</h1>
          <p className="text-muted text-sm">Logged in as <span className="text-white font-semibold">{username}</span></p>
        </div>
        <button onClick={onSwitchUser} className="text-xs text-accent hover:underline">Switch user</button>
      </div>
      <div className="space-y-3">
        {campaigns.map((c) => (
          <button key={c.id} onClick={() => onSelect(c)}
            className="w-full bg-dark-card rounded-2xl p-5 text-left border border-muted/10 hover:border-accent/50 transition-all active:scale-[0.98]">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold">{c.brandName}</h3>
              <span className="text-xs text-accent font-bold">{c.tier || "—"} creators</span>
            </div>
            {c.productName && <p className="text-sm text-muted mb-2">{c.productName}</p>}
            <div className="flex gap-3 text-xs text-muted">
              <span>{c.startDate} → {c.endDate}</span>
              <span>${c.ratePerVideo}/video</span>
              <span>{c.totalVideos} videos</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CampaignHeader({ config, userData, onSwitchUser, onBack, showBack }) {
  const posted = getPostedCount(userData.days);
  const total = config.totalVideos;
  const pct = Math.round((posted / total) * 100);
  const earned = posted * config.ratePerVideo;
  const totalComp = total * config.ratePerVideo;
  const remaining = getDaysRemaining(config);

  return (
    <div className="bg-dark-card rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted">
          Logged in as{" "}
          <span className="text-white font-semibold">{userData.username}</span>
        </span>
        <div className="flex items-center gap-3">
          {showBack && <button onClick={onBack} className="text-xs text-muted hover:text-white">← Campaigns</button>}
          <button onClick={onSwitchUser} className="text-xs text-accent hover:underline">
            Switch user
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-1">
        {config.brandName}{" "}
        <span className="text-muted font-normal">— {config.productName}</span>
      </h2>

      <p className="text-sm text-muted mb-4">
        ${config.ratePerVideo}/video × {total} videos ={" "}
        <span className="text-white font-semibold">${totalComp} total</span>
      </p>

      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span>
            <span className="text-white font-bold">{posted}</span>
            <span className="text-muted"> / {total} videos posted</span>
          </span>
          <span className="text-accent font-bold">{pct}%</span>
        </div>
        <div className="w-full bg-dark-bg rounded-full h-3 overflow-hidden">
          <div
            className="bg-accent h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span className="bg-dark-bg text-accent text-xs font-bold px-3 py-1 rounded-full">
          {remaining} days remaining
        </span>
        <span className="bg-dark-bg text-success text-xs font-bold px-3 py-1 rounded-full">
          ${earned} earned
        </span>
      </div>
    </div>
  );
}

function CalendarGrid({ config, userData, campaignDays, onToggleDay }) {
  const today = getTodayISO();

  return (
    <div className="bg-dark-card rounded-2xl p-5 mb-4">
      <h3 className="text-lg font-bold mb-4">📅 Calendar</h3>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-xs text-muted font-semibold">
            {d}
          </div>
        ))}
      </div>

      {(() => {
        const startDow = parseDate(config.startDate).getDay();
        const leadingBlanks = Array.from({ length: startDow }, (_, i) => (
          <div key={"blank-" + i} />
        ));

        const dayCells = campaignDays.map((dateStr, idx) => {
          const dayData = userData.days[dateStr] || { posted: false, link: "" };
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const isFuture = dateStr > today;
          const isPosted = dayData.posted;
          const dayNum = idx + 1;

          let bgClass = "bg-dark-bg border-dark-bg";
          if (isPosted) bgClass = "bg-success/20 border-success";
          else if (isPast) bgClass = "bg-dark-bg border-muted/30";
          else if (isFuture) bgClass = "bg-dark-bg border-dark-card";

          const todayClass = isToday ? "border-accent pulse-today" : "";
          const textColor = isPosted ? "text-success" : isPast ? "text-muted" : "text-white";

          return (
            <button
              key={dateStr}
              onClick={() => onToggleDay(dateStr)}
              disabled={isFuture}
              className={`day-cell relative flex flex-col items-center justify-center rounded-xl border-2 min-h-[48px] min-w-[48px] aspect-square ${bgClass} ${todayClass} ${textColor} ${
                isFuture ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:border-accent/50"
              }`}
            >
              <span className="text-xs font-bold leading-none">{dayNum}</span>
              {isPosted && <span className="text-success text-[10px] leading-none mt-0.5">✓</span>}
              {isToday && !isPosted && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full" />
              )}
            </button>
          );
        });

        return (
          <div className="grid grid-cols-7 gap-2">
            {leadingBlanks}
            {dayCells}
          </div>
        );
      })()}

      <div className="flex items-center gap-4 mt-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-success/20 border border-success inline-block" /> Posted
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-dark-bg border border-muted/30 inline-block" /> Missed
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border-2 border-accent inline-block" /> Today
        </span>
      </div>
    </div>
  );
}

function VideoLog({ userData, campaignDays, onUpdateLink }) {
  const today = getTodayISO();

  return (
    <div className="bg-dark-card rounded-2xl p-5 mb-4">
      <h3 className="text-lg font-bold mb-4">📋 Video Log</h3>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {campaignDays.map((dateStr, idx) => {
          const dayData = userData.days[dateStr] || { posted: false, link: "" };
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const isPosted = dayData.posted;

          let statusIcon, statusText, statusColor;
          if (isPosted) {
            statusIcon = "✅";
            statusText = "Posted";
            statusColor = "text-success";
          } else if (isToday) {
            statusIcon = "⏳";
            statusText = "Today";
            statusColor = "text-accent";
          } else if (isPast) {
            statusIcon = "❌";
            statusText = "Missed";
            statusColor = "text-muted";
          } else {
            statusIcon = "⏳";
            statusText = "Upcoming";
            statusColor = "text-muted/60";
          }

          const rowBg = isToday ? "bg-accent/5 border border-accent/20" : "bg-dark-bg";

          return (
            <div
              key={dateStr}
              className={`${rowBg} rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-2`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xs text-muted font-mono w-8 shrink-0">D{idx + 1}</span>
                <span className="text-sm text-white w-16 shrink-0">
                  {formatDateShort(parseDate(dateStr))}
                </span>
                <span className={`text-sm ${statusColor} flex items-center gap-1 w-20 shrink-0`}>
                  <span>{statusIcon}</span>
                  <span className="text-xs">{statusText}</span>
                </span>
              </div>

              {(isPosted || isToday || isPast) && (
                <input
                  type="url"
                  placeholder="Paste TikTok link..."
                  value={dayData.link || ""}
                  onChange={(e) => onUpdateLink(dateStr, e.target.value)}
                  className="flex-1 bg-dark-card border border-muted/30 rounded-lg px-3 py-2 text-xs text-white placeholder-muted/50 focus:outline-none focus:border-accent transition-colors min-h-[36px] min-w-0"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatsBar({ config, userData, campaignDays }) {
  const posted = getPostedCount(userData.days);
  const earned = posted * config.ratePerVideo;
  const streak = getCurrentStreak(campaignDays, userData.days);
  const pct = Math.round((posted / config.totalVideos) * 100);

  const stats = [
    { label: "Posted", value: `${posted}/${config.totalVideos}`, icon: "🎬" },
    { label: "Earned", value: `$${earned}`, icon: "💰" },
    { label: "Streak", value: `${streak}d`, icon: "🔥" },
    { label: "Done", value: `${pct}%`, icon: "📊" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-card/95 backdrop-blur-sm border-t border-muted/20 px-4 py-3 z-50">
      <div className="max-w-lg mx-auto grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-lg font-bold text-white leading-tight">
              {s.icon} {s.value}
            </div>
            <div className="text-[10px] text-muted uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignView({ config, user, onSwitchUser, onBack, showBack }) {
  const campaignId = config.id || "legacy";
  const [userData, setUserData] = useState(() => {
    let data = loadUserData(user, campaignId);
    if (!data) {
      data = buildDefaultUserData(user, config);
      saveUserData(user, campaignId, data);
    }
    return data;
  });

  const campaignDays = useMemo(() => getCampaignDays(config), [config]);

  const handleToggleDay = (dateStr) => {
    setUserData((prev) => {
      const updated = {
        ...prev,
        days: {
          ...prev.days,
          [dateStr]: {
            ...prev.days[dateStr],
            posted: !prev.days[dateStr]?.posted,
          },
        },
      };
      saveUserData(user, campaignId, updated);
      return updated;
    });
  };

  const handleUpdateLink = (dateStr, link) => {
    setUserData((prev) => {
      const updated = {
        ...prev,
        days: {
          ...prev.days,
          [dateStr]: {
            ...prev.days[dateStr],
            link,
          },
        },
      };
      saveUserData(user, campaignId, updated);
      return updated;
    });
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
      <CampaignHeader config={config} userData={userData} onSwitchUser={onSwitchUser} onBack={onBack} showBack={showBack} />
      <CalendarGrid config={config} userData={userData} campaignDays={campaignDays} onToggleDay={handleToggleDay} />
      <VideoLog userData={userData} campaignDays={campaignDays} onUpdateLink={handleUpdateLink} />
      <StatsBar config={config} userData={userData} campaignDays={campaignDays} />
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const lastUser = getLastUser();
    if (lastUser) {
      const userCampaigns = getCampaignsForUser(lastUser);
      if (userCampaigns.length > 0) {
        setUser(lastUser);
        setCampaigns(userCampaigns);
        if (userCampaigns.length === 1) {
          setSelectedCampaign(userCampaigns[0]);
        }
      }
    }
    setLoaded(true);
  }, []);

  const handleLogin = (username) => {
    const userCampaigns = getCampaignsForUser(username);
    setLastUser(username);
    setUser(username);
    setCampaigns(userCampaigns);
    if (userCampaigns.length === 1) {
      setSelectedCampaign(userCampaigns[0]);
    } else {
      setSelectedCampaign(null);
    }
  };

  const handleSwitchUser = () => {
    setUser(null);
    setCampaigns([]);
    setSelectedCampaign(null);
    storageSet("last_user", null);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-accent text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (campaigns.length === 0) {
    return <NoCampaignsScreen username={user} onSwitchUser={handleSwitchUser} />;
  }

  if (!selectedCampaign) {
    return <CampaignPicker campaigns={campaigns} onSelect={setSelectedCampaign} username={user} onSwitchUser={handleSwitchUser} />;
  }

  return (
    <CampaignView
      key={selectedCampaign.id}
      config={selectedCampaign}
      user={user}
      onSwitchUser={handleSwitchUser}
      onBack={() => setSelectedCampaign(null)}
      showBack={campaigns.length > 1}
    />
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
