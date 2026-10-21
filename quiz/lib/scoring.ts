import matrix from "./scoring-matrix.json";

export type ResultTypeId =
  | "blood_deficiency"
  | "kidney_yin"
  | "kidney_yang"
  | "liver_qi_stagnation"
  | "dampness_accumulation"
  | "blood_stasis";

/** 0 = RARELY/NEVER, 1 = SOMETIMES, 2 = ALWAYS */
export type Answer = 0 | 1 | 2;
export type Scores = Record<ResultTypeId, number>;

export const CHOICES = matrix.choices as readonly string[];
/** Tie-break order: the first type in this list wins a tie (same as Typeform). */
export const RESULT_TYPES = matrix.types as { id: ResultTypeId; label: string }[];
export const QUESTION_COUNT = matrix.questions.length;

const POINTS: ResultTypeId[][][] = matrix.questions.map((q) =>
  CHOICES.map((c) => (q.points as Record<string, string[]>)[c] as ResultTypeId[]),
);

export function isValidAnswers(a: unknown): a is Answer[] {
  return (
    Array.isArray(a) &&
    a.length === QUESTION_COUNT &&
    a.every((x) => x === 0 || x === 1 || x === 2)
  );
}

export function computeScores(answers: Answer[]): Scores {
  if (!isValidAnswers(answers)) throw new Error("Expected 12 answers of 0, 1 or 2");
  const s = Object.fromEntries(RESULT_TYPES.map((t) => [t.id, 0])) as Scores;
  answers.forEach((a, q) => POINTS[q][a].forEach((t) => s[t]++));
  return s;
}

/** Highest score wins; strict ">" keeps the earliest type on a tie. */
export function winningType(scores: Scores): ResultTypeId {
  return RESULT_TYPES.reduce(
    (best, t) => (scores[t.id] > scores[best] ? t.id : best),
    RESULT_TYPES[0].id,
  );
}

export function computeResult(answers: Answer[]) {
  const scores = computeScores(answers);
  return { scores, resultType: winningType(scores) };
}

/** "CBBCCACBBBAA" -> [2,1,1,2,2,0,...] */
export function parsePattern(p: string): Answer[] {
  return p.split("").map((ch) => ({ A: 0, B: 1, C: 2 })[ch] as Answer);
}
