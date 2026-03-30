const { useState, useEffect, useRef, useMemo } = React;

// ============================================================
// FALLBACK CONFIG
// ============================================================
const FALLBACK_CONFIG = {
  id: "legacy", brandName: "Natural Stacks", productName: "Dopamine Brain Food",
  ratePerVideo: 25, totalVideos: 15, startDate: "2026-03-25", endDate: "2026-04-24",
  briefLink: "", showcaseLink: "", tier: 10, creators: [],
};

// ============================================================
// STORAGE HELPERS
// ============================================================
const STORAGE_PREFIX = "retainers_";
function storageGet(key) { try { const v = localStorage.getItem(STORAGE_PREFIX + key); return v ? JSON.parse(v) : null; } catch { return null; } }
function storageSet(key, value) { try { if (value == null) { localStorage.removeItem(STORAGE_PREFIX + key); return; } localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); } catch (e) { console.error("Storage write failed:", e); } }

function loadCampaigns() { try { const r = localStorage.getItem("retainers_campaigns"); return r ? JSON.parse(r) : []; } catch { return []; } }
function getCampaignsForUser(username) {
  const campaigns = loadCampaigns();
  if (campaigns.length === 0) return [FALLBACK_CONFIG];
  return campaigns.filter(c => c.creators?.some(h => h.toLowerCase() === username.toLowerCase()));
}
function getCampaignBySlug(slug) { return loadCampaigns().find(c => c.slug?.toLowerCase() === slug.toLowerCase()) || null; }
function getSlugFromURL() { const p = window.location.pathname.replace(/^\/|\/$/g, ""); if (!p || p === "tracker" || p === "adminmanage") return null; return p; }

function loadUserData(username, campaignId) { return storageGet("user_" + campaignId + "_" + username); }
function saveUserData(username, campaignId, data) { storageSet("user_" + campaignId + "_" + username, data); }

// PIN Auth
function getAllPinAccounts() { return storageGet("pin_accounts") || {}; }
function savePinAccounts(a) { storageSet("pin_accounts", a); }
function registerPin(username, pin) { const a = getAllPinAccounts(); a[pin] = username; savePinAccounts(a); }
function lookupPin(pin) { return getAllPinAccounts()[pin] || null; }
function usernameHasPin(username) { return Object.values(getAllPinAccounts()).some(u => u.toLowerCase() === username.toLowerCase()); }
function getLoggedInUser() { return storageGet("logged_in_user"); }
function setLoggedInUser(u) { storageSet("logged_in_user", u); }
function clearLoggedInUser() { storageSet("logged_in_user", null); }

// ============================================================
// DATE UTILITIES
// ============================================================
function parseDate(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function formatDateShort(d) { return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function formatDateISO(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function getCampaignDays(config) { const s = parseDate(config.startDate), e = parseDate(config.endDate), days = [], c = new Date(s); while(c <= e) { days.push(formatDateISO(c)); c.setDate(c.getDate()+1); } return days; }
function getTodayISO() { return formatDateISO(new Date()); }
function getDaysRemaining(config) { const e = parseDate(config.endDate), t = new Date(); t.setHours(0,0,0,0); return Math.max(0, Math.ceil((e - t) / 86400000)); }
function getPostedCount(days) { return Object.values(days).filter(d => d.posted).length; }
function getCurrentStreak(campaignDays, daysData) { let s = 0; const t = getTodayISO(); for (let i = campaignDays.length - 1; i >= 0; i--) { if (campaignDays[i] > t) continue; if (daysData[campaignDays[i]]?.posted) s++; else break; } return s; }

function buildDefaultUserData(username, config) {
  const campaignDays = getCampaignDays(config);
  const days = {}; campaignDays.forEach(d => { days[d] = { posted: false, link: "" }; });
  return { username, campaignId: config.id, campaign: config.brandName.toLowerCase().replace(/\s+/g, "-"), rate: config.ratePerVideo, totalVideos: config.totalVideos, startDate: config.startDate, endDate: config.endDate, days };
}

// ============================================================
// COMPONENTS
// ============================================================

function PinLoginScreen({ onLogin, onGoToSetup }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.focus(); }, []);

  const handleChange = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    setPin(digits); setError("");
    if (digits.length === 4) {
      const u = lookupPin(digits);
      if (u) { setLoggedInUser(u); onLogin(u); }
      else { setError("PIN not recognized"); setTimeout(() => { setPin(""); setError(""); }, 1500); }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-surface-raised border border-border rounded-xl p-8 w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-[20px] font-bold text-primary mb-1">Campaign Tracker</h1>
          <p className="text-[13px] text-label-dim">Enter your 4-digit PIN to continue.</p>
        </div>

        <div>
          <div className="flex justify-center gap-3 mb-3">
            {[0,1,2,3].map(i => (
              <div key={i} className={`w-12 h-12 rounded-lg border flex items-center justify-center text-[18px] font-bold transition-all ${pin.length > i ? "border-label-dim bg-surface-overlay text-primary" : "border-border bg-surface text-label-faint"}`}>
                {pin[i] ? "\u2022" : ""}
              </div>
            ))}
          </div>
          <input ref={ref} type="tel" inputMode="numeric" maxLength={4} value={pin}
            onChange={(e) => handleChange(e.target.value)} className="absolute opacity-0 w-0 h-0" autoFocus />
          <button type="button" onClick={() => ref.current?.focus()} className="w-full py-2 text-center text-[13px] text-label-faint">
            {error ? <span className="text-red-400">{error}</span> : "Tap to enter PIN"}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-label-faint text-[12px] mb-3">First time here?</p>
          <button onClick={onGoToSetup} className="w-full bg-surface-overlay border border-border text-primary font-medium rounded-lg py-2.5 text-[13px] hover:border-border-light transition-colors">
            Set Up Account
          </button>
        </div>
      </div>
    </div>
  );
}

function SetupScreen({ onComplete, onBack }) {
  const [step, setStep] = useState(1);
  const [handle, setHandle] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const handleRef = useRef(null);
  const pinRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => { if (handleRef.current) handleRef.current.focus(); }, []);
  useEffect(() => { if (step === 2 && pinRef.current) pinRef.current.focus(); }, [step]);
  useEffect(() => { if (step === 3 && confirmRef.current) confirmRef.current.focus(); }, [step]);

  const handleHandleSubmit = (e) => {
    e.preventDefault();
    const name = handle.trim(); if (!name) return;
    const username = name.startsWith("@") ? name : "@" + name;
    setHandle(username);
    if (usernameHasPin(username)) { setError("This handle already has a PIN. Use PIN login instead."); return; }
    const campaigns = getCampaignsForUser(username);
    if (campaigns.length === 0) { setError("No campaigns found for this handle."); return; }
    setError(""); setStep(2);
  };

  const handlePinInput = (val) => {
    const d = val.replace(/\D/g, "").slice(0, 4); setPin(d); setError("");
    if (d.length === 4) { if (lookupPin(d)) { setError("PIN taken. Choose another."); setTimeout(() => { setPin(""); setError(""); }, 1500); return; } setStep(3); }
  };

  const handleConfirmInput = (val) => {
    const d = val.replace(/\D/g, "").slice(0, 4); setConfirmPin(d); setError("");
    if (d.length === 4) { if (d !== pin) { setError("PINs don't match."); setTimeout(() => { setConfirmPin(""); setError(""); }, 1500); return; } registerPin(handle, pin); setLoggedInUser(handle); onComplete(handle); }
  };

  const PinDots = ({ value, inputRef: r }) => (
    <div>
      <div className="flex justify-center gap-3 mb-3">
        {[0,1,2,3].map(i => (
          <div key={i} className={`w-12 h-12 rounded-lg border flex items-center justify-center text-[18px] font-bold transition-all ${value.length > i ? "border-label-dim bg-surface-overlay text-primary" : "border-border bg-surface text-label-faint"}`}>
            {value[i] ? "\u2022" : ""}
          </div>
        ))}
      </div>
      <input ref={r} type="tel" inputMode="numeric" maxLength={4} value={value}
        onChange={(e) => step === 2 ? handlePinInput(e.target.value) : handleConfirmInput(e.target.value)}
        className="absolute opacity-0 w-0 h-0" autoFocus />
      <button type="button" onClick={() => r.current?.focus()} className="w-full py-2 text-center text-[13px] text-label-faint">
        {error ? <span className="text-red-400">{error}</span> : "Tap to enter"}
      </button>
    </div>
  );

  const titles = ["Link Your Discord", "Create a PIN", "Confirm PIN"];
  const descs = ["Enter your Discord handle to get started.", "Choose a 4-digit PIN for quick access.", "Enter your PIN one more time to confirm."];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-surface-raised border border-border rounded-xl p-8 w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-[20px] font-bold text-primary mb-1">{titles[step - 1]}</h1>
          <p className="text-[13px] text-label-dim">{descs[step - 1]}</p>
          <div className="flex gap-1.5 mt-4">
            {[1,2,3].map(s => <div key={s} className={`h-0.5 flex-1 rounded-full ${step >= s ? "bg-primary" : "bg-border"}`} />)}
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleHandleSubmit}>
            <input ref={handleRef} type="text" value={handle}
              onChange={(e) => { setHandle(e.target.value); setError(""); }} placeholder="@yourname"
              className="w-full bg-surface-overlay border border-border rounded-lg px-3.5 py-3 text-[15px] text-primary placeholder-label-faint focus:outline-none focus:border-label-dim transition-colors" />
            {error && <p className="text-red-400 text-[12px] mt-2">{error}</p>}
            <button type="submit" className="w-full mt-4 bg-primary text-surface font-semibold rounded-lg py-3 text-[14px] hover:bg-accent transition-all">Continue</button>
          </form>
        )}

        {step === 2 && (
          <div>
            <p className="text-center text-[13px] text-label mb-4">Setting up as <span className="text-primary font-semibold">{handle}</span></p>
            <PinDots value={pin} inputRef={pinRef} />
          </div>
        )}

        {step === 3 && <PinDots value={confirmPin} inputRef={confirmRef} />}

        <div className="mt-6 text-center">
          <button onClick={step === 1 ? onBack : () => { setStep(step - 1); setPin(""); setConfirmPin(""); setError(""); }}
            className="text-[13px] text-label-faint hover:text-primary transition-colors">Back</button>
        </div>
      </div>
    </div>
  );
}

function CampaignNotFound({ slug }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-surface-raised border border-border rounded-xl p-8 w-full max-w-sm text-center">
        <h2 className="text-[18px] font-bold text-primary mb-2">Campaign Not Found</h2>
        <p className="text-[13px] text-label-dim">No campaign exists at <span className="text-primary font-mono">/{slug}</span></p>
      </div>
    </div>
  );
}

function NoCampaignsScreen({ username, onSwitchUser }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-surface-raised border border-border rounded-xl p-8 w-full max-w-sm text-center">
        <h2 className="text-[18px] font-bold text-primary mb-2">No Campaigns Found</h2>
        <p className="text-[13px] text-label-dim mb-6">No active campaigns assigned to <span className="text-primary font-semibold">{username}</span>.</p>
        <button onClick={onSwitchUser} className="w-full bg-primary text-surface font-semibold rounded-lg py-2.5 text-[14px] hover:bg-accent transition-all">Back to Login</button>
      </div>
    </div>
  );
}

function CampaignPicker({ campaigns, onSelect, username, onSwitchUser }) {
  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-bold text-primary">Your Campaigns</h1>
          <p className="text-[13px] text-label-dim">Logged in as <span className="text-primary font-medium">{username}</span></p>
        </div>
        <button onClick={onSwitchUser} className="text-[12px] text-label-faint hover:text-primary transition-colors">Log out</button>
      </div>
      <div className="space-y-2">
        {campaigns.map(c => (
          <button key={c.id} onClick={() => onSelect(c)}
            className="w-full bg-surface-raised border border-border rounded-xl p-5 text-left hover:border-border-light transition-all">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[15px] font-bold text-primary">{c.brandName}</h3>
              <span className="text-[11px] text-label-faint font-medium">{c.tier} creators</span>
            </div>
            {c.productName && <p className="text-[13px] text-label-dim mb-2">{c.productName}</p>}
            <div className="flex gap-4 text-[12px] text-label-faint">
              <span>{c.startDate} &rarr; {c.endDate}</span>
              <span>${c.ratePerVideo}/video</span>
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
  const pct = total > 0 ? Math.round((posted / total) * 100) : 0;
  const earned = posted * config.ratePerVideo;
  const remaining = getDaysRemaining(config);

  return (
    <div className="bg-surface-raised border border-border rounded-xl p-5 mb-3">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[12px] text-label-dim">
          Logged in as <span className="text-primary font-medium">{userData.username}</span>
        </span>
        <div className="flex items-center gap-3">
          {showBack && <button onClick={onBack} className="text-[12px] text-label-faint hover:text-primary transition-colors">All Campaigns</button>}
          <button onClick={onSwitchUser} className="text-[12px] text-label-faint hover:text-primary transition-colors">Log out</button>
        </div>
      </div>

      <h2 className="text-[18px] font-bold text-primary mb-0.5">
        {config.brandName}
        {config.productName && <span className="text-label-dim font-normal"> &mdash; {config.productName}</span>}
      </h2>
      <p className="text-[13px] text-label-dim mb-4">
        ${config.ratePerVideo}/video &middot; {total} videos &middot; ${total * config.ratePerVideo} total
      </p>

      <div className="mb-3">
        <div className="flex justify-between text-[13px] mb-1.5">
          <span className="text-label"><span className="text-primary font-semibold">{posted}</span> / {total} posted</span>
          <span className="text-label-dim font-semibold">{pct}%</span>
        </div>
        <div className="w-full bg-surface rounded h-1.5 overflow-hidden">
          <div className="bg-primary h-full rounded transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="bg-surface border border-border text-[11px] font-medium text-label-dim px-2.5 py-1 rounded">{remaining} days left</span>
        <span className="bg-surface border border-border text-[11px] font-medium text-label-dim px-2.5 py-1 rounded">${earned} earned</span>
      </div>
    </div>
  );
}

function CalendarGrid({ config, userData, campaignDays, onToggleDay }) {
  const today = getTodayISO();

  return (
    <div className="bg-surface-raised border border-border rounded-xl p-5 mb-3">
      <h3 className="text-[14px] font-semibold text-primary mb-4">Calendar</h3>

      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-label-faint font-semibold uppercase">{d}</div>
        ))}
      </div>

      {(() => {
        const startDow = parseDate(config.startDate).getDay();
        const blanks = Array.from({ length: startDow }, (_, i) => <div key={"b-" + i} />);

        const cells = campaignDays.map((dateStr, idx) => {
          const dayData = userData.days[dateStr] || { posted: false };
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const isFuture = dateStr > today;
          const isPosted = dayData.posted;

          let cls = "bg-surface border-border";
          if (isPosted) cls = "bg-emerald-500/10 border-emerald-500/30";
          else if (isToday) cls = "bg-surface border-primary/40";
          else if (isPast) cls = "bg-surface border-border";

          return (
            <button key={dateStr} onClick={() => onToggleDay(dateStr)} disabled={isFuture}
              className={`day-cell relative flex flex-col items-center justify-center rounded-lg border min-h-[40px] aspect-square text-[11px] font-semibold transition-all ${cls} ${isFuture ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:border-label-dim"}`}>
              <span className={isPosted ? "text-emerald-400" : isPast ? "text-label-faint" : "text-primary"}>{idx + 1}</span>
              {isPosted && <span className="text-emerald-400 text-[8px] leading-none mt-0.5">Done</span>}
            </button>
          );
        });

        return <div className="grid grid-cols-7 gap-1.5">{blanks}{cells}</div>;
      })()}

      <div className="flex items-center gap-4 mt-4 text-[11px] text-label-faint">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-emerald-500/30 bg-emerald-500/10 inline-block" /> Posted</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-border bg-surface inline-block" /> Missed</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-primary/40 bg-surface inline-block" /> Today</span>
      </div>
    </div>
  );
}

function VideoLog({ userData, campaignDays, onUpdateLink }) {
  const today = getTodayISO();

  return (
    <div className="bg-surface-raised border border-border rounded-xl p-5 mb-3">
      <h3 className="text-[14px] font-semibold text-primary mb-4">Video Log</h3>
      <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
        {campaignDays.map((dateStr, idx) => {
          const dayData = userData.days[dateStr] || { posted: false, link: "" };
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const isPosted = dayData.posted;

          let statusText, statusColor;
          if (isPosted) { statusText = "Posted"; statusColor = "text-emerald-400"; }
          else if (isToday) { statusText = "Today"; statusColor = "text-primary"; }
          else if (isPast) { statusText = "Missed"; statusColor = "text-label-faint"; }
          else { statusText = "Upcoming"; statusColor = "text-label-faint/50"; }

          return (
            <div key={dateStr} className={`rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-2 ${isToday ? "bg-surface-overlay border border-border" : "bg-surface"}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-[11px] text-label-faint font-mono w-7 shrink-0">D{idx + 1}</span>
                <span className="text-[13px] text-primary w-14 shrink-0">{formatDateShort(parseDate(dateStr))}</span>
                <span className={`text-[12px] ${statusColor} font-medium w-16 shrink-0`}>{statusText}</span>
              </div>
              {(isPosted || isToday || isPast) && (
                <input type="url" placeholder="Paste TikTok link..." value={dayData.link || ""}
                  onChange={(e) => onUpdateLink(dateStr, e.target.value)}
                  className="flex-1 bg-surface-overlay border border-border rounded-lg px-3 py-1.5 text-[12px] text-primary placeholder-label-faint focus:outline-none focus:border-label-dim transition-colors min-h-[32px] min-w-0" />
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
  const pct = config.totalVideos > 0 ? Math.round((posted / config.totalVideos) * 100) : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface-raised/95 backdrop-blur-sm border-t border-border px-4 py-3 z-50">
      <div className="max-w-lg mx-auto grid grid-cols-4 gap-2">
        {[
          { label: "Posted", value: `${posted}/${config.totalVideos}` },
          { label: "Earned", value: `$${earned}` },
          { label: "Streak", value: `${streak}d` },
          { label: "Progress", value: `${pct}%` },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className="text-[15px] font-bold text-primary leading-tight">{s.value}</div>
            <div className="text-[9px] text-label-faint uppercase tracking-wider font-medium">{s.label}</div>
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
    if (!data) { data = buildDefaultUserData(user, config); saveUserData(user, campaignId, data); }
    return data;
  });
  const campaignDays = useMemo(() => getCampaignDays(config), [config]);

  const handleToggleDay = (dateStr) => {
    setUserData(prev => {
      const u = { ...prev, days: { ...prev.days, [dateStr]: { ...prev.days[dateStr], posted: !prev.days[dateStr]?.posted } } };
      saveUserData(user, campaignId, u); return u;
    });
  };
  const handleUpdateLink = (dateStr, link) => {
    setUserData(prev => {
      const u = { ...prev, days: { ...prev.days, [dateStr]: { ...prev.days[dateStr], link } } };
      saveUserData(user, campaignId, u); return u;
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
  const [screen, setScreen] = useState("loading");
  const [loaded, setLoaded] = useState(false);
  const [urlSlug, setUrlSlug] = useState(null);

  useEffect(() => {
    const slug = getSlugFromURL(); setUrlSlug(slug);
    let slugCampaign = null;
    if (slug) { slugCampaign = getCampaignBySlug(slug); if (!slugCampaign) { setScreen("not-found"); setLoaded(true); return; } }

    const loggedIn = getLoggedInUser();
    if (loggedIn) {
      if (slugCampaign) {
        const ok = slugCampaign.creators?.some(h => h.toLowerCase() === loggedIn.toLowerCase());
        if (ok) { setUser(loggedIn); setCampaigns([slugCampaign]); setSelectedCampaign(slugCampaign); setScreen("app"); }
        else setScreen("pin");
      } else {
        const uc = getCampaignsForUser(loggedIn);
        if (uc.length > 0) { setUser(loggedIn); setCampaigns(uc); if (uc.length === 1) setSelectedCampaign(uc[0]); setScreen("app"); }
        else setScreen("pin");
      }
    } else setScreen("pin");
    setLoaded(true);
  }, []);

  const loginAs = (username) => {
    if (urlSlug) {
      const sc = getCampaignBySlug(urlSlug);
      if (sc?.creators?.some(h => h.toLowerCase() === username.toLowerCase())) {
        setUser(username); setCampaigns([sc]); setSelectedCampaign(sc); setScreen("app"); return;
      }
      setUser(username); setCampaigns([]); setScreen("no-campaigns"); return;
    }
    const uc = getCampaignsForUser(username); setUser(username); setCampaigns(uc);
    if (uc.length === 1) setSelectedCampaign(uc[0]); else setSelectedCampaign(null);
    setScreen(uc.length === 0 ? "no-campaigns" : "app");
  };

  const handleLogout = () => { clearLoggedInUser(); setUser(null); setCampaigns([]); setSelectedCampaign(null); setScreen("pin"); };

  if (!loaded) return <div className="min-h-screen flex items-center justify-center"><div className="text-label-dim text-[14px]">Loading...</div></div>;
  if (screen === "not-found") return <CampaignNotFound slug={urlSlug} />;
  if (screen === "pin") return <PinLoginScreen onLogin={loginAs} onGoToSetup={() => setScreen("setup")} />;
  if (screen === "setup") return <SetupScreen onComplete={loginAs} onBack={() => setScreen("pin")} />;
  if (screen === "no-campaigns" || (screen === "app" && campaigns.length === 0)) return <NoCampaignsScreen username={user} onSwitchUser={handleLogout} />;
  if (screen === "app" && !selectedCampaign) return <CampaignPicker campaigns={campaigns} onSelect={setSelectedCampaign} username={user} onSwitchUser={handleLogout} />;
  if (screen === "app" && selectedCampaign) return <CampaignView key={selectedCampaign.id} config={selectedCampaign} user={user} onSwitchUser={handleLogout} onBack={() => setSelectedCampaign(null)} showBack={campaigns.length > 1} />;
  return null;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
