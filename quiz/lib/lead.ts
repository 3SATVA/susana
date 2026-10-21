import { CHOICES, type Answer, type ResultTypeId, type Scores } from "./scoring";
import type { LeadInput } from "./validation";

export type LeadRow = {
  first_name: string | null;
  email: string;
  result_type: ResultTypeId;
  score_blood_deficiency: number;
  score_kidney_yin: number;
  score_kidney_yang: number;
  score_liver_qi_stagnation: number;
  score_dampness_accumulation: number;
  score_blood_stasis: number;
  answers: { q: number; answer: string }[];
  utm: Record<string, string>;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  user_agent: string | null;
  client_submitted_at: string | null;
  submitted_at: string;
};

export function buildLeadRow(
  input: LeadInput,
  scores: Scores,
  resultType: ResultTypeId,
  userAgent: string | null,
  now = new Date(),
): LeadRow {
  return {
    first_name: input.firstName,
    email: input.email,
    result_type: resultType,
    score_blood_deficiency: scores.blood_deficiency,
    score_kidney_yin: scores.kidney_yin,
    score_kidney_yang: scores.kidney_yang,
    score_liver_qi_stagnation: scores.liver_qi_stagnation,
    score_dampness_accumulation: scores.dampness_accumulation,
    score_blood_stasis: scores.blood_stasis,
    answers: input.answers.map((a: Answer, i) => ({ q: i + 1, answer: CHOICES[a] })),
    utm: input.utm,
    utm_source: input.utm.utm_source ?? null,
    utm_medium: input.utm.utm_medium ?? null,
    utm_campaign: input.utm.utm_campaign ?? null,
    user_agent: userAgent ? userAgent.slice(0, 1000) : null,
    client_submitted_at: input.clientTimestamp,
    submitted_at: now.toISOString(),
  };
}

