import type { SVGProps } from "react";

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...p,
});

export const IconProfile = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></svg>
);
export const IconCalendar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3.5" y="5" width="17" height="15.5" rx="3.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /><circle cx="8.5" cy="14.5" r=".6" fill="currentColor" /><circle cx="12" cy="14.5" r=".6" fill="currentColor" /><circle cx="15.5" cy="14.5" r=".6" fill="currentColor" /></svg>
);
export const IconPlay = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="4.5" width="18" height="15" rx="4" /><path d="M10.2 9.2v5.6l4.6-2.8-4.6-2.8Z" fill="currentColor" stroke="none" /></svg>
);
export const IconBowl = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0Z" /><path d="M9 8c0-1.5 1.5-1.5 1.5-3M13.5 8c0-1.5 1.5-1.5 1.5-3" /><path d="M8 20.5h8" /></svg>
);
export const IconCall = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 4.5h3l1.5 4-2 1.3a11 11 0 0 0 6.7 6.7l1.3-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 6.5a2 2 0 0 1 2-2Z" /></svg>
);
export const IconLock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="5" y="10.5" width="14" height="10" rx="3" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
);
export const IconHeart = ({ filled, ...p }: SVGProps<SVGSVGElement> & { filled?: boolean }) => (
  <svg {...base(p)}><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" fill={filled ? "currentColor" : "none"} /></svg>
);
export const IconChevron = ({ dir = "right", ...p }: SVGProps<SVGSVGElement> & { dir?: "left" | "right" }) => (
  <svg {...base(p)}><path d={dir === "left" ? "M14.5 6l-6 6 6 6" : "M9.5 6l6 6-6 6"} /></svg>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconSunrise = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 17a7 7 0 0 1 14 0M3 20h18M12 3v3M4.9 8.9l1.6 1.6M19.1 8.9l-1.6 1.6" /></svg>
);
export const IconSun = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></svg>
);
export const IconMoon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M19 14.5A7.5 7.5 0 1 1 9.5 5 6 6 0 0 0 19 14.5Z" /><path d="M17 4.5v2M16 5.5h2" /></svg>
);
export const IconDrop = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3.5s6 6.3 6 10.5a6 6 0 0 1-12 0c0-4.2 6-10.5 6-10.5Z" /></svg>
);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
