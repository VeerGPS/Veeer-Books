"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Book } from "@/lib/books";
import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";

export default function LibraryPage() {
  const { isLoggedIn, purchasedBooks } = useAuth();
  const { show } = useModal();
  const [catalog, setCatalog] = useState<Book[]>([]);

  useEffect(() => {
    fetch("/api/books")
      .then((res) => res.json())
      .then((data) => setCatalog(data.books || []))
      .catch(() => setCatalog([]));
  }, []);

  if (!isLoggedIn) {
    return (
      <main className="container" style={{ padding: "6rem 1rem" }}>
        <h1 className="section-title" style={{ paddingTop: 0, marginBottom: "1.5rem" }}>
          My Digital Library
        </h1>
        <div className="library-empty">
          <p>Please sign in to view your library.</p>
          <button className="btn btn-primary" onClick={() => show("login")}>
            Sign In
          </button>
        </div>
      </main>
    );
  }

  const myBooks = catalog.filter((b) => purchasedBooks.includes(b.id));

  return (
    <main className="container" style={{ padding: "6rem 1rem 4rem" }}>
      <h1 className="section-title" style={{ paddingTop: 0, marginBottom: "2rem" }}>
        My Digital Library
      </h1>

      {myBooks.length === 0 ? (
        <div className="library-empty">
          <p>Your library is currently empty.</p>
          <Link href="/" className="btn btn-primary">
            Browse Books
          </Link>
        </div>
      ) : (
        <div className="book-grid">
          {myBooks.map((b) => (
            <article className="book-card" key={b.id}>
              <div
                className="book-cover-wrap"
                style={{ background: b.color }}
              >
                <Image
                  src={b.cover}
                  alt={b.title}
                  width={300}
                  height={450}
                  className="book-cover-img"
                />
              </div>
              <div className="book-info">
                <h3>{b.title}</h3>
                <p className="book-author">{b.author}</p>
                <a
                  href={b.reader}
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: "0.75rem", width: "100%" }}
                >
                  Read Now
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
