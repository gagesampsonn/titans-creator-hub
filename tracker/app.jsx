const { useState, useEffect, useRef, useMemo } = React;

// ============================================================
// CAMPAIGN CONFIGURATION — Edit these for each brand/campaign
// ============================================================
const CAMPAIGN_CONFIG = {
  brandName: "Natural Stacks",
  productName: "Dopamine Brain Food",
  ratePerVideo: 25,
  totalVideos: 15,
  startDate: "2026-03-25",
  endDate: "2026-04-24",
  briefLink: "https://discord.com/channels/...",
  showcaseLink: "https://affiliate-us.tiktok.com/api/v1/share/AJK4Uc0dUuXO",
};

// ============================================================
// STORAGE HELPERS — Uses localStorage (persistent key-value)
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

function loadUserData(username) {
  return storageGet("user_" + username);
}

function saveUserData(username, data) {
  storageSet("user_" + username, data);
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

function CampaignHeader({ config, userData, onSwitchUser }) {
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
        <button onClick={onSwitchUser} className="text-xs text-accent hover:underline">
          Switch user
        </button>
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

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const lastUser = getLastUser();
    if (lastUser) {
      const data = loadUserData(lastUser);
      if (data) {
        setUser(lastUser);
        setUserData(data);
      }
    }
    setLoaded(true);
  }, []);

  const campaignDays = useMemo(() => getCampaignDays(CAMPAIGN_CONFIG), []);

  const handleLogin = (username) => {
    let data = loadUserData(username);
    if (!data) {
      data = buildDefaultUserData(username, CAMPAIGN_CONFIG);
      saveUserData(username, data);
    }
    setLastUser(username);
    setUser(username);
    setUserData(data);
  };

  const handleSwitchUser = () => {
    setUser(null);
    setUserData(null);
    storageSet("last_user", null);
  };

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
      saveUserData(user, updated);
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
      saveUserData(user, updated);
      return updated;
    });
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-accent text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user || !userData) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
      <CampaignHeader config={CAMPAIGN_CONFIG} userData={userData} onSwitchUser={handleSwitchUser} />
      <CalendarGrid
        config={CAMPAIGN_CONFIG}
        userData={userData}
        campaignDays={campaignDays}
        onToggleDay={handleToggleDay}
      />
      <VideoLog userData={userData} campaignDays={campaignDays} onUpdateLink={handleUpdateLink} />
      <StatsBar config={CAMPAIGN_CONFIG} userData={userData} campaignDays={campaignDays} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

