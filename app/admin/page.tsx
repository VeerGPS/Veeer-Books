"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_PASSWORD = "VSB95@veeerbooks.in";

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponPercent, setCouponPercent] = useState("10");
  const [couponActive, setCouponActive] = useState(true);
  const [couponMessage, setCouponMessage] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [readerFile, setReaderFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    author: "",
    slug: "",
    actualPrice: "",
    sellingPrice: "",
    description: "",
    htmlContent: "",
    genre: "",
    pages: "",
    cover: "/images/default-book.png",
    reader: "/readers/default-reader.html",
    pdf: "/books/default-book.pdf",
  });

  const unlock = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthorized(true);
      setError("");
    } else {
      setError("Incorrect admin password.");
    }
  };

  useEffect(() => {
    setCouponCode((prev) => prev || "WELCOME10");
  }, []);

  const submitBook = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const uploadData = new FormData();
      uploadData.append("title", form.title);
      uploadData.append("author", form.author);
      uploadData.append("slug", form.slug);
      uploadData.append("actualPrice", String(Number(form.actualPrice || 0)));
      uploadData.append("sellingPrice", String(Number(form.sellingPrice || 0)));
      uploadData.append("description", form.description);
      uploadData.append("htmlContent", form.htmlContent);
      uploadData.append("genre", form.genre);
      uploadData.append("pages", String(Number(form.pages || 0)));
      uploadData.append("color", "#2c3e50");
      uploadData.append("accent", "#1a252f");
      uploadData.append("highlights", JSON.stringify([]));
      if (coverFile) uploadData.append("coverFile", coverFile);
      if (pdfFile) uploadData.append("pdfFile", pdfFile);
      if (readerFile) uploadData.append("readerFile", readerFile);

      const res = await fetch("/api/admin/books", {
        method: "POST",
        headers: {
          "x-admin-password": ADMIN_PASSWORD,
        },
        body: uploadData,
      });

      const text = await res.text();
      let data: { error?: string } | null = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.error || text || "Failed to save book");
      }
      alert("Book added successfully and is now live on the website.");
      setForm({
        title: "",
        author: "",
        slug: "",
        actualPrice: "",
        sellingPrice: "",
        description: "",
        htmlContent: "",
        genre: "",
        pages: "",
        cover: "/images/default-book.png",
        reader: "/readers/default-reader.html",
        pdf: "/books/default-book.pdf",
      });
      setCoverFile(null);
      setPdfFile(null);
      setReaderFile(null);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save book");
    } finally {
      setSubmitting(false);
    }
  };

  const createCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    setCouponMessage("");

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          code: couponCode,
          discountPercent: Number(couponPercent || 0),
          active: couponActive,
        }),
      });

      const text = await res.text();
      let data: { error?: string; coupon?: { code?: string } } | null = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.error || text || "Failed to save coupon");
      }
      setCouponMessage(`Coupon ${data?.coupon?.code || couponCode} created successfully.`);
      setCouponCode("");
      setCouponPercent("10");
      setCouponActive(true);
    } catch (err) {
      setCouponMessage(err instanceof Error ? err.message : "Failed to save coupon");
    }
  };

  if (!authorized) {
    return (
      <main className="container" style={{ padding: "6rem 1rem 4rem" }}>
        <div className="policy-card" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h1 className="section-title" style={{ paddingTop: 0, marginBottom: "1rem" }}>Admin Access</h1>
          <p className="muted" style={{ marginBottom: "1.25rem" }}>Enter the admin password to continue.</p>
          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          {error ? <p style={{ color: "crimson", marginBottom: "1rem" }}>{error}</p> : null}
          <button className="btn btn-primary btn-full" onClick={unlock}>Enter Admin Panel</button>
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: "6rem 1rem 4rem" }}>
      <div className="policy-card" style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 className="section-title" style={{ paddingTop: 0, marginBottom: "1rem" }}>Admin Dashboard</h1>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>Upload a new book and make it live on the website instantly.</p>

        <form onSubmit={submitBook}>
          <div className="form-group">
            <label htmlFor="title">Book Title</label>
            <input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="author">Author</label>
            <input id="author" required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="slug">Slug</label>
            <input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} />
          </div>
          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="actualPrice">Actual Price</label>
              <input id="actualPrice" type="number" min="0" required value={form.actualPrice} onChange={(e) => setForm({ ...form, actualPrice: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="sellingPrice">Selling Price</label>
              <input id="sellingPrice" type="number" min="0" required value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="genre">Genre</label>
            <input id="genre" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="pages">Pages</label>
            <input id="pages" type="number" min="0" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" rows={4} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }} />
          </div>
          <div className="form-group">
            <label htmlFor="htmlContent">Book HTML Content</label>
            <textarea id="htmlContent" rows={10} required value={form.htmlContent} onChange={(e) => setForm({ ...form, htmlContent: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }} placeholder="Paste the HTML content for the book here" />
          </div>
          <div className="form-group">
            <label htmlFor="coverFile">Upload Cover Image</label>
            <input id="coverFile" type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
          </div>
          <div className="form-group">
            <label htmlFor="readerFile">Upload Reader HTML</label>
            <input id="readerFile" type="file" accept=".html,text/html" onChange={(e) => setReaderFile(e.target.files?.[0] || null)} />
          </div>
          <div className="form-group">
            <label htmlFor="pdfFile">Upload PDF</label>
            <input id="pdfFile" type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
          </div>
          {error ? <p style={{ color: "crimson", marginBottom: "1rem" }}>{error}</p> : null}
          <button className="btn btn-primary btn-full" disabled={submitting}>{submitting ? "Saving book..." : "Publish Book"}</button>
        </form>

        <hr style={{ margin: "2rem 0", borderColor: "var(--border)" }} />

        <form onSubmit={createCoupon}>
          <h3 className="section-title" style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>Create Coupon</h3>
          <div className="form-group">
            <label htmlFor="couponCode">Coupon Code</label>
            <input id="couponCode" required value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
          </div>
          <div className="form-group">
            <label htmlFor="couponPercent">Discount Percent</label>
            <input id="couponPercent" type="number" min="0" max="100" required value={couponPercent} onChange={(e) => setCouponPercent(e.target.value)} />
          </div>
          <div className="form-row-checkbox">
            <input id="couponActive" type="checkbox" checked={couponActive} onChange={(e) => setCouponActive(e.target.checked)} />
            <label htmlFor="couponActive">Active</label>
          </div>
          {couponMessage ? <p style={{ color: couponMessage.includes("success") ? "green" : "crimson", marginBottom: "1rem" }}>{couponMessage}</p> : null}
          <button className="btn btn-outline btn-full" type="submit">Save Coupon</button>
        </form>
      </div>
    </main>
  );
}
