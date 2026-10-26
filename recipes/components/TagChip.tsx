"use client";
import { inkFor, type Tag } from "@/lib/tags-client";

export default function TagChip({ tag, onRemove, onClick, active, small }: {
  tag: Tag; onRemove?: () => void; onClick?: () => void; active?: boolean; small?: boolean;
}) {
  const style = { background: tag.color, color: inkFor(tag.color) };
  const cls = `tchip${small ? " sm" : ""}${active ? " active" : ""}${onClick ? " clickable" : ""}`;
  return (
    <span className={cls} style={style} data-tag={tag.slug}>
      {onClick
        ? <button type="button" className="tchip-main" aria-pressed={active} onClick={onClick}>{tag.name}</button>
        : <span className="tchip-main">{tag.name}</span>}
      {onRemove && (
        <button type="button" className="tchip-x" aria-label={`Remove tag ${tag.name}`} title={`Remove ${tag.name}`} onClick={onRemove}>×</button>
      )}
    </span>
  );
}
