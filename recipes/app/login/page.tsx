export const metadata = { title: "Sign in" };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="login">
      <form action="/api/login" method="post">
        <h1 style={{ fontSize: 24 }}>Peruvian Recipes</h1>
        <p className="lead">Private collection. Enter the shared password.</p>
        {sp.error ? <p className="err">That password didn’t match. Try again.</p> : null}
        <input type="hidden" name="next" value={sp.next ?? "/"} />
        <label htmlFor="pw" className="sr-only">Password</label>
        <input id="pw" name="password" type="password" autoComplete="current-password" placeholder="Password" required autoFocus />
        <button type="submit">Open recipes</button>
      </form>
    </main>
  );
}
