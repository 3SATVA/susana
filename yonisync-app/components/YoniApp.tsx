"use client";

import { useEffect, useMemo, useState } from "react";
import MoonRing from "./MoonRing";
import {
  IconBowl, IconCalendar, IconCall, IconCheck, IconChevron, IconClose, IconDrop, IconHeart, IconLock,
  IconMoon, IconPlay, IconProfile, IconSun, IconSunrise,
} from "./icons";
import {
  CYCLE_LENGTH, FERTILITY_TYPES, MEALS, PHASES, PHASE_ORDER, SLOTS, addDays, cycleDay, dayDiff, isoDay, mealFor,
  phaseFor, startOfDay, type Meal, type PhaseId, type Slot,
} from "@/lib/cycle";

type Tab = "profile" | "calendar" | "courses" | "recipes" | "call";
const BOOK_URL = "https://www.yonisync.com/consult";
const LS = { period: "ys-demo-period-start", favs: "ys-demo-favs" };

const USER = {
  name: "Maya",
  fertilityType: "blood_deficiency",
  secondaryType: "liver_qi_stagnation",
  conditions: ["PCOS"],
  goal: "Trying to conceive",
};

const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-US", o);

export default function YoniApp() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("profile");
  const [today, setToday] = useState(() => startOfDay(new Date()));
  const [periodStart, setPeriodStart] = useState(() => addDays(startOfDay(new Date()), -8));
  const [favs, setFavs] = useState<string[]>([]);
  const [open, setOpen] = useState<{ meal: Meal; date?: Date; slot?: Slot } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const t = startOfDay(new Date());
    setToday(t);
    const saved = localStorage.getItem(LS.period);
    setPeriodStart(saved ? startOfDay(new Date(saved + "T00:00:00")) : addDays(t, -8));
    try { setFavs(JSON.parse(localStorage.getItem(LS.favs) || "[]")); } catch { /* ignore */ }
    const q = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    if (q && ["profile", "calendar", "courses", "recipes", "call"].includes(q)) setTab(q);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const toggleFav = (id: string) => {
    setFavs((f) => {
      const next = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
      localStorage.setItem(LS.favs, JSON.stringify(next));
      return next;
    });
  };

  const logPeriod = () => {
    setPeriodStart(today);
    localStorage.setItem(LS.period, isoDay(today));
    setToast("Period logged. Your calendar has been updated.");
  };
  const resetDemo = () => {
    localStorage.removeItem(LS.period);
    localStorage.removeItem(LS.favs);
    setPeriodStart(addDays(today, -8));
    setFavs([]);
    setToast("Demo reset");
  };

  return (
    <div className="stage">
      <div className="phone">
        <div className="screen">
          {!ready ? (
            <div className="splash"><img src="/yonisync-wordmark.png" alt="YoniSync" /></div>
          ) : (
            <>
              <header className="topbar">
                <img src="/yonisync-wordmark.png" alt="YoniSync" className="wordmark" />
                <span className="demo-pill">Demo</span>
              </header>
              <main className="scroll" key={tab}>
                {tab === "profile" && <Profile today={today} periodStart={periodStart} onLog={logPeriod} onReset={resetDemo} go={setTab} />}
                {tab === "calendar" && <Calendar today={today} periodStart={periodStart} onOpen={(meal, date, slot) => setOpen({ meal, date, slot })} />}
                {tab === "courses" && <Courses onLocked={(n) => setToast(`${n} unlocks with your YoniSync membership`)} />}
                {tab === "recipes" && <Recipes today={today} periodStart={periodStart} favs={favs} onToggleFav={toggleFav} onOpen={(meal) => setOpen({ meal })} />}
                {tab === "call" && <BookCall />}
              </main>
              <nav className="tabbar" aria-label="Main">
                {([
                  ["profile", "Profile", IconProfile],
                  ["calendar", "Calendar", IconCalendar],
                  ["courses", "Courses", IconPlay],
                  ["recipes", "Recipes", IconBowl],
                  ["call", "Book a Call", IconCall],
                ] as const).map(([id, label, Icon]) => (
                  <button key={id} className={`tab ${tab === id ? "on" : ""}`} onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}>
                    <span className="tab-ico"><Icon width={22} height={22} /></span>
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
              {open && (
                <RecipeSheet
                  meal={open.meal} date={open.date} slot={open.slot}
                  fav={favs.includes(open.meal.id)} onFav={() => toggleFav(open.meal.id)} onClose={() => setOpen(null)}
                />
              )}
              {toast && <div className="toast" role="status">{toast}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Profile ---------------- */

function Profile({ today, periodStart, onLog, onReset, go }: {
  today: Date; periodStart: Date; onLog: () => void; onReset: () => void; go: (t: Tab) => void;
}) {
  const day = cycleDay(today, periodStart);
  const phase = phaseFor(day);
  const P = PHASES[phase];
  const nextPeriod = addDays(today, CYCLE_LENGTH - day + 1);
  const daysToPeriod = dayDiff(nextPeriod, today);
  const cycleStart = addDays(today, -(day - 1));
  const fertileStart = addDays(cycleStart, 12 + (day > 16 ? CYCLE_LENGTH : 0));
  const todayMeals = SLOTS.map((s) => mealFor(today, periodStart, s.id));

  return (
    <div className="page">
      <div className="hello">
        <div>
          <p className="eyebrow">{fmt(today, { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="display">Hi, {USER.name}</h1>
        </div>
        <div className="avatar" aria-hidden>{USER.name[0]}</div>
      </div>

      <section className="card moon-card" style={{ background: `linear-gradient(180deg, ${P.soft} 0%, #fff 70%)` }}>
        <MoonRing day={day} />
        <p className="focus">{P.focus}</p>
        <div className="legend">
          {PHASE_ORDER.map((id) => (
            <span key={id} className={id === phase ? "on" : ""}><i style={{ background: PHASES[id].color }} />{PHASES[id].label}</span>
          ))}
        </div>
        <button className="btn primary" onClick={onLog}><IconDrop width={18} height={18} /> Log period started</button>
      </section>

      <div className="stats">
        <div className="stat"><span>Next period</span><b>{fmt(nextPeriod, { month: "short", day: "numeric" })}</b><small>in {daysToPeriod} days</small></div>
        <div className="stat"><span>Fertile window</span><b>{day >= 13 && day <= 16 ? "Now" : fmt(fertileStart, { month: "short", day: "numeric" })}</b><small>{day >= 13 && day <= 16 ? "peak days" : "estimated"}</small></div>
        <div className="stat"><span>Cycle length</span><b>{CYCLE_LENGTH} days</b><small>average</small></div>
      </div>

      <section className="card">
        <h2 className="h2">Your fertility profile</h2>
        <div className="row"><span className="k">Fertility type</span><span className="chip type">{FERTILITY_TYPES[USER.fertilityType]}</span></div>
        <div className="row"><span className="k">Secondary</span><span className="chip">{FERTILITY_TYPES[USER.secondaryType]}</span></div>
        <div className="row"><span className="k">Conditions</span><span>{USER.conditions.map((c) => <span key={c} className="chip cond">{c}</span>)}</span></div>
        <div className="row"><span className="k">Goal</span><span className="v">{USER.goal}</span></div>
        <p className="tiny">From your Fertility Type Quiz · Retake anytime</p>
      </section>

      <section className="card today-card">
        <div className="h2row"><h2 className="h2">Today&rsquo;s nourishment</h2><button className="link" onClick={() => go("calendar")}>Week view</button></div>
        <ul className="mini-meals">
          {todayMeals.map((m, i) => (
            <li key={m.id}><span className="slot-dot" style={{ background: P.color }} /><span className="slot-k">{SLOTS[i].label}</span><span className="slot-v">{m.name}</span></li>
          ))}
        </ul>
      </section>

      <p className="disclaimer">
        For education only, not medical advice. YoniSync doesn&rsquo;t diagnose or treat any condition. Talk with your
        healthcare provider before changing your diet, supplements or treatment.
      </p>
      <button className="link center" onClick={onReset}>Reset demo</button>
    </div>
  );
}

/* ---------------- Calendar ---------------- */

const SLOT_ICON = { breakfast: IconSunrise, lunch: IconSun, dinner: IconMoon } as const;
const SLOT_SHORT = { breakfast: "Morning", lunch: "Lunch", dinner: "Dinner" } as const;

function Calendar({ today, periodStart, onOpen }: { today: Date; periodStart: Date; onOpen: (m: Meal, d: Date, s: Slot) => void }) {
  const [offset, setOffset] = useState(0);
  const [sel, setSel] = useState<Date>(today);
  const weekStart = addDays(today, -today.getDay() + offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const selDay = cycleDay(sel, periodStart);
  const selPhase = PHASES[phaseFor(selDay)];
  const range = `${fmt(days[0], { month: "short", day: "numeric" })} – ${fmt(days[6], { month: days[0].getMonth() === days[6].getMonth() ? undefined : "short", day: "numeric" })}`;

  const shift = (n: number) => {
    setOffset((o) => o + n);
    setSel(addDays(weekStart, n * 7 + (offset + n === 0 ? today.getDay() : 0)));
  };

  return (
    <div className="page cal">
      <div className="cal-head">
        <button className="round" onClick={() => shift(-1)} aria-label="Previous week"><IconChevron dir="left" width={18} height={18} /></button>
        <div className="cal-title">
          <p className="eyebrow">{offset === 0 ? "This week" : offset === 1 ? "Next week" : offset === -1 ? "Last week" : fmt(days[0], { month: "long", year: "numeric" })}</p>
          <h1 className="display sm">{range}</h1>
        </div>
        <button className="round" onClick={() => shift(1)} aria-label="Next week"><IconChevron width={18} height={18} /></button>
      </div>

      <div className="week">
        {days.map((d) => {
          const cd = cycleDay(d, periodStart);
          const ph = PHASES[phaseFor(cd)];
          const isToday = dayDiff(d, today) === 0;
          const isSel = dayDiff(d, sel) === 0;
          return (
            <div key={isoDay(d)} className={`col ${isSel ? "sel" : ""}`} style={{ ["--ph" as string]: ph.color, ["--phs" as string]: ph.soft, ["--phi" as string]: ph.ink }}>
              <button className={`col-head ${isToday ? "today" : ""}`} onClick={() => setSel(d)} aria-label={fmt(d, { weekday: "long", month: "long", day: "numeric" })}>
                <span className="wd">{fmt(d, { weekday: "narrow" })}</span>
                <span className="dn">{d.getDate()}</span>
                <span className="ph-bar" title={ph.label} />
                <span className="cd">D{cd}</span>
              </button>
              {SLOTS.map((s) => {
                const m = mealFor(d, periodStart, s.id);
                const Icon = SLOT_ICON[s.id];
                return (
                  <button key={s.id} className="meal-btn" onClick={() => { setSel(d); onOpen(m, d, s.id); }} aria-label={`${s.label}: ${m.name}`}>
                    <Icon width={17} height={17} />
                    <span>{SLOT_SHORT[s.id]}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="phase-key">
        {PHASE_ORDER.map((id) => <span key={id}><i style={{ background: PHASES[id].color }} />{PHASES[id].label}</span>)}
      </div>

      <section className="card day-card" style={{ borderTop: `4px solid ${selPhase.color}` }}>
        <div className="h2row">
          <h2 className="h2">{fmt(sel, { weekday: "long", month: "short", day: "numeric" })}</h2>
          <span className="chip" style={{ background: selPhase.soft, color: selPhase.ink }}>Day {selDay} · {selPhase.label}</span>
        </div>
        <p className="why">{selPhase.why}</p>
        <ul className="day-meals">
          {SLOTS.map((s) => {
            const m = mealFor(sel, periodStart, s.id);
            const Icon = SLOT_ICON[s.id];
            return (
              <li key={s.id}>
                <button onClick={() => onOpen(m, sel, s.id)}>
                  <span className="dm-ico" style={{ background: selPhase.soft, color: selPhase.ink }}><Icon width={18} height={18} /></span>
                  <span className="dm-txt"><small>{s.label}</small><b>{m.name}</b></span>
                  <IconChevron width={16} height={16} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/* ---------------- Recipe sheet ---------------- */

function Thumb({ meal, size = 64 }: { meal: Meal; size?: number }) {
  const P = PHASES[meal.phase];
  const Icon = SLOT_ICON[meal.slot];
  return (
    <span className="thumb" style={{ width: size, height: size, background: `radial-gradient(circle at 30% 25%, #fff 0%, ${P.soft} 45%, ${P.color} 120%)`, color: P.ink }}>
      <Icon width={size * 0.4} height={size * 0.4} />
    </span>
  );
}

function RecipeSheet({ meal, date, slot, fav, onFav, onClose }: {
  meal: Meal; date?: Date; slot?: Slot; fav: boolean; onFav: () => void; onClose: () => void;
}) {
  const P = PHASES[meal.phase];
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={meal.name} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-hero" style={{ background: `linear-gradient(135deg, ${P.soft}, ${P.color})` }}>
          <span className="grab" />
          <button className="round ghost close" onClick={onClose} aria-label="Close"><IconClose width={18} height={18} /></button>
          <Thumb meal={meal} size={84} />
        </div>
        <div className="sheet-body">
          <p className="eyebrow">
            {slot ? SLOTS.find((s) => s.id === slot)!.label : SLOTS.find((s) => s.id === meal.slot)!.label}
            {date ? ` · ${date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}` : ""}
          </p>
          <h2 className="display sm">{meal.name}</h2>
          <p className="local">{meal.local}</p>
          <div className="chips">
            <span className="chip" style={{ background: P.soft, color: P.ink }}>{P.label} phase</span>
            <span className="chip type">{FERTILITY_TYPES[USER.fertilityType]}</span>
            <span className="chip cond">PCOS-friendly</span>
          </div>
          <div className="why-box" style={{ background: P.soft }}>
            <b>Why this today</b>
            <p>{P.why}</p>
          </div>
          <h3 className="h3">Ingredients</h3>
          <ul className="ingredients">
            {meal.ingredients.map((x, i) => <li key={i}><IconCheck width={14} height={14} />{x}</li>)}
          </ul>
          <p className="tiny">Full step-by-step method in the app.</p>
          <div className="sheet-actions">
            <button className={`btn ${fav ? "soft" : "outline"}`} onClick={onFav}><IconHeart filled={fav} width={18} height={18} /> {fav ? "Saved" : "Save to favorites"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Recipes ---------------- */

function Recipes({ today, periodStart, favs, onToggleFav, onOpen }: {
  today: Date; periodStart: Date; favs: string[]; onToggleFav: (id: string) => void; onOpen: (m: Meal) => void;
}) {
  const [filter, setFilter] = useState<"week" | "favs" | PhaseId>("week");
  const weekStart = addDays(today, -today.getDay());
  const weekMeals = useMemo(() => {
    const seen = new Map<string, Meal>();
    for (let i = 0; i < 7; i++) for (const s of SLOTS) { const m = mealFor(addDays(weekStart, i), periodStart, s.id); seen.set(m.id, m); }
    return [...seen.values()];
  }, [weekStart.getTime(), periodStart.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = filter === "week" ? weekMeals : filter === "favs" ? MEALS.filter((m) => favs.includes(m.id)) : MEALS.filter((m) => m.phase === filter);
  const chips: { id: typeof filter; label: string; color?: string }[] = [
    { id: "week", label: "This week" },
    { id: "favs", label: `Favorites${favs.length ? ` · ${favs.length}` : ""}` },
    ...PHASE_ORDER.map((id) => ({ id, label: PHASES[id].label, color: PHASES[id].color })),
  ];

  return (
    <div className="page">
      <p className="eyebrow">Curated for you</p>
      <h1 className="display">Your recipes</h1>
      <p className="sub">Chosen by Susana for your cycle phase and your {FERTILITY_TYPES[USER.fertilityType]} type.</p>
      <div className="chip-row" role="tablist">
        {chips.map((c) => (
          <button key={c.id} role="tab" aria-selected={filter === c.id} className={`fchip ${filter === c.id ? "on" : ""}`} onClick={() => setFilter(c.id)}>
            {c.color && <i style={{ background: c.color }} />}{c.label}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="empty card">
          <IconHeart width={28} height={28} />
          <p>No favorites yet. Tap the heart on any recipe to save it here.</p>
        </div>
      ) : (
        <ul className="recipe-list">
          {list.map((m) => {
            const P = PHASES[m.phase];
            const on = favs.includes(m.id);
            return (
              <li key={m.id} className="recipe-row">
                <button className="rr-main" onClick={() => onOpen(m)}>
                  <Thumb meal={m} size={58} />
                  <span className="rr-txt">
                    <b>{m.name}</b>
                    <small><i style={{ background: P.color }} />{P.label} · {SLOTS.find((s) => s.id === m.slot)!.label}</small>
                  </span>
                </button>
                <button className={`heart ${on ? "on" : ""}`} onClick={() => onToggleFav(m.id)} aria-label={on ? "Remove from favorites" : "Save to favorites"}>
                  <IconHeart filled={on} width={20} height={20} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Courses ---------------- */

const COURSES = [
  { title: "Know Your Fertility Type", sub: "Free mini-course · 4 lessons", grad: ["#FBE7EC", "#E9A6B6"], unlocked: true, progress: 0.5 },
  { title: "Flow Formula™", sub: "Hormone & cycle balance", grad: ["#EFEAF8", "#C9B8E6"], unlocked: false },
  { title: "Womb in Bloom™", sub: "Preconception coaching, 35+", grad: ["#E6F4EE", "#AFD8C6"], unlocked: false },
  { title: "Eating for Your Cycle", sub: "Phase-by-phase kitchen guide", grad: ["#FCF2DE", "#F2D29A"], unlocked: false },
  { title: "Bio-Chakra Blueprint", sub: "Energy, focus & intuition", grad: ["#F6E4EF", "#D69EB2"], unlocked: false },
  { title: "His Fertility, 90 Days", sub: "For your partner", grad: ["#EAF0F6", "#B9CBE0"], unlocked: false },
];

function Courses({ onLocked }: { onLocked: (name: string) => void }) {
  return (
    <div className="page">
      <p className="eyebrow">Learn with Susana</p>
      <h1 className="display">Video courses</h1>
      <p className="sub">Short, gentle lessons you can watch at your own pace.</p>
      <div className="course-grid">
        {COURSES.map((c) => (
          <button key={c.title} className="course" onClick={() => !c.unlocked && onLocked(c.title)}>
            <span className="course-thumb" style={{ background: `linear-gradient(140deg, ${c.grad[0]}, ${c.grad[1]})` }}>
              <img src="/yonisync-mark.png" alt="" className="course-mark" />
              <span className={`play ${c.unlocked ? "" : "locked"}`}>{c.unlocked ? <IconPlay width={18} height={18} /> : <IconLock width={16} height={16} />}</span>
            </span>
            <span className="course-txt">
              <b>{c.title}</b>
              <small>{c.sub}</small>
              {c.unlocked ? (
                <span className="progress"><span style={{ width: `${(c.progress ?? 0) * 100}%` }} /></span>
              ) : (
                <span className="unlock"><IconLock width={12} height={12} /> Unlock</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Book a call ---------------- */

function BookCall() {
  return (
    <div className="page">
      <p className="eyebrow">1:1 support</p>
      <h1 className="display">Book a call</h1>
      <section className="card call-card">
        <img src="/susana.jpg" alt="Susana Puelles, L.Ac." className="susana" />
        <div className="call-body">
          <h2 className="display sm">Susana Puelles, L.Ac.</h2>
          <p className="role">Licensed acupuncturist · Fertility &amp; hormone specialist</p>
          <h3 className="h3">Fertility Strategy Call</h3>
          <ul className="ticks">
            <li><IconCheck width={16} height={16} />Review your cycle, fertility type and history</li>
            <li><IconCheck width={16} height={16} />Get clear next steps for your body</li>
            <li><IconCheck width={16} height={16} />See if 1:1 care or a program is right for you</li>
          </ul>
          <a className="btn primary block" href={BOOK_URL} target="_blank" rel="noopener noreferrer"><IconCall width={18} height={18} /> Book a call</a>
          <p className="tiny center">Opens Susana&rsquo;s booking page on yonisync.com</p>
        </div>
      </section>
    </div>
  );
}
