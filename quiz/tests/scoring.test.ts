import { describe, expect, it } from "vitest";
import { computeResult, parsePattern, RESULT_TYPES, type ResultTypeId } from "@/lib/scoring";
import matrix from "@/lib/scoring-matrix.json";

// From SPEC.md: answer patterns verified against the live Typeform renderer.
// Scores order: BD, KYin, KYang, LQ, Damp, Stasis
const CASES: [ResultTypeId, string, number[]][] = [
  ["blood_deficiency", "CBBCCACBBBAA", [11, 4, 3, 4, 3, 2]],
  ["kidney_yin", "ACABAAAAABAA", [3, 10, 1, 1, 3, 3]],
  ["kidney_yang", "CACBCBACCCBB", [3, 3, 10, 3, 3, 3]],
  ["liver_qi_stagnation", "BBBBBCCBCACC", [4, 1, 4, 11, 4, 4]],
  ["dampness_accumulation", "CABAAAAAACCC", [2, 3, 4, 4, 10, 4]],
  ["blood_stasis", "AACAABBBAABA", [3, 4, 4, 1, 4, 10]],
];

const order = RESULT_TYPES.map((t) => t.id);

describe("Typeform scoring parity", () => {
  it.each(CASES)("%s via %s", (expected, pattern, expectedScores) => {
    const { resultType, scores } = computeResult(parsePattern(pattern));
    expect(order.map((t) => scores[t])).toEqual(expectedScores);
    expect(resultType).toBe(expected);
  });

  it("all SOMETIMES ties Blood Deficiency & Liver Qi at 6 -> Blood Deficiency (first in order wins)", () => {
    const { resultType, scores } = computeResult(parsePattern("BBBBBBBBBBBB"));
    expect(order.map((t) => scores[t])).toEqual([6, 4, 3, 6, 3, 4]);
    expect(resultType).toBe("blood_deficiency");
  });

  it("tie-break order is exactly BD, KYin, KYang, LQ, Damp, Stasis", () => {
    expect(order).toEqual([
      "blood_deficiency",
      "kidney_yin",
      "kidney_yang",
      "liver_qi_stagnation",
      "dampness_accumulation",
      "blood_stasis",
    ]);
  });

  it("keeps the original quirks (Q12 SOMETIMES scores nothing; Q1/Q11 RARELY still score)", () => {
    expect(matrix.questions[11].points.SOMETIMES).toEqual([]);
    expect(matrix.questions[0].points["RARELY/NEVER"]).toEqual(["kidney_yin", "blood_stasis"]);
    expect(matrix.questions[10].points["RARELY/NEVER"]).toEqual(["blood_deficiency", "kidney_yin"]);
  });

  it("each type is scored by exactly one answer per question, except none on Q12 SOMETIMES", () => {
    for (const q of matrix.questions) {
      for (const t of order) {
        const hits = Object.values(q.points).filter((ts) => (ts as string[]).includes(t)).length;
        expect(hits).toBe(1);
      }
    }
  });

  it("rejects malformed answers", () => {
    expect(() => computeResult([0, 1] as never)).toThrow();
    expect(() => computeResult(Array(12).fill(3) as never)).toThrow();
  });
});
