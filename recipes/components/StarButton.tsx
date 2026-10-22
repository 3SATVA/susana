"use client";
import StarIcon from "@/components/StarIcon";
import { useStars, toggleStar, haptic } from "@/lib/stars-client";

export default function StarButton({ id, title }: { id: string; title: string }) {
  const { stars, status } = useStars();
  const on = stars.has(id);
  return (
    <button
      type="button"
      className={`starbtn${on ? " on" : ""}`}
      aria-pressed={on}
      aria-label={on ? `Unstar ${title}` : `Star ${title}`}
      onClick={() => { haptic(); void toggleStar(id); }}
      title={status === "offline" ? "Saved on this device; will sync when the connection is back" : undefined}
    >
      <StarIcon filled={on} /> {on ? "Starred" : "Star"}
    </button>
  );
}
