import { serial } from "@/lib/stars-db";

export type TagCategory = "phase" | "fertility_type" | "condition" | "other";
export const CATEGORIES: TagCategory[] = ["phase", "fertility_type", "condition", "other"];
export type Tag = { id: string; slug: string; name: string; color: string; category: TagCategory };
export type Assignment = { recipe_id: string; tag_id: string };
export type TagState = { tags: Tag[]; assignments: Assignment[] };

const ORDER = `case category when 'phase' then 0 when 'fertility_type' then 1 when 'condition' then 2 else 3 end`;

export async function loadState(): Promise<TagState> {
  return serial(async (sql) => {
  const tags = await sql<Tag[]>`
    select id::text, slug, name, color, category from public.tags
    order by ${sql.unsafe(ORDER)}, created_at, name`;
  const assignments = await sql<Assignment[]>`select recipe_id, tag_id::text from public.recipe_tags`;
  return { tags: [...tags], assignments: [...assignments] };
  });
}

function slugify(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 50) || "tag";
}

export class TagError extends Error {}

export async function createTag(name: string, color: string, category: TagCategory): Promise<string> {
  return serial(async (sql) => {
  const dup = await sql`select 1 from public.tags where lower(btrim(name)) = lower(${name})`;
  if (dup.length) throw new TagError("A tag with that name already exists");
  const base = slugify(name);
  const taken = new Set((await sql<{ slug: string }[]>`select slug from public.tags where slug like ${base + "%"}`).map((r) => r.slug));
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}_${i}`;
  const [row] = await sql<{ id: string }[]>`
    insert into public.tags (slug, name, color, category) values (${slug}, ${name}, ${color}, ${category}) returning id::text`;
  return row.id;
  });
}

export async function updateTag(id: string, name: string, color: string, category: TagCategory) {
  return serial(async (sql) => {
  const dup = await sql`select 1 from public.tags where lower(btrim(name)) = lower(${name}) and id <> ${id}::uuid`;
  if (dup.length) throw new TagError("A tag with that name already exists");
  // slug intentionally unchanged so the Yoni Sync app's references stay stable
  const r = await sql`update public.tags set name = ${name}, color = ${color}, category = ${category}, updated_at = now() where id = ${id}::uuid`;
  if (!r.count) throw new TagError("Tag not found");
  });
}

export async function deleteTag(id: string) {
  return serial(async (sql) => {
  await sql`delete from public.tags where id = ${id}::uuid`; // recipe_tags cascade
  });
}

export async function setAssignment(recipeId: string, tagId: string, on: boolean) {
  return serial(async (sql) => {
  if (on) {
    await sql`insert into public.recipe_tags (recipe_id, tag_id) values (${recipeId}, ${tagId}::uuid) on conflict do nothing`;
  } else {
    await sql`delete from public.recipe_tags where recipe_id = ${recipeId} and tag_id = ${tagId}::uuid`;
  }
  });
}
