import content from "./quiz-content.json";
import type { ResultTypeId } from "./scoring";

export const INTRO = content.intro;
export const QUESTIONS = content.questions;
export const CONTACT = content.contact;
export const RESULTS = content.results as Record<ResultTypeId, { ref: string; title: string }>;
