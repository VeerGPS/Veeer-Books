import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container" style={{ padding: "6rem 1rem", textAlign: "center" }}>
      <h1 className="section-title" style={{ paddingTop: 0 }}>
        Page not found
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <Link href="/" className="btn btn-primary">
        Back to Home
      </Link>
    </main>
  );
}
