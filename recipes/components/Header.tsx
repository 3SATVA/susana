import Link from "next/link";

export default function Header() {
  return (
    <header className="top">
      <Link href="/" className="brand">
        <small>YoniSync · private</small>Peruvian Recipes
      </Link>
      <nav className="nav">
        <Link href="/">All recipes</Link>
        <Link href="/glossary">Glossary</Link>
        <Link href="/source">Source</Link>
        <form action="/api/logout" method="post">
          <button className="linkbtn" type="submit">Sign out</button>
        </form>
      </nav>
    </header>
  );
}
