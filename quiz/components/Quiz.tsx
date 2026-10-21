"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Markdown } from "./Markdown";
import { CONTACT, INTRO, QUESTIONS, RESULTS } from "@/lib/content";
import {
  CONTACT_STEP,
  CONTACT_SUBMIT_LABEL,
  FIRST_Q,
  INTRO_STEP,
  LAST_Q,
  PROGRESS_TOTAL,
  RESULT_STEP,
} from "@/lib/flow";
import { computeResult, type Answer, type ResultTypeId } from "@/lib/scoring";
import { isValidEmail } from "@/lib/validation";

const KEYS = ["A", "B", "C"];
const TRANSITION_MS = 500;

type Dir = "next" | "prev";

export default function Quiz() {
  const [step, setStep] = useState(INTRO_STEP);
  const [leaving, setLeaving] = useState<{ step: number; dir: Dir } | null>(null);
  const [dir, setDir] = useState<Dir>("next");
  const [answers, setAnswers] = useState<(Answer | null)[]>(() => Array(QUESTIONS.length).fill(null));
  const [blinking, setBlinking] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [contactDone, setContactDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultTypeId | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const utm = useRef<Record<string, string>>({});
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.forEach((v, k) => {
      if (k.toLowerCase().startsWith("utm_") && v) utm.current[k.toLowerCase()] = v;
    });
  }, []);

  const go = useCallback(
    (to: number) => {
      if (to === step || to < INTRO_STEP || to > RESULT_STEP) return;
      const d: Dir = to > step ? "next" : "prev";
      setDir(d);
      setLeaving({ step, dir: d });
      setStep(to);
      setError(null);
      window.setTimeout(() => setLeaving(null), TRANSITION_MS);
    },
    [step],
  );

  useEffect(() => {
    if (step === CONTACT_STEP) {
      const t = window.setTimeout(() => firstNameRef.current?.focus({ preventScroll: true }), TRANSITION_MS);
      return () => window.clearTimeout(t);
    }
  }, [step]);

  const choose = useCallback(
    (q: number, a: Answer) => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      setAnswers((prev) => {
        const next = [...prev];
        next[q] = a;
        return next;
      });
      setError(null);
      setBlinking(a);
      advanceTimer.current = setTimeout(() => {
        setBlinking(null);
        go(q + 2); // question index q lives at step q+1
      }, 600);
    },
    [go],
  );

  const okQuestion = useCallback(
    (q: number) => {
      if (answers[q] === null) setError("Please make a selection");
      else go(q + 2);
    },
    [answers, go],
  );

  const submit = useCallback(async () => {
    if (submitting) return;
    const firstUnanswered = answers.findIndex((a) => a === null);
    if (firstUnanswered >= 0) return go(firstUnanswered + 1);
    if (!email.trim()) {
      setEmailError("Please fill this in");
      emailRef.current?.focus();
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError("Hmm... that email doesn't look right");
      emailRef.current?.focus();
      return;
    }
    setEmailError(null);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          email,
          answers,
          utm: utm.current,
          clientTimestamp: new Date().toISOString(),
          website: honeypot,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "We couldn't save your answers. Please try again.");
      const type: ResultTypeId = data.resultType ?? computeResult(answers as Answer[]).resultType;
      (document.activeElement as HTMLElement | null)?.blur();
      setContactDone(true);
      setResult(type);
      go(RESULT_STEP);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "We couldn't save your answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [answers, email, firstName, go, honeypot, submitting]);

  // Keyboard shortcuts: A/B/C to answer, Enter = OK, Ctrl/Cmd+Enter (or Enter) = Submit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || leaving) return;
      const target = e.target as HTMLElement;
      const inInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (step >= FIRST_Q && step <= LAST_Q && !inInput && !e.metaKey && !e.ctrlKey) {
        const idx = KEYS.indexOf(e.key.toUpperCase());
        if (idx >= 0) {
          e.preventDefault();
          choose(step - 1, idx as Answer);
          return;
        }
      }
      if (e.key !== "Enter") return;
      if (step === INTRO_STEP) {
        e.preventDefault();
        go(FIRST_Q);
      } else if (step >= FIRST_Q && step <= LAST_Q && !inInput) {
        e.preventDefault();
        okQuestion(step - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, go, leaving, okQuestion, step]);

  const answeredCount = answers.filter((a) => a !== null).length + (contactDone ? 1 : 0);
  const progress = answeredCount / PROGRESS_TOTAL;

  const renderScreen = (s: number) => {
    if (s === INTRO_STEP) {
      return (
        <Screen>
          <div className="statement">
            <h1 className="title">
              <Markdown text={INTRO.title} />
            </h1>
          </div>
          <div className="actions statement-actions">
            <button type="button" className="btn btn-primary" onClick={() => go(FIRST_Q)}>
              {INTRO.button}
            </button>
          </div>
          <MobileBar>
            <button type="button" className="btn btn-primary btn-block" onClick={() => go(FIRST_Q)}>
              {INTRO.button}
            </button>
          </MobileBar>
        </Screen>
      );
    }

    if (s >= FIRST_Q && s <= LAST_Q) {
      const q = s - 1;
      const question = QUESTIONS[q];
      return (
        <Screen>
          <div className="question">
            <h2 className="title">
              <span className="counter" aria-hidden="true">
                {s}
              </span>
              <span className="sr-only">Question {s} of {QUESTIONS.length}. </span>
              {question.title}
              <span className="required" aria-label="required">
                *
              </span>
            </h2>
            <div className="choices" role="radiogroup" aria-label={question.title}>
              {question.choices.map((label, i) => {
                const selected = answers[q] === i;
                return (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`choice${selected ? " selected" : ""}${selected && blinking === i && s === step ? " blink" : ""}`}
                    onClick={() => choose(q, i as Answer)}
                  >
                    <span className="key" aria-hidden="true">
                      {KEYS[i]}
                    </span>
                    <span className="label">{label}</span>
                    {selected && (
                      <svg className="check" viewBox="0 0 16 13" aria-hidden="true">
                        <path d="M14.293.293l1.414 1.414L5 12.414.293 7.707l1.414-1.414L5 9.586z" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            {error && s === step && <ErrorBox>{error}</ErrorBox>}
          </div>
          <MobileBar>
            <button type="button" className="btn btn-primary btn-back" aria-label="Previous" onClick={() => go(s - 1)}>
              <Chevron dir="left" />
            </button>
          </MobileBar>
        </Screen>
      );
    }

    if (s === CONTACT_STEP) {
      return (
        <Screen>
          <form
            className="question contact"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <h2 className="title">
              <span className="counter" aria-hidden="true">
                {CONTACT_STEP}
              </span>
              {CONTACT.title}
            </h2>
            <label className="field">
              <span className="field-label">{CONTACT.firstName.label}</span>
              <input
                ref={firstNameRef}
                type="text"
                name="firstName"
                autoComplete="given-name"
                placeholder={CONTACT.firstName.placeholder}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    emailRef.current?.focus();
                  }
                }}
                maxLength={100}
              />
            </label>
            <label className="field">
              <span className="field-label">
                {CONTACT.email.label}
                <span className="required" aria-label="required">
                  *
                </span>
              </span>
              <input
                ref={emailRef}
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                spellCheck={false}
                required
                aria-invalid={!!emailError}
                placeholder={CONTACT.email.placeholder}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                maxLength={254}
              />
            </label>
            <input
              className="hp"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
            {emailError && s === step && <ErrorBox>{emailError}</ErrorBox>}
            {submitError && s === step && <ErrorBox>{submitError}</ErrorBox>}
            <div className="actions">
              <button type="submit" className="btn btn-primary btn-submit" disabled={submitting} aria-busy={submitting}>
                {submitting ? <span className="spinner" aria-label="Saving" /> : CONTACT_SUBMIT_LABEL}
              </button>
            </div>
            <MobileBar>
              <button type="button" className="btn btn-primary btn-back" aria-label="Previous" onClick={() => go(s - 1)}>
                <Chevron dir="left" />
              </button>
              <button type="submit" className="btn btn-primary btn-block btn-submit" disabled={submitting} aria-busy={submitting}>
                {submitting ? <span className="spinner" aria-label="Saving" /> : CONTACT_SUBMIT_LABEL}
              </button>
            </MobileBar>
          </form>
        </Screen>
      );
    }

    if (s === RESULT_STEP && result) {
      return (
        <div className="screen ending" data-result={result}>
          <div className="ending-content">
            <p className="ending-text">
              <Markdown text={RESULTS[result].title} />
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const showChrome = step !== RESULT_STEP;

  return (
    <main className={`app${step === RESULT_STEP ? " is-ending" : ""}`}>
      <div className="bg" aria-hidden="true" />
      {showChrome && (
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      )}
      <div className="stage">
        {leaving && (
          <div key={`out-${leaving.step}`} className={`layer leave-${leaving.dir}`} aria-hidden="true" inert>
            {renderScreen(leaving.step)}
          </div>
        )}
        <div key={`in-${step}`} className={`layer${leaving ? ` enter-${dir}` : ""}`} data-step={step}>
          {renderScreen(step)}
        </div>
      </div>
      {showChrome && step !== INTRO_STEP && (
        <nav className="footer-nav" aria-label="Question navigation">
          <button type="button" className="nav-btn nav-prev" aria-label="Previous" onClick={() => go(step - 1)}>
            <Chevron dir="up" />
          </button>
          <button
            type="button"
            className="nav-btn nav-next"
            aria-label="Next"
            disabled={step >= CONTACT_STEP || answers[step - 1] === null}
            onClick={() => go(step + 1)}
          >
            <Chevron dir="down" />
          </button>
        </nav>
      )}
      {showChrome && step === INTRO_STEP && (
        <nav className="footer-nav" aria-label="Question navigation">
          <button type="button" className="nav-btn nav-prev" aria-label="Previous" disabled>
            <Chevron dir="up" />
          </button>
          <button type="button" className="nav-btn nav-next" aria-label="Next" onClick={() => go(FIRST_Q)}>
            <Chevron dir="down" />
          </button>
        </nav>
      )}
    </main>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="screen">
      <div className="content">{children}</div>
    </div>
  );
}

function MobileBar({ children }: { children: React.ReactNode }) {
  return <div className="mobile-bar">{children}</div>;
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="error" role="alert">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

function Chevron({ dir }: { dir: "up" | "down" | "left" }) {
  const rot = { up: 180, down: 0, left: 90 }[dir];
  return (
    <svg className="chev" viewBox="0 0 16 10" style={{ transform: `rotate(${rot}deg)` }} aria-hidden="true">
      <path d="M1.4 0L8 6.6 14.6 0 16 1.4l-8 8-8-8z" fill="currentColor" />
    </svg>
  );
}
