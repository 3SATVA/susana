"use client";
import { useState } from "react";
import TagChip from "@/components/TagChip";
import TagPicker from "@/components/TagPicker";
import { setRecipeTag, useTags } from "@/lib/tags-client";

export default function RecipeTags({ recipeId, small, onTagClick, activeTags }: {
  recipeId: string; small?: boolean; onTagClick?: (slug: string) => void; activeTags?: Set<string>;
}) {
  const { tags, byRecipe } = useTags();
  const [open, setOpen] = useState(false);
  const mine = byRecipe.get(recipeId);
  const list = tags.filter((t) => mine?.has(t.id));
  return (
    <div className={`rtags${small ? " sm" : ""}`}>
      {list.map((t) => (
        <TagChip key={t.id} tag={t} small={small} active={activeTags?.has(t.slug)}
          onClick={onTagClick ? () => onTagClick(t.slug) : undefined}
          onRemove={() => void setRecipeTag(recipeId, t.id, false).catch(() => {})} />
      ))}
      <span className="rtags-add-wrap">
        <button type="button" className="rtags-add" aria-expanded={open} aria-label="Add tags" onClick={() => setOpen((v) => !v)}>
          + {list.length ? "Tag" : "Add tag"}
        </button>
        {open && <TagPicker recipeId={recipeId} onClose={() => setOpen(false)} />}
      </span>
    </div>
  );
}
