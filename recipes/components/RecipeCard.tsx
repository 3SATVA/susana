"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import StarIcon from "@/components/StarIcon";
import { toggleStar, haptic } from "@/lib/stars-client";

const LONG_PRESS_MS = 500;
const DBL_WAIT_MS = 260;
const MOVE_TOLERANCE = 10;

// After a long-press the list may re-order (starred-first) and re-mount the card under the finger,
// so swallow the click that follows the release at document level.
function swallowNextClick() {
  const block = (e: Event) => { e.preventDefault(); e.stopPropagation(); cleanup(); };
  const cleanup = () => { document.removeEventListener("click", block, true); clearTimeout(t); };
  document.addEventListener("click", block, true);
  const t = setTimeout(cleanup, 1200);
}

export default function RecipeCard({ id, es, en, meta, starred, flagged }: {
  id: string; es: string; en: string; meta: string; starred: boolean; flagged: boolean;
}) {
  const router = useRouter();
  const href = `/r/${id}`;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);
  const ptype = useRef<string>("");

  const clearPress = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; start.current = null; };
  const doToggle = () => { haptic(); void toggleStar(id); };

  return (
    <div className={`cardwrap${starred ? " starred" : ""}`}>
      <Link
        className="card"
        href={href}
        draggable={false}
        onPointerDown={(e) => {
          fired.current = false;
          ptype.current = e.pointerType;
          if (e.pointerType === "mouse") return;
          start.current = { x: e.clientX, y: e.clientY };
          timer.current = setTimeout(() => { fired.current = true; timer.current = null; swallowNextClick(); window.getSelection()?.removeAllRanges(); doToggle(); }, LONG_PRESS_MS);
        }}
        onPointerMove={(e) => {
          if (!start.current) return;
          if (Math.abs(e.clientX - start.current.x) > MOVE_TOLERANCE || Math.abs(e.clientY - start.current.y) > MOVE_TOLERANCE) clearPress();
        }}
        onPointerUp={clearPress}
        onPointerCancel={clearPress}
        onPointerLeave={clearPress}
        onContextMenu={(e) => { if (fired.current || timer.current) e.preventDefault(); }}
        onClick={(e) => {
          if (fired.current) { e.preventDefault(); fired.current = false; return; }
          // Mouse: wait briefly so a double-click can star instead of navigating.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          if (ptype.current !== "mouse" || e.detail === 0) return;
          e.preventDefault();
          if (e.detail >= 2) {
            if (navTimer.current) clearTimeout(navTimer.current);
            navTimer.current = null;
            return;
          }
          navTimer.current = setTimeout(() => { navTimer.current = null; router.push(href); }, DBL_WAIT_MS);
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          if (navTimer.current) { clearTimeout(navTimer.current); navTimer.current = null; }
          window.getSelection()?.removeAllRanges();
          doToggle();
        }}
      >
        <div className="es">{es}</div>
        <div className="en">{en}</div>
        <div className="meta">{meta}{flagged ? <span className="flag"> · check source</span> : null}</div>
      </Link>
      <button
        type="button"
        className={`star${starred ? " on" : ""}`}
        aria-pressed={starred}
        aria-label={starred ? `Unstar ${es}` : `Star ${es}`}
        onClick={doToggle}
      >
        <StarIcon filled={starred} />
      </button>
    </div>
  );
}
