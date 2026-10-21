export interface Template {
  id: string;
  subject: string;
  subjectPreview: string;
  preheader: string;
  sender: string;
  systemeCampaign: string | null;
  preview: string;
  original: string | null;
  problems: string[];
}
export interface Step { key: string; delay: string; template: string; delayMinutes: number; offsetMinutes: number }
export interface Sequence {
  key: string;
  name: string;
  description?: string;
  status: string;
  trigger: { type: string; tag?: string; source?: string };
  steps: Step[];
}
export type Action =
  | { type: "add_tag"; tag: string }
  | { type: "subscribe_campaign"; campaign: string }
  | { type: "send_email"; sequence: string };
export interface Trigger { type: string; label: string; funnel: string; step: string }
export interface Rule { n: number; active: boolean; duplicate_of?: number; trigger: Trigger; actions: Action[]; note?: string }
export interface Workflow { id: number; name: string; active: boolean; trigger: Trigger; actions: Action[]; note?: string }
export interface Flow {
  generatedAt: string;
  captured_at: string;
  sender: string;
  delay_semantics: string;
  brand: { name: string; from: string };
  templates: Record<string, Template>;
  sequences: Sequence[];
  rules: Rule[];
  workflows: Workflow[];
  unlinked: { sequence: string; note: string }[];
  email_boss_mapping: Record<string, string>;
}

export function fmtDuration(min: number): string {
  if (min === 0) return "immediately";
  const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d} day${d > 1 ? "s" : ""}`);
  if (h) parts.push(`${h} hour${h > 1 ? "s" : ""}`);
  if (m) parts.push(`${m} min`);
  return parts.join(" ");
}
export function fmtOffset(min: number): string {
  if (min < 1440) return min === 0 ? "Day 0" : `Day 0 · +${fmtDuration(min)}`;
  const d = Math.floor(min / 1440), rest = min % 1440;
  return rest ? `Day ${d} · +${fmtDuration(rest)}` : `Day ${d}`;
}
