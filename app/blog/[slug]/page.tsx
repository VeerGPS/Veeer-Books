import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS, getPost, sortedPosts, type Block } from "@/lib/blog";
import { getBookBySlugFromDB } from "@/lib/books";
import { canOptimize } from "@/lib/image";
import { SITE_NAME, absUrl, jsonLd } from "@/lib/site";
import ShareBar from "@/app/product/[slug]/ShareBar";

export const revalidate = 3600;

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", url: `/blog/${post.slug}`, title: post.title, description: post.description, publishedTime: post.date },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

function render(b: Block, i: number) {
  if ("h2" in b) return <h2 key={i}>{b.h2}</h2>;
  if ("h3" in b) return <h3 key={i}>{b.h3}</h3>;
  if ("p" in b) return <p key={i}>{b.p}</p>;
  if ("ul" in b) return <ul key={i}>{b.ul.map((x, j) => <li key={j}>{x}</li>)}</ul>;
  if ("ol" in b) return <ol key={i}>{b.ol.map((x, j) => <li key={j}>{x}</li>)}</ol>;
  if ("tip" in b) return <aside key={i} className="post-tip"><b>Tip</b> {b.tip}</aside>;
  if ("quote" in b) return <blockquote key={i}>{b.quote}</blockquote>;
  return null;
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();
  const book = post.cta.kind === "book" ? await getBookBySlugFromDB(post.cta.slug) : undefined;
  const url = absUrl(`/blog/${post.slug}`);
  const more = sortedPosts().filter((p) => p.slug !== post.slug).slice(0, 3);

  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: SITE_NAME, url: absUrl("/") },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: absUrl("/images/logo.png") } },
  };

  const cta = (
    <div className="post-cta">
      {book ? (
        <>
          <Link href={`/product/${book.slug}`} className="post-cta-cover">
            <Image src={book.cover} alt={`${book.title} cover`} width={120} height={180} sizes="120px" unoptimized={!canOptimize(book.cover)} />
          </Link>
          <div>
            <p>{post.cta.text}</p>
            <div className="post-cta-actions">
              <Link href={`/product/${book.slug}`} className="btn btn-primary">See the book — ₹{book.price}</Link>
              <Link href={`/reader/${book.slug}?preview=1`} className="btn btn-outline">Read free preview</Link>
            </div>
          </div>
        </>
      ) : post.cta.kind === "link" ? (
        <div>
          <p>{post.cta.text}</p>
          <Link href={post.cta.href} className="btn btn-primary">{post.cta.label}</Link>
        </div>
      ) : null}
    </div>
  );

  return (
    <main className="blog">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <article className="container post">
        <div className="post-crumb"><Link href="/blog">Blog</Link> / <span>{post.category}</span></div>
        <h1>{post.title}</h1>
        <p className="post-lead">{post.description}</p>
        <div className="blog-meta">{new Date(post.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {post.minutes} min read</div>
        <div className="post-body">{post.body.map(render)}</div>
        {cta}
        <ShareBar url={url} title={post.title} />
      </article>

      <section className="container blog-wrap" style={{ paddingTop: 0 }}>
        <h2 className="blog-more-h">Keep reading</h2>
        <div className="blog-grid">
          {more.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="blog-card">
              <span className="blog-cat">{p.category}</span>
              <h3>{p.title}</h3>
              <span className="blog-meta">{p.minutes} min read</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
