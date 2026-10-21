import { describe, expect, it } from "vitest";
import { CONTACT_STEP, CONTACT_SUBMIT_LABEL, PROGRESS_TOTAL, RESULT_STEP, SCREENS } from "@/lib/flow";
import { CONTACT } from "@/lib/content";

describe("screen flow", () => {
  it("goes intro -> Q1..Q12 -> email -> result (no reveal/Submit screen)", () => {
    expect(SCREENS).toEqual([
      "intro", "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12", "contact", "result",
    ]);
    expect(SCREENS[CONTACT_STEP]).toBe("contact");
    expect(SCREENS[RESULT_STEP]).toBe("result");
    expect(RESULT_STEP).toBe(CONTACT_STEP + 1);
    expect(SCREENS).not.toContain("reveal");
  });

  it("email screen keeps the Typeform copy and its button is the reveal submit", () => {
    expect(CONTACT.title).toBe("Fill this out to reveal your FERTILITY TYPE");
    expect(CONTACT_SUBMIT_LABEL).toBe("REVEAL MY FERTILITY TYPE");
  });

  it("progress counts 12 questions + contact", () => {
    expect(PROGRESS_TOTAL).toBe(13);
  });
});
