import mealsJson from "./meals.json";

export type PhaseId = "menstrual" | "follicular" | "ovulation" | "luteal";
export type Slot = "breakfast" | "lunch" | "dinner";
export type Meal = {
  id: string;
  name: string;
  local: string;
  phase: PhaseId;
  slot: Slot;
  course: string;
  ingredients: string[];
};

export const MEALS = mealsJson as Meal[];
export const CYCLE_LENGTH = 28;

export const PHASES: Record<
  PhaseId,
  { label: string; moon: string; days: [number, number]; color: string; soft: string; ink: string; why: string; focus: string }
> = {
  menstrual: {
    label: "Menstrual",
    moon: "New moon",
    days: [1, 5],
    color: "#E9A6B6",
    soft: "#FBE7EC",
    ink: "#9C4A63",
    focus: "Rest, warmth and replenishing",
    why: "Warm, iron-rich and easy to digest, to gently rebuild blood while you rest.",
  },
  follicular: {
    label: "Follicular",
    moon: "Waxing moon",
    days: [6, 13],
    color: "#AFD8C6",
    soft: "#E6F4EE",
    ink: "#3F7C66",
    focus: "Fresh energy and new beginnings",
    why: "Light, fresh foods and lean protein to support rising estrogen and growing follicles.",
  },
  ovulation: {
    label: "Ovulation",
    moon: "Full moon",
    days: [14, 16],
    color: "#F2D29A",
    soft: "#FCF2DE",
    ink: "#9A6B1E",
    focus: "Your fertile window",
    why: "Fiber, antioxidants and zinc-rich seafood to support your most fertile days.",
  },
  luteal: {
    label: "Luteal",
    moon: "Waning moon",
    days: [17, 28],
    color: "#C9B8E6",
    soft: "#EFEAF8",
    ink: "#6A5294",
    focus: "Grounding and nourishing",
    why: "Grounding complex carbs and magnesium-rich foods to steady mood and cravings.",
  },
};

export const PHASE_ORDER: PhaseId[] = ["menstrual", "follicular", "ovulation", "luteal"];
export const SLOTS: { id: Slot; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
];

const DAY = 86400000;
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const dayDiff = (a: Date, b: Date) => Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY);
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** 1-based cycle day for a date, given the last period start. */
export function cycleDay(date: Date, periodStart: Date) {
  const n = dayDiff(date, periodStart);
  return (((n % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH) + 1;
}

export function phaseFor(day: number): PhaseId {
  for (const id of PHASE_ORDER) {
    const [a, b] = PHASES[id].days;
    if (day >= a && day <= b) return id;
  }
  return "luteal";
}

/** Demo rule: pick from the meals tagged for that day's phase and meal slot, rotating by date. */
export function mealFor(date: Date, periodStart: Date, slot: Slot): Meal {
  const phase = phaseFor(cycleDay(date, periodStart));
  const pool = MEALS.filter((m) => m.phase === phase && m.slot === slot);
  const seed = Math.floor(startOfDay(date).getTime() / DAY) + (slot === "lunch" ? 1 : slot === "dinner" ? 2 : 0);
  return pool[((seed % pool.length) + pool.length) % pool.length];
}

export const FERTILITY_TYPES: Record<string, string> = {
  blood_deficiency: "Blood Deficiency",
  kidney_yin: "Kidney Yin",
  kidney_yang: "Kidney Yang",
  liver_qi_stagnation: "Liver Qi Stagnation",
  dampness_accumulation: "Dampness Accumulation",
  blood_stasis: "Blood Stasis",
};
