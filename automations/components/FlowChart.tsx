"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fmtDuration, fmtOffset, type Action, type Flow, type Rule, type Sequence, type Trigger, type Workflow } from "@/lib/types";

const ORDER = ["fertility-webinar-signed-up", "checklist-campaign", "fertility-type-quiz", "yoni-flow-welcome"];
const TRIGGER_ICON: Record<string, string> = {
  form_subscribed: "📝",
  funnel_form_subscribed: "📝",
  webinar_registered: "🎥",
  page_visited: "👁️",
  new_sale: "💳",
};

type Entry = { kind: "rule"; rule: Rule } | { kind: "workflow"; wf: Workflow };

function feeds(actions: Action[], key: string) {
  return actions.some((a) => (a.type === "subscribe_campaign" && a.campaign === key) || (a.type === "send_email" && a.sequence === key));
}

function ActionChip({ a, flow }: { a: Action; flow: Flow }) {
  if (a.type === "add_tag") return <span className="chip chip-tag">🏷️ Add tag <b>{a.tag}</b></span>;
  const seq = flow.sequences.find((s) => s.key === (a.type === "subscribe_campaign" ? a.campaign : a.sequence));
  if (a.type === "subscribe_campaign") return <span className="chip chip-sub">➕ Subscribe to campaign <b>{seq?.name ?? a.campaign}</b></span>;
  const t = seq ? flow.templates[seq.steps[0].template] : null;
  return <span className="chip chip-send">✉️ Send email <b>{t?.subjectPreview ?? a.sequence}</b></span>;
}

function TriggerBlock({ trigger }: { trigger: Trigger }) {
  return (
    <div className="trig">
      <span className="trig-icon" aria-hidden>{TRIGGER_ICON[trigger.type] ?? "⚡"}</span>
      <div>
        <div className="trig-label">{trigger.label}</div>
        <div className="trig-where">{trigger.funnel} <span className="arrow">→</span> {trigger.step}</div>
      </div>
    </div>
  );
}

function EntryCard({ e, flow }: { e: Entry; flow: Flow }) {
  const isRule = e.kind === "rule";
  const active = isRule ? e.rule.active : e.wf.active;
  const trigger = isRule ? e.rule.trigger : e.wf.trigger;
  const actions = isRule ? e.rule.actions : e.wf.actions;
  const note = isRule ? e.rule.note : e.wf.note;
  return (
    <div className={`card entry ${active ? "" : "inactive"}`}>
      <div className="badges">
        <span className="badge badge-id">{isRule ? `Rule #${e.rule.n}` : `Workflow · ${e.wf.name}`}</span>
        <span className={`badge ${active ? "badge-on" : "badge-off"}`}>{active ? "Active" : "Inactive"}</span>
        {isRule && e.rule.duplicate_of ? <span className="badge badge-dup">Duplicate of #{e.rule.duplicate_of}</span> : null}
        {!isRule && <span className="badge badge-dup">Duplicates rule #12</span>}
      </div>
      <TriggerBlock trigger={trigger} />
      <div className="chips">{actions.map((a, i) => <ActionChip key={i} a={a} flow={flow} />)}</div>
      {note ? <p className="note">{note}</p> : null}
    </div>
  );
}

function engineTrigger(s: Sequence) {
  if (s.trigger.type === "tag_added") return `tag added: ${s.trigger.tag}`;
  if (s.trigger.type === "signup_source") return `signup source: ${s.trigger.source}`;
  return s.trigger.type;
}

function SequenceFlow({ seq, flow, onOpen }: { seq: Sequence; flow: Flow; onOpen: (id: string) => void }) {
  const entries: Entry[] = [
    ...flow.rules.filter((r) => feeds(r.actions, seq.key)).map((rule) => ({ kind: "rule" as const, rule })),
    ...flow.workflows.filter((w) => feeds(w.actions, seq.key)).map((wf) => ({ kind: "workflow" as const, wf })),
  ];
  const unlinked = flow.unlinked.find((u) => u.sequence === seq.key);
  const total = seq.steps[seq.steps.length - 1].offsetMinutes;
  const systemeName = flow.templates[seq.steps[0].template]?.systemeCampaign;
  return (
    <section className="flow" id={seq.key}>
      <header className="flow-head">
        <div>
          <h2>{seq.name}</h2>
          <p className="flow-sub">
            {seq.steps.length} email{seq.steps.length > 1 ? "s" : ""} · runs over {total ? fmtDuration(total) : "a single send"}
            {systemeName && !systemeName.startsWith("Standalone") ? <> · systeme campaign “{systemeName}”</> : null}
          </p>
        </div>
        <span className="badge badge-paused" title="Replicated in email_boss; paused until SES is set up">email_boss: {seq.status}</span>
      </header>

      <div className="lane-label">Triggers</div>
      <div className="entries">
        {entries.map((e) => <EntryCard key={e.kind === "rule" ? `r${e.rule.n}` : `w${e.wf.id}`} e={e} flow={flow} />)}
        {unlinked ? (
          <div className="card entry unknown">
            <div className="badges"><span className="badge badge-warn">No systeme trigger found</span></div>
            <TriggerBlock trigger={{ type: "quiz", label: "Fertility Type quiz completed", funnel: "Typeform / new YoniSync quiz", step: "results" }} />
            <p className="note">{unlinked.note}</p>
          </div>
        ) : null}
      </div>

      <div className="merge" aria-hidden><span /></div>
      <div className="start">
        <span className="start-dot" aria-hidden>▶</span>
        <div>
          <div className="start-title">Contact enters “{seq.name}”</div>
          <div className="start-sub">email_boss trigger: <code>{engineTrigger(seq)}</code></div>
        </div>
      </div>

      <ol className="steps">
        {seq.steps.map((st, i) => {
          const t = flow.templates[st.template];
          return (
            <li key={st.key} className="step">
              <div className="delay">
                <span className="delay-pill">⏱ {st.delayMinutes === 0 ? "Send immediately" : `Wait ${fmtDuration(st.delayMinutes)}`}</span>
                <span className="delay-after">{i === 0 ? "after entering" : "after previous email"}</span>
              </div>
              <button type="button" className="card email" onClick={() => onOpen(st.template)} aria-label={`Open email ${i + 1}: ${t.subjectPreview}`}>
                <span className="email-num">{i + 1}</span>
                <span className="email-body">
                  <span className="email-when">{fmtOffset(st.offsetMinutes)}</span>
                  <span className="email-subj">{t.subjectPreview}</span>
                  <span className="email-pre">{t.preheader ? t.preheader : <i>No preview text</i>}</span>
                </span>
                <span className="email-open" aria-hidden>View ›</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="end">■ End of sequence{total ? ` · last email on ${fmtOffset(total).toLowerCase()}` : ""}</div>
    </section>
  );
}

function TagRules({ flow }: { flow: Flow }) {
  const rules = flow.rules.filter((r) => !r.actions.some((a) => a.type !== "add_tag"));
  return (
    <section className="flow" id="tag-rules">
      <header className="flow-head">
        <div>
          <h2>Tag-only rules</h2>
          <p className="flow-sub">These only add a tag. No email is sent and no campaign starts.</p>
        </div>
      </header>
      <div className="entries">
        {rules.map((rule) => <EntryCard key={rule.n} e={{ kind: "rule", rule }} flow={flow} />)}
      </div>
    </section>
  );
}

function EmailModal({ flow, id, onClose, onNav }: { flow: Flow; id: string; onClose: () => void; onNav: (id: string) => void }) {
  const t = flow.templates[id];
  const seq = flow.sequences.find((s) => s.steps.some((st) => st.template === id))!;
  const idx = seq.steps.findIndex((st) => st.template === id);
  const step = seq.steps[idx];
  const [view, setView] = useState<"rebuilt" | "original">("rebuilt");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [height, setHeight] = useState(900);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && idx < seq.steps.length - 1) onNav(seq.steps[idx + 1].template);
      if (e.key === "ArrowLeft" && idx > 0) onNav(seq.steps[idx - 1].template);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [idx, seq, onClose, onNav]);

  useEffect(() => { setHeight(900); }, [id, device]);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="modal-subject" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <div className="modal-crumb">{seq.name} · email {idx + 1} of {seq.steps.length}</div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close preview">✕</button>
        </div>
        <h3 id="modal-subject" className="modal-subject">{t.subjectPreview}</h3>
        <dl className="meta">
          <div><dt>Preview text</dt><dd>{t.preheader || <i>none</i>}</dd></div>
          <div><dt>From</dt><dd>{t.sender}</dd></div>
          <div><dt>When</dt><dd>{step.delayMinutes === 0 ? "Immediately" : fmtDuration(step.delayMinutes)} {idx === 0 ? "after entering" : "after previous email"} ({fmtOffset(step.offsetMinutes)})</dd></div>
          <div><dt>Template</dt><dd><code>emails/yonisync/templates/{t.id}.html</code></dd></div>
        </dl>
        <div className="toolbar">
          <div className="seg" role="tablist" aria-label="Version">
            <button type="button" role="tab" aria-selected={view === "rebuilt"} className={view === "rebuilt" ? "on" : ""} onClick={() => setView("rebuilt")}>Rebuilt email</button>
            <button type="button" role="tab" aria-selected={view === "original"} className={view === "original" ? "on" : ""} onClick={() => setView("original")} disabled={!t.original}>Original (systeme)</button>
          </div>
          {view === "rebuilt" ? (
            <div className="seg seg-device" aria-label="Width">
              <button type="button" className={device === "desktop" ? "on" : ""} onClick={() => setDevice("desktop")}>Desktop</button>
              <button type="button" className={device === "mobile" ? "on" : ""} onClick={() => setDevice("mobile")}>Mobile</button>
            </div>
          ) : null}
          <a className="open-tab" href={view === "rebuilt" ? t.preview : t.original ?? "#"} target="_blank" rel="noreferrer">Open in new tab ↗</a>
        </div>
        <div className="frame-wrap">
          {view === "rebuilt" ? (
            <iframe
              key={t.id + device}
              title={`Preview: ${t.subjectPreview}`}
              src={t.preview}
              className={`frame ${device}`}
              style={{ height }}
              onLoad={(e) => {
                const doc = (e.target as HTMLIFrameElement).contentDocument;
                if (doc) setHeight(Math.max(400, doc.documentElement.scrollHeight + 8));
              }}
            />
          ) : (
            <div className="orig">
              <p className="orig-note">Screenshot of the email body in the systeme.io editor (captured {flow.captured_at}). systeme adds its own footer when sending.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.original!} alt={`Original systeme.io email: ${t.subjectPreview}`} />
            </div>
          )}
        </div>
        <p className="sample-note">Preview uses sample values: first name “Jane”, placeholder postal address, inert unsubscribe link.</p>
        <div className="modal-nav">
          <button type="button" disabled={idx === 0} onClick={() => onNav(seq.steps[idx - 1].template)}>‹ Previous</button>
          <button type="button" disabled={idx === seq.steps.length - 1} onClick={() => onNav(seq.steps[idx + 1].template)}>Next ›</button>
        </div>
      </div>
    </div>
  );
}

export default function FlowChart({ flow }: { flow: Flow }) {
  const sequences = useMemo(() => ORDER.map((k) => flow.sequences.find((s) => s.key === k)).filter(Boolean) as Sequence[], [flow]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const fromHash = () => {
      const m = /email=([a-z0-9_-]+)/.exec(window.location.hash);
      setOpen(m && flow.templates[m[1]] ? m[1] : null);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [flow]);

  const openEmail = useCallback((id: string) => {
    history.replaceState(null, "", `#email=${id}`);
    setOpen(id);
  }, []);
  const close = useCallback(() => {
    history.replaceState(null, "", window.location.pathname);
    setOpen(null);
  }, []);

  const emailCount = Object.keys(flow.templates).length;
  const active = flow.rules.filter((r) => r.active).length;

  return (
    <main>
      <header className="hero">
        <div className="brand">YONISYNC</div>
        <h1>Email automations</h1>
        <p className="lede">
          Every automation Susana runs in systeme.io today, replicated for the new email engine. Tap an email to read it.
        </p>
        <div className="stats">
          <div><b>{sequences.length}</b><span>sequences</span></div>
          <div><b>{emailCount}</b><span>emails</span></div>
          <div><b>{flow.rules.length}</b><span>rules ({active} active)</span></div>
          <div><b>{flow.workflows.length}</b><span>workflow</span></div>
        </div>
        <div className="legend">
          <span className="chip chip-trig">⚡ Trigger</span>
          <span className="chip chip-tag">🏷️ Tag</span>
          <span className="chip chip-sub">➕ Campaign</span>
          <span className="delay-pill">⏱ Delay</span>
          <span className="badge badge-off">Inactive</span>
          <span className="badge badge-dup">Duplicate</span>
        </div>
        <p className="fine">{flow.delay_semantics}</p>
      </header>

      <nav className="toc" aria-label="Sequences">
        {sequences.map((s) => <a key={s.key} href={`#${s.key}`}>{s.name}</a>)}
        <a href="#tag-rules">Tag-only rules</a>
      </nav>

      {sequences.map((s) => <SequenceFlow key={s.key} seq={s} flow={flow} onOpen={openEmail} />)}
      <TagRules flow={flow} />

      <footer className="foot">
        Captured read-only from systeme.io on {flow.captured_at}. Source: <code>3SATVA/susana/emails</code>. Not indexed by search engines.
      </footer>

      {open ? <EmailModal flow={flow} id={open} onClose={close} onNav={openEmail} /> : null}
    </main>
  );
}
