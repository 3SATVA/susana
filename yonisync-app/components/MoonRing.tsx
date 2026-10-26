import { CYCLE_LENGTH, PHASES, PHASE_ORDER, phaseFor } from "@/lib/cycle";

/** Lit-portion path of a moon at phase p (0 = new, 0.5 = full), radius r, centred at cx,cy. */
function moonPath(cx: number, cy: number, r: number, p: number) {
  const rx = Math.abs(Math.cos(2 * Math.PI * p)) * r;
  const top = `${cx} ${cy - r}`;
  const bottom = `${cx} ${cy + r}`;
  if (p < 0.5) {
    const sweep = p < 0.25 ? 0 : 1;
    return `M ${top} A ${r} ${r} 0 0 1 ${bottom} A ${rx} ${r} 0 0 ${sweep} ${top} Z`;
  }
  const sweep = p > 0.75 ? 1 : 0;
  return `M ${top} A ${r} ${r} 0 0 0 ${bottom} A ${rx} ${r} 0 0 ${sweep} ${top} Z`;
}

function Moon({ cx, cy, r, p, active }: { cx: number; cy: number; r: number; p: number; active?: boolean }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#B9A3BC" stroke={active ? "#684259" : "#E9DCE6"} strokeWidth={active ? 1.8 : 1} />
      {p > 0.02 && p < 0.98 && <path d={moonPath(cx, cy, r, p)} fill="#FFF3DF" />}
      {Math.abs(p - 0.5) < 0.04 && <circle cx={cx} cy={cy} r={r} fill="#FFF3DF" stroke={active ? "#684259" : "#E9DCE6"} strokeWidth={active ? 1.8 : 1} />}
    </g>
  );
}

export default function MoonRing({ day }: { day: number }) {
  const S = 300, C = S / 2, R = 112, W = 16;
  const ang = (d: number) => ((d - 1) / CYCLE_LENGTH) * 2 * Math.PI - Math.PI / 2;
  const pt = (a: number, rr: number) => [C + rr * Math.cos(a), C + rr * Math.sin(a)];
  const arc = (from: number, to: number) => {
    const a0 = ang(from) + 0.03, a1 = ang(to + 1) - 0.03;
    const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1}`;
  };
  const phase = phaseFor(day);
  const [mx, my] = pt(ang(day + 0.5), R);
  const moons = Array.from({ length: 8 }, (_, i) => i / 8);

  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="moonring" role="img" aria-label={`Cycle day ${day}, ${PHASES[phase].label} phase`}>
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity=".55" />
          <stop offset="70%" stopColor="#FFF6F2" stopOpacity=".5" />
          <stop offset="100%" stopColor="#F7E6EA" stopOpacity=".7" />
        </radialGradient>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#684259" floodOpacity=".25" />
        </filter>
      </defs>
      <circle cx={C} cy={C} r={R - W / 2 - 6} fill="url(#glow)" />
      <circle cx={C} cy={C} r={R} fill="none" stroke="#F3EBEE" strokeWidth={W} />
      {PHASE_ORDER.map((id) => (
        <path key={id} d={arc(PHASES[id].days[0], PHASES[id].days[1])} fill="none" stroke={PHASES[id].color}
          strokeWidth={W} strokeLinecap="round" opacity={id === phase ? 1 : 0.55} />
      ))}
      {Array.from({ length: CYCLE_LENGTH }, (_, i) => {
        const [x, y] = pt(ang(i + 1.5), R);
        return <circle key={i} cx={x} cy={y} r={i + 1 === day ? 0 : 1.3} fill="#fff" opacity=".9" />;
      })}
      {moons.map((p) => {
        const [x, y] = pt(-Math.PI / 2 + p * 2 * Math.PI, R + 25);
        const dayP = (day - 0.5) / CYCLE_LENGTH;
        const active = Math.abs(((dayP - p + 1.0625) % 1) - 0.0625) < 0.0625;
        return <Moon key={p} cx={x} cy={y} r={active ? 9.5 : 7.5} p={p} active={active} />;
      })}
      <circle cx={mx} cy={my} r={13} fill="#fff" filter="url(#soft)" />
      <circle cx={mx} cy={my} r={7.5} fill={PHASES[phase].ink} />
      <text x={C} y={C - 28} textAnchor="middle" className="mr-k">Cycle day</text>
      <text x={C} y={C + 18} textAnchor="middle" className="mr-day">{day}</text>
      <text x={C} y={C + 44} textAnchor="middle" className="mr-phase" fill={PHASES[phase].ink}>{PHASES[phase].label} phase</text>
      <text x={C} y={C + 62} textAnchor="middle" className="mr-moon">{PHASES[phase].moon}</text>
    </svg>
  );
}
