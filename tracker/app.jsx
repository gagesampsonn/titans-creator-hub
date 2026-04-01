const { useState, useEffect, useRef, useMemo } = React;

// ============================================================
// SUPABASE CLIENT
// ============================================================
const SUPABASE_URL = "https://luegkjhpmmdflyksmmnb.supabase.co";
const SUPABASE_KEY = "sb_publishable_k0UnSsbi8ftmyvzK6Fxznw_CcpaOqMm";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// DB HELPERS
// ============================================================
function fromDbCampaign(r) {
  return {
    id: r.id, brandName: r.brand_name, productName: r.product_name || "",
    slug: r.slug, tier: r.tier, ratePerVideo: r.rate_per_video,
    totalVideos: r.total_videos, totalVideosAdmin: r.total_videos_admin,
    startDate: r.start_date, endDate: r.end_date,
    // Optional explicit Phase 1 last day (YYYY-MM-DD) — use when computed phase length would be wrong.
    phase1EndDate: r.phase1_end_date || null,
    briefLink: r.brief_link || "", showcaseLink: r.showcase_link || "",
    totalBudget: r.total_budget || 0, managementFee: r.management_fee || 0,
    retainerBudget: r.retainer_budget || 0, upfrontPayment: r.upfront_payment || 0,
    onboardingDays: r.onboarding_days, phase1: r.phase1, phase2: r.phase2,
    creators: r.creators || [], phase2Creators: r.phase2_creators || [],
  };
}

async function dbLoadCampaigns() {
  const { data, error } = await sb.from("campaigns").select("*");
  if (error) { console.error("Load campaigns:", error); return []; }
  return data.map(fromDbCampaign);
}

async function dbGetCampaignsForUser(username) {
  const all = await dbLoadCampaigns();
  return all.filter(c => c.creators?.some(h => h.toLowerCase() === username.toLowerCase()));
}

async function dbGetCampaignBySlug(slug) {
  const { data, error } = await sb.from("campaigns").select("*").ilike("slug", slug).limit(1).single();
  if (error || !data) return null;
  return fromDbCampaign(data);
}

function getSlugFromURL() {
  const p = window.location.pathname.replace(/^\/|\/$/g, "");
  if (!p || p === "tracker" || p === "adminmanage") return { slug: null, isAdmin: false };
  if (p.endsWith("/admin")) return { slug: p.replace(/\/admin$/, ""), isAdmin: true };
  return { slug: p, isAdmin: false };
}

// Load ALL user tracking rows for a campaign (for admin view)
async function dbLoadAllTrackingForCampaign(campaignId) {
  const { data, error } = await sb.from("user_tracking").select("*").eq("campaign_id", campaignId);
  if (error) { console.error("Load all tracking:", error); return []; }
  return data || [];
}

// User tracking data — local backup so edits survive Supabase RLS/network failures
const TRACKER_DAYS_KEY = "titans_tracker_days_v1_";
function localDaysKey(username, campaignId) {
  return TRACKER_DAYS_KEY + String(username).toLowerCase() + "_" + String(campaignId);
}
function loadDaysFromLocalBackup(username, campaignId) {
  try {
    const raw = localStorage.getItem(localDaysKey(username, campaignId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveDaysToLocalBackup(username, campaignId, days) {
  try {
    localStorage.setItem(localDaysKey(username, campaignId), JSON.stringify(days));
  } catch (e) {
    console.error("Local backup save failed:", e);
  }
}
function mergeDayMaps(dbDays, localDays) {
  if (!dbDays && !localDays) return null;
  if (!dbDays) return localDays;
  if (!localDays) return dbDays;
  const keys = new Set([...Object.keys(dbDays), ...Object.keys(localDays)]);
  const out = {};
  keys.forEach((k) => {
    const d = dbDays[k] || {};
    const l = localDays[k] || {};
    out[k] = { posted: !!(d.posted || l.posted), link: (l.link || d.link || "").trim() };
  });
  return out;
}

async function dbLoadUserData(username, campaignId) {
  const { data, error } = await sb
    .from("user_tracking")
    .select("*")
    .eq("username", username)
    .eq("campaign_id", campaignId)
    .maybeSingle();
  if (error) console.error("Load user data:", error);
  return data?.days ?? null;
}

async function dbSaveUserDays(username, campaignId, days) {
  const { error } = await sb.from("user_tracking").upsert(
    { username, campaign_id: campaignId, days, updated_at: new Date().toISOString() },
    { onConflict: "username,campaign_id" }
  );
  if (error) {
    console.error("Save user data:", error);
    return false;
  }
  return true;
}

// PIN Auth (Supabase-backed)
async function dbLookupPin(pin) {
  const { data } = await sb.from("pin_accounts").select("username").eq("pin", pin).limit(1).single();
  return data ? data.username : null;
}

async function dbUsernameHasPin(username) {
  const { data } = await sb.from("pin_accounts").select("pin").ilike("username", username).limit(1);
  return data && data.length > 0;
}

async function dbRegisterPin(username, pin) {
  const { error } = await sb.from("pin_accounts").insert({ pin, username });
  if (error) { console.error("Register PIN:", error); return false; }
  return true;
}

// Session (localStorage is fine for this - it's just "who's logged in on this device")
function getLoggedInUser() { try { return JSON.parse(localStorage.getItem("titans_logged_in")); } catch { return null; } }
function setLoggedInUser(u) { localStorage.setItem("titans_logged_in", JSON.stringify(u)); }
function clearLoggedInUser() { localStorage.removeItem("titans_logged_in"); }

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

// Get creator-facing start date (after onboarding)
function getCreatorStartDate(config) {
  const ob = config.onboardingDays || 0;
  if (ob === 0) return config.startDate;
  const s = parseDate(config.startDate);
  s.setDate(s.getDate() + ob);
  return formatDateISO(s);
}

function getCreatorConfig(config, phase2Selected = false) {
  const creatorStart = getCreatorStartDate(config);
  const p1 = config.phase1?.days || 15;
  const p2 = config.phase2?.days || 15;
  const p1End = parseDate(creatorStart);
  p1End.setDate(p1End.getDate() + p1 - 1);
  const p1EndISO = config.phase1EndDate || formatDateISO(p1End);

  if (phase2Selected) {
    const fullEnd = parseDate(creatorStart);
    fullEnd.setDate(fullEnd.getDate() + p1 + p2 - 1);
    const fullEndISO = formatDateISO(fullEnd);
    const endDate = fullEndISO > config.endDate ? fullEndISO : config.endDate;
    return { ...config, startDate: creatorStart, endDate };
  }

  // Default: end at Phase 1
  return { ...config, startDate: creatorStart, endDate: p1EndISO };
}

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

  const handleChange = async (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    setPin(digits); setError("");
    if (digits.length === 4) {
      const u = await dbLookupPin(digits);
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
          <input ref={ref} type="tel" inputMode="numeric" maxLength={4} value={pin}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="0000"
            className="w-full bg-surface-overlay border border-border rounded-lg px-4 py-4 text-center text-[24px] font-bold tracking-[0.5em] text-primary placeholder-label-faint focus:outline-none focus:border-label-dim transition-colors"
            autoFocus />
          {error && <p className="text-red-400 text-[12px] text-center mt-2">{error}</p>}
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

  const handleHandleSubmit = async (e) => {
    e.preventDefault();
    const name = handle.trim(); if (!name) return;
    const username = name.startsWith("@") ? name : "@" + name;
    setHandle(username);
    if (await dbUsernameHasPin(username)) { setError("This handle already has a PIN. Use PIN login instead."); return; }
    const campaigns = await dbGetCampaignsForUser(username);
    if (campaigns.length === 0) { setError("No campaigns found for this handle."); return; }
    setError(""); setStep(2);
  };

  const handlePinInput = async (val) => {
    const d = val.replace(/\D/g, "").slice(0, 4); setPin(d); setError("");
    if (d.length === 4) { if (await dbLookupPin(d)) { setError("PIN taken. Choose another."); setTimeout(() => { setPin(""); setError(""); }, 1500); return; } setStep(3); }
  };

  const handleConfirmInput = async (val) => {
    const d = val.replace(/\D/g, "").slice(0, 4); setConfirmPin(d); setError("");
    if (d.length === 4) { if (d !== pin) { setError("PINs don't match."); setTimeout(() => { setConfirmPin(""); setError(""); }, 1500); return; } await dbRegisterPin(handle, pin); setLoggedInUser(handle); onComplete(handle); }
  };

  const PinInput = ({ value, inputRef: r }) => (
    <div>
      <input ref={r} type="tel" inputMode="numeric" maxLength={4} value={value}
        onChange={(e) => step === 2 ? handlePinInput(e.target.value) : handleConfirmInput(e.target.value)}
        placeholder="0000"
        className="w-full bg-surface-overlay border border-border rounded-lg px-4 py-4 text-center text-[24px] font-bold tracking-[0.5em] text-primary placeholder-label-faint focus:outline-none focus:border-label-dim transition-colors"
        autoFocus />
      {error && <p className="text-red-400 text-[12px] text-center mt-2">{error}</p>}
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
            <PinInput value={pin} inputRef={pinRef} />
          </div>
        )}

        {step === 3 && <PinInput value={confirmPin} inputRef={confirmRef} />}

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

function CampaignTimeline({ config, userData, campaignDays, onToggleDay }) {
  const today = getTodayISO();
  const p1Days = config.phase1?.days || 15;
  const startDate = parseDate(config.startDate);

  // Compute phase boundaries (config.startDate here is creator-facing start from getCreatorConfig)
  const phase1End = config.phase1EndDate
    ? parseDate(config.phase1EndDate)
    : (() => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + p1Days - 1);
        return d;
      })();
  const phase1EndISO = formatDateISO(phase1End);

  const phase2Start = new Date(phase1End);
  phase2Start.setDate(phase2Start.getDate() + 1);
  const phase2StartISO = formatDateISO(phase2Start);

  const lastDay = campaignDays[campaignDays.length - 1];
  const firstDay = campaignDays[0];
  const phase1DayCount = Math.max(1, campaignDays.filter((d) => d <= phase1EndISO).length);

  // Group by week rows (7 per row)
  const weeks = [];
  // Pad start to align to weekday
  const startDow = parseDate(firstDay).getDay();
  let currentWeek = Array(startDow).fill(null);

  campaignDays.forEach(iso => {
    currentWeek.push(iso);
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <div className="bg-surface-raised border border-border rounded-xl p-5 mb-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-primary">Campaign Timeline</h3>
        <span className="text-[11px] text-label-faint">{campaignDays.length} days</span>
      </div>

      {/* Phase indicator bar */}
      <div className="flex rounded overflow-hidden h-2 mb-1">
        <div className="h-full bg-label-dim" style={{ width: `${(phase1DayCount / campaignDays.length) * 100}%` }} title="Phase 1" />
        <div className="h-full bg-label" style={{ width: `${((campaignDays.length - phase1DayCount) / campaignDays.length) * 100}%` }} title="Phase 2" />
      </div>
      <div className="flex justify-between text-[10px] text-label-faint mb-4">
        <span>Phase 1 ends {formatDateShort(phase1End)}</span>
        <span>Campaign ends {formatDateShort(parseDate(lastDay))}</span>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} className="text-center text-[9px] text-label-faint font-semibold uppercase">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((iso, di) => {
              if (!iso) return <div key={"pad-" + di} />;

              const date = parseDate(iso);
              const dayNum = date.getDate();
              const dayData = userData.days[iso] || { posted: false };
              const isToday = iso === today;
              const isPast = iso < today;
              const isPosted = dayData.posted;
              const isFirstDay = iso === firstDay;
              const isLastDay = iso === lastDay;
              const isPhase1End = iso === phase1EndISO;
              const isPhase2Start = iso === phase2StartISO;
              const inPhase1 = iso <= phase1EndISO;

              let bg = "bg-surface border-border";
              if (isPosted) bg = "bg-emerald-500/10 border-emerald-500/30";
              else if (isToday) bg = "bg-surface border-primary/50";
              else if (isFirstDay || isLastDay) bg = "bg-emerald-500/5 border-emerald-500/20";
              else if (isPhase1End || isPhase2Start) bg = "bg-surface border-label-dim/40";

              // Tooltip
              let tooltip = formatDateShort(date);
              if (isFirstDay) tooltip += " \u2014 Campaign Start";
              if (isPhase1End) tooltip += " \u2014 Phase 1 Deadline";
              if (isPhase2Start) tooltip += " \u2014 Phase 2 Start";
              if (isLastDay) tooltip += " \u2014 Campaign End";
              if (isToday) tooltip += " \u2014 Today";

              return (
                <button key={iso} onClick={() => onToggleDay(iso)} title={tooltip}
                  className={`day-cell relative flex flex-col items-center justify-center rounded border min-h-[38px] aspect-square text-[11px] font-semibold transition-all cursor-pointer hover:border-label-dim ${bg}`}>
                  <span className={isPosted ? "text-emerald-400" : isToday ? "text-primary" : isPast && !isPosted ? "text-label-faint" : "text-primary"}>{dayNum}</span>
                  {isPosted && <span className="text-emerald-400 text-[7px] leading-none mt-0.5">Done</span>}
                  {isToday && !isPosted && <span className="text-[7px] text-primary/60 leading-none mt-0.5">Today</span>}
                  {isFirstDay && !isPosted && !isToday && <span className="text-[7px] text-emerald-400/60 leading-none mt-0.5">Start</span>}
                  {isPhase1End && !isPosted && !isToday && !isFirstDay && <span className="text-[7px] text-label-dim leading-none mt-0.5">P1 End</span>}
                  {isLastDay && !isPosted && !isToday && !isPhase1End && <span className="text-[7px] text-emerald-400/60 leading-none mt-0.5">End</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 text-[11px] text-label-faint">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-emerald-500/30 bg-emerald-500/10 inline-block" /> Posted</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-primary/50 bg-surface inline-block" /> Today</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-emerald-500/20 bg-emerald-500/5 inline-block" /> Start / End</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-label-dim/40 bg-surface inline-block" /> Phase Boundary</span>
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
  const isPhase2 = (config.phase2Creators || []).some(c => c.toLowerCase() === user.toLowerCase());
  const creatorCfg = useMemo(() => getCreatorConfig(config, isPhase2), [config, isPhase2]);
  const [userData, setUserData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const campaignDays = useMemo(() => getCampaignDays(creatorCfg), [creatorCfg]);

  useEffect(() => {
    (async () => {
      const fromDb = await dbLoadUserData(user, campaignId);
      const fromLocal = loadDaysFromLocalBackup(user, campaignId);
      let days = mergeDayMaps(fromDb, fromLocal);
      if (!days) {
        const defaultData = buildDefaultUserData(user, creatorCfg);
        days = defaultData.days;
        saveDaysToLocalBackup(user, campaignId, days);
        const ok = await dbSaveUserDays(user, campaignId, days);
        if (!ok) console.warn("Could not sync new tracker row to cloud; data is saved on this device.");
      } else {
        saveDaysToLocalBackup(user, campaignId, days);
        if (JSON.stringify(fromDb || {}) !== JSON.stringify(days)) {
          const ok = await dbSaveUserDays(user, campaignId, days);
          if (!ok) console.warn("Could not sync merged tracker data to cloud; backup kept locally.");
        }
      }
      setUserData({ username: user, days });
      setLoadingData(false);
    })();
  }, [user, campaignId]);

  const handleToggleDay = (dateStr) => {
    setUserData((prev) => {
      const newDays = {
        ...prev.days,
        [dateStr]: { ...prev.days[dateStr], posted: !prev.days[dateStr]?.posted },
      };
      saveDaysToLocalBackup(user, campaignId, newDays);
      dbSaveUserDays(user, campaignId, newDays).then((ok) => {
        if (!ok) console.warn("Cloud save failed; your change is still saved on this device.");
      });
      return { ...prev, days: newDays };
    });
  };

  if (loadingData || !userData) return <div className="min-h-screen flex items-center justify-center"><div className="text-label-dim text-[14px]">Loading...</div></div>;

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
      <CampaignHeader config={creatorCfg} userData={userData} onSwitchUser={onSwitchUser} onBack={onBack} showBack={showBack} />
      <CampaignTimeline config={creatorCfg} userData={userData} campaignDays={campaignDays} onToggleDay={handleToggleDay} />
      <StatsBar config={creatorCfg} userData={userData} campaignDays={campaignDays} />
    </div>
  );
}

// ── Campaign Manager Admin View (/slug/admin) ─────────────
const ADMIN_PINS = ["424342", "742896"];

function AdminPinGate({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.focus(); }, []);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (ADMIN_PINS.includes(pin)) { sessionStorage.setItem("campaign_admin_unlocked", "1"); onUnlock(); }
    else { setError(true); setPin(""); setTimeout(() => setError(false), 2000); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-surface-raised border border-border rounded-xl p-8 w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-[20px] font-bold text-primary mb-1">Campaign Manager</h1>
          <p className="text-[13px] text-label-dim">Enter your admin PIN to continue.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input ref={ref} type="password" inputMode="numeric" maxLength={6} value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="------"
            className={`w-full bg-surface-overlay border rounded-lg px-4 py-4 text-center text-[20px] font-bold tracking-[0.4em] text-primary placeholder-label-faint focus:outline-none transition-colors ${error ? "border-red-500/60" : "border-border focus:border-label-dim"}`} />
          {error && <p className="text-red-400 text-[12px] mt-2 text-center">Incorrect PIN.</p>}
          <button type="submit" className="w-full mt-4 bg-primary text-surface font-semibold rounded-lg py-3 text-[14px] hover:bg-accent transition-all">Unlock</button>
        </form>
      </div>
    </div>
  );
}

function formatMoney(n) { return n ? "$" + n.toLocaleString() : "$0"; }

function CampaignAdminView({ config }) {
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem("campaign_admin_unlocked") === "1");
  const [trackingData, setTrackingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const creatorCfg = useMemo(() => getCreatorConfig(config, true), [config]);
  const campaignDays = useMemo(() => getCampaignDays(creatorCfg), [creatorCfg]);
  const today = getTodayISO();

  useEffect(() => {
    if (!unlocked) return;
    (async () => {
      const rows = await dbLoadAllTrackingForCampaign(config.id);
      setTrackingData(rows);
      setLoading(false);
    })();
  }, [config.id, unlocked]);

  const refresh = async () => {
    setLoading(true);
    const rows = await dbLoadAllTrackingForCampaign(config.id);
    setTrackingData(rows);
    setLoading(false);
  };

  if (!unlocked) return <AdminPinGate onUnlock={() => setUnlocked(true)} />;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-label-dim text-[14px]">Loading campaign data...</div></div>;

  // Budget calcs
  const totalPostedAll = trackingData.reduce((sum, r) => sum + Object.values(r.days || {}).filter(d => d.posted).length, 0);
  const totalSpentOnCreators = totalPostedAll * config.ratePerVideo;
  const budgetRemaining = (config.retainerBudget || 0) - totalSpentOnCreators;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div>
          <div className="text-[11px] text-label-faint uppercase tracking-wider font-semibold mb-1">Campaign Manager</div>
          <h1 className="text-[22px] font-bold text-primary">{config.brandName}</h1>
          {config.productName && <p className="text-[13px] text-label-dim">{config.productName}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refresh} className="bg-surface-overlay border border-border text-label font-medium rounded-lg px-3 py-1.5 text-[12px] hover:border-border-light transition-all">Refresh</button>
          <a href="/adminmanage/" className="text-[12px] text-label-faint hover:text-primary transition-colors">Admin Panel</a>
        </div>
      </div>

      {/* Campaign stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { l: "Creators", v: config.creators?.length || 0 },
          { l: "Active Tracking", v: trackingData.length },
          { l: "Rate", v: "$" + config.ratePerVideo },
          { l: "Days Left", v: getDaysRemaining(creatorCfg) },
        ].map(s => (
          <div key={s.l} className="bg-surface-raised border border-border rounded-lg px-4 py-3">
            <div className="text-[10px] text-label-faint uppercase tracking-wide">{s.l}</div>
            <div className="text-[18px] font-bold text-primary mt-0.5">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Budget overview */}
      <div className="bg-surface-raised border border-border rounded-xl p-5 mb-6">
        <div className="text-[11px] font-semibold text-label-faint uppercase tracking-wider mb-3">Budget</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total Cost", v: formatMoney(config.totalBudget) },
            { l: "Mgmt Fee", v: formatMoney(config.managementFee) },
            { l: "Retainer Budget", v: formatMoney(config.retainerBudget) },
            { l: "Spent on Creators", v: formatMoney(totalSpentOnCreators) },
            { l: "Budget Remaining", v: formatMoney(budgetRemaining), warn: budgetRemaining < 0 },
          ].map(s => (
            <div key={s.l}>
              <div className="text-[10px] text-label-faint uppercase tracking-wide">{s.l}</div>
              <div className={`text-[16px] font-bold mt-0.5 ${s.warn ? "text-red-400" : "text-primary"}`}>{s.v}</div>
            </div>
          ))}
        </div>
        {config.upfrontPayment > 0 && (
          <div className="mt-3 pt-3 border-t border-border text-[11px] text-label-dim">
            Upfront payment collected: {formatMoney(config.upfrontPayment)}
          </div>
        )}
      </div>

      {/* Creator progress table */}
      <div className="bg-surface-raised border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-[14px] font-semibold text-primary">Creator Progress</h2>
        </div>

        {(config.creators || []).length === 0 ? (
          <div className="px-5 py-8 text-center text-label-faint text-[13px]">No creators assigned to this campaign.</div>
        ) : (
          <div className="divide-y divide-border">
            {(config.creators || []).map(handle => {
              const row = trackingData.find(r => r.username.toLowerCase() === handle.toLowerCase());
              const days = row ? row.days : {};
              const posted = Object.values(days).filter(d => d.posted).length;
              const total = config.totalVideos;
              const pct = total > 0 ? Math.round((posted / total) * 100) : 0;
              const earned = posted * config.ratePerVideo;
              const isPhase2 = (config.phase2Creators || []).some(c => c.toLowerCase() === handle.toLowerCase());
              const missed = campaignDays.filter(d => d < today && !(days[d]?.posted)).length;
              const postedDates = Object.entries(days).filter(([,v]) => v.posted).map(([k]) => k).sort();
              const lastPosted = postedDates.length > 0 ? postedDates[postedDates.length - 1] : null;

              return (
                <div key={handle} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-primary">{handle}</span>
                      {isPhase2 && <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">Phase 2</span>}
                    </div>
                    <span className="text-[13px] font-semibold text-primary">{pct}%</span>
                  </div>

                  <div className="w-full bg-surface rounded h-1.5 overflow-hidden mb-2">
                    <div className="bg-primary h-full rounded transition-all" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="flex gap-4 text-[11px] text-label-dim">
                    <span>{posted}/{total} posted</span>
                    <span>{missed} missed</span>
                    <span>${earned} earned</span>
                    {lastPosted && <span>Last: {formatDateShort(parseDate(lastPosted))}</span>}
                    {!row && <span className="text-label-faint">Not logged in yet</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
  const [adminCampaign, setAdminCampaign] = useState(null);

  useEffect(() => {
    (async () => {
      const { slug, isAdmin } = getSlugFromURL(); setUrlSlug(slug);

      // Campaign manager admin view
      if (isAdmin && slug) {
        const campaign = await dbGetCampaignBySlug(slug);
        if (!campaign) { setScreen("not-found"); setLoaded(true); return; }
        setAdminCampaign(campaign); setScreen("campaign-admin"); setLoaded(true); return;
      }

      let slugCampaign = null;
      if (slug) { slugCampaign = await dbGetCampaignBySlug(slug); if (!slugCampaign) { setScreen("not-found"); setLoaded(true); return; } }

      const loggedIn = getLoggedInUser();
      if (loggedIn) {
        if (slugCampaign) {
          const ok = slugCampaign.creators?.some(h => h.toLowerCase() === loggedIn.toLowerCase());
          if (ok) { setUser(loggedIn); setCampaigns([slugCampaign]); setSelectedCampaign(slugCampaign); setScreen("app"); }
          else setScreen("pin");
        } else {
          const uc = await dbGetCampaignsForUser(loggedIn);
          if (uc.length > 0) { setUser(loggedIn); setCampaigns(uc); if (uc.length === 1) setSelectedCampaign(uc[0]); setScreen("app"); }
          else setScreen("pin");
        }
      } else setScreen("pin");
      setLoaded(true);
    })();
  }, []);

  const loginAs = async (username) => {
    if (urlSlug) {
      const sc = await dbGetCampaignBySlug(urlSlug);
      if (sc?.creators?.some(h => h.toLowerCase() === username.toLowerCase())) {
        setUser(username); setCampaigns([sc]); setSelectedCampaign(sc); setScreen("app"); return;
      }
      setUser(username); setCampaigns([]); setScreen("no-campaigns"); return;
    }
    const uc = await dbGetCampaignsForUser(username); setUser(username); setCampaigns(uc);
    if (uc.length === 1) setSelectedCampaign(uc[0]); else setSelectedCampaign(null);
    setScreen(uc.length === 0 ? "no-campaigns" : "app");
  };

  const handleLogout = () => { clearLoggedInUser(); setUser(null); setCampaigns([]); setSelectedCampaign(null); setScreen("pin"); };

  if (!loaded) return <div className="min-h-screen flex items-center justify-center"><div className="text-label-dim text-[14px]">Loading...</div></div>;
  if (screen === "campaign-admin" && adminCampaign) return <CampaignAdminView config={adminCampaign} />;
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
