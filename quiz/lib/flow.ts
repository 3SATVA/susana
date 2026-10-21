import { QUESTIONS } from "./content";

/**
 * Screen order. Same as the Typeform except the "CLICK NOW TO REVEAL" / Submit statement was removed
 * (Michael, 2026-10-21): the email screen's button saves the lead and goes straight to the result.
 */
export const INTRO_STEP = 0;
export const FIRST_Q = 1;
export const LAST_Q = QUESTIONS.length; // 12
export const CONTACT_STEP = LAST_Q + 1; // 13
export const RESULT_STEP = CONTACT_STEP + 1; // 14
export const PROGRESS_TOTAL = QUESTIONS.length + 1; // 12 questions + contact info

export const SCREENS = [
  "intro",
  ...QUESTIONS.map((_, i) => `q${i + 1}`),
  "contact",
  "result",
] as const;

/** Label of the only submit button (email screen). Was "OK" in the Typeform. */
export const CONTACT_SUBMIT_LABEL = "REVEAL MY FERTILITY TYPE";
