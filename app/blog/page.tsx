import type { Metadata } from "next";
import Link from "next/link";
import { sortedPosts } from "@/lib/blog";
import GiftSignup from "@/components/GiftSignup";

export const metadata: Metadata = {
  title: "Blog — Reading, Habits, Study & Self-Publishing",
  description: "Practical articles on building habits, studying smarter, AI prompting, reading with kids and self-publishing your eBook in India.",
  alternates: { canonical: "/blog" },
};

const fmt = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default function BlogIndex() {
  const posts = sortedPosts();
  const [first, ...rest] = posts;
  return (
    <main className="blog">
      <section className="container blog-wrap">
        <header className="blog-head">
          <span className="blog-eyebrow">The Veeer Books blog</span>
          <h1>Ideas worth reading</h1>
          <p>Practical guides on habits, study, AI, reading with kids and publishing your own book.</p>
        </header>

        {first ? (
          <Link href={`/blog/${first.slug}`} className="blog-feature">
            <span className="blog-cat">{first.category}</span>
            <h2>{first.title}</h2>
            <p>{first.description}</p>
            <span className="blog-meta">{fmt(first.date)} · {first.minutes} min read</span>
          </Link>
        ) : null}

        <div className="blog-grid">
          {rest.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="blog-card">
              <span className="blog-cat">{p.category}</span>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <span className="blog-meta">{fmt(p.date)} · {p.minutes} min read</span>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: "3rem" }}>
          <GiftSignup variant="card" source="blog" />
        </div>
      </section>
    </main>
  );
}
