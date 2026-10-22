import postgres from "postgres";

// RECIPES_DB_URL: one or more pooler connection strings (whitespace-separated) for the
// least-privilege role `recipes_app`, which can only read/write public.recipe_stars.
type Sql = ReturnType<typeof postgres>;
let cached: Sql | null = null;

async function client(): Promise<Sql> {
  if (cached) return cached;
  const urls = (process.env.RECIPES_DB_URL ?? "").split(/\s+/).filter(Boolean);
  if (!urls.length) throw new Error("RECIPES_DB_URL not configured");
  let last: unknown;
  for (const url of urls) {
    const sql = postgres(url, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 6, ssl: "require" });
    try {
      await sql`select 1`;
      cached = sql;
      return sql;
    } catch (e) {
      last = e;
      await sql.end({ timeout: 1 }).catch(() => {});
    }
  }
  throw last instanceof Error ? last : new Error("database unreachable");
}

export async function listStars(): Promise<{ id: string; at: string }[]> {
  const sql = await client();
  const rows = await sql<{ recipe_id: string; starred_at: Date }[]>`
    select recipe_id, starred_at from public.recipe_stars order by starred_at desc`;
  return rows.map((r) => ({ id: r.recipe_id, at: r.starred_at.toISOString() }));
}

export async function setStar(id: string, starred: boolean) {
  const sql = await client();
  if (starred) {
    await sql`insert into public.recipe_stars (recipe_id) values (${id}) on conflict (recipe_id) do nothing`;
  } else {
    await sql`delete from public.recipe_stars where recipe_id = ${id}`;
  }
}
