"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const ADMIN_PASSWORD = "VSB95@veeerbooks.in";

type AdminBook = {
  _id: string;
  id: number;
  slug: string;
  title: string;
  author: string;
  actualPrice: number;
  sellingPrice: number;
  price: number;
  color: string;
  accent: string;
  genre: string;
  pages: number;
  cover: string;
  reader: string;
  pdf: string;
  description: string;
  htmlContent: string;
  isActive: boolean;
};

type AdminCoupon = {
  _id: string;
  code: string;
  discountPercent: number;
  active: boolean;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Books state
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [bookMessage, setBookMessage] = useState("");
  const [deletingBookId, setDeletingBookId] = useState("");
  const [editingBook, setEditingBook] = useState<AdminBook | null>(null);

  // Add Book Form state
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [readerFile, setReaderFile] = useState<File | null>(null);
  
  // Edit Book File state
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null);
  const [editReaderFile, setEditReaderFile] = useState<File | null>(null);

  const MAX_UPLOAD_SIZE = 40 * 1024 * 1024; // 40MB

  const [form, setForm] = useState({
    title: "",
    author: "",
    slug: "",
    actualPrice: "199",
    sellingPrice: "149",
    description: "",
    htmlContent: "",
    genre: "General",
    pages: "100",
    cover: "/images/default-book.svg",
    reader: "/readers/default-reader.html",
    pdf: "/books/default-book.pdf",
  });

  // Coupons state
  const [couponCode, setCouponCode] = useState("");
  const [couponPercent, setCouponPercent] = useState("10");
  const [couponActive, setCouponActive] = useState(true);
  const [couponMessage, setCouponMessage] = useState("");
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState("");

  const unlock = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthorized(true);
      setError("");
      void loadBooks();
      void loadCoupons();
    } else {
      setError("Incorrect admin password.");
    }
  };

  useEffect(() => {
    setCouponCode((prev) => prev || "WELCOME10");
  }, []);

  const loadBooks = async () => {
    setBooksLoading(true);
    setBookMessage("");
    try {
      const res = await fetch("/api/admin/books", {
        headers: { "x-admin-password": ADMIN_PASSWORD },
      });
      const data: { error?: string; books?: AdminBook[] } = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load books");
      setBooks(data.books || []);
    } catch (err) {
      setBookMessage(err instanceof Error ? err.message : "Failed to load books");
    } finally {
      setBooksLoading(false);
    }
  };

  const loadCoupons = async () => {
    setCouponsLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        headers: { "x-admin-password": ADMIN_PASSWORD },
      });
      const data: { error?: string; coupons?: AdminCoupon[] } = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load coupons");
      setCoupons(data.coupons || []);
    } catch (err) {
      setCouponMessage(err instanceof Error ? err.message : "Failed to load coupons");
    } finally {
      setCouponsLoading(false);
    }
  };

  const submitBook = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (
        (coverFile?.size ?? 0) > MAX_UPLOAD_SIZE ||
        (pdfFile?.size ?? 0) > MAX_UPLOAD_SIZE ||
        (readerFile?.size ?? 0) > MAX_UPLOAD_SIZE
      ) {
        throw new Error("One of the uploaded files is too large. Please use files smaller than 40MB.");
      }

      const sellingVal = Number(form.sellingPrice || 0);
      const actualVal = Number(form.actualPrice || 0);
      if (sellingVal <= 0 && actualVal <= 0) {
        throw new Error("Please enter a valid price greater than ₹0.");
      }

      const uploadData = new FormData();
      uploadData.append("title", form.title);
      uploadData.append("author", form.author);
      uploadData.append("slug", form.slug);
      uploadData.append("actualPrice", String(actualVal || sellingVal));
      uploadData.append("sellingPrice", String(sellingVal || actualVal));
      uploadData.append("description", form.description);
      if (form.htmlContent) uploadData.append("htmlContent", form.htmlContent);
      uploadData.append("genre", form.genre);
      uploadData.append("pages", String(Number(form.pages || 0)));
      uploadData.append("color", "#2c3e50");
      uploadData.append("accent", "#1a252f");
      if (coverFile) uploadData.append("coverFile", coverFile);
      if (pdfFile) uploadData.append("pdfFile", pdfFile);
      if (readerFile) uploadData.append("readerFile", readerFile);

      const res = await fetch("/api/admin/books", {
        method: "POST",
        headers: { "x-admin-password": ADMIN_PASSWORD },
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
      alert("✅ Book added successfully!");
      setForm({
        title: "",
        author: "",
        slug: "",
        actualPrice: "199",
        sellingPrice: "149",
        description: "",
        htmlContent: "",
        genre: "General",
        pages: "100",
        cover: "/images/default-book.svg",
        reader: "/readers/default-reader.html",
        pdf: "/books/default-book.pdf",
      });
      setCoverFile(null);
      setPdfFile(null);
      setReaderFile(null);
      await loadBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save book");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBook = (book: AdminBook) => {
    setEditingBook({ ...book });
    setEditCoverFile(null);
    setEditPdfFile(null);
    setEditReaderFile(null);
  };

  const saveEditBook = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingBook) return;

    setSubmitting(true);
    setError("");

    try {
      const uploadData = new FormData();
      uploadData.append("id", editingBook._id);
      uploadData.append("title", editingBook.title);
      uploadData.append("author", editingBook.author);
      uploadData.append("slug", editingBook.slug);
      uploadData.append("actualPrice", String(editingBook.actualPrice || editingBook.sellingPrice || editingBook.price));
      uploadData.append("sellingPrice", String(editingBook.sellingPrice || editingBook.price));
      uploadData.append("description", editingBook.description);
      if (editingBook.htmlContent) uploadData.append("htmlContent", editingBook.htmlContent);
      uploadData.append("genre", editingBook.genre || "General");
      uploadData.append("pages", String(editingBook.pages || 0));
      uploadData.append("isActive", String(editingBook.isActive));
      uploadData.append("cover", editingBook.cover || "/images/default-book.svg");
      uploadData.append("reader", editingBook.reader || "/readers/default-reader.html");
      uploadData.append("pdf", editingBook.pdf || "/books/default-book.pdf");

      if (editCoverFile) uploadData.append("coverFile", editCoverFile);
      if (editPdfFile) uploadData.append("pdfFile", editPdfFile);
      if (editReaderFile) uploadData.append("readerFile", editReaderFile);

      const res = await fetch("/api/admin/books", {
        method: "PUT",
        headers: { "x-admin-password": ADMIN_PASSWORD },
        body: uploadData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update book");

      alert("✅ Book updated successfully!");
      setEditingBook(null);
      await loadBooks();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update book");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBook = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

    setDeletingBookId(id);
    try {
      const res = await fetch(`/api/admin/books?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-password": ADMIN_PASSWORD },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete book");
      setBooks((prev) => prev.filter((b) => b._id !== id));
      alert(`✅ Book "${title}" deleted.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete book");
    } finally {
      setDeletingBookId("");
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save coupon");

      setCouponMessage(`Coupon ${data?.coupon?.code || couponCode} created successfully.`);
      setCouponCode("");
      setCouponPercent("10");
      setCouponActive(true);
      await loadCoupons();
    } catch (err) {
      setCouponMessage(err instanceof Error ? err.message : "Failed to save coupon");
    }
  };

  const deleteCoupon = async (code: string) => {
    if (!window.confirm(`Delete coupon ${code}? This cannot be undone.`)) return;

    setDeletingCoupon(code);
    setCouponMessage("");
    try {
      const res = await fetch(`/api/admin/coupons?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
        headers: { "x-admin-password": ADMIN_PASSWORD },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete coupon");
      setCoupons((current) => current.filter((coupon) => coupon.code !== code));
      setCouponMessage(`Coupon ${code} deleted successfully.`);
    } catch (err) {
      setCouponMessage(err instanceof Error ? err.message : "Failed to delete coupon");
    } finally {
      setDeletingCoupon("");
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
      <div className="policy-card" style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h1 className="section-title" style={{ paddingTop: 0, marginBottom: "0.5rem" }}>Admin Dashboard</h1>
        <p className="muted" style={{ marginBottom: "2rem" }}>Manage book catalogue, pricing, uploaded files, and coupons.</p>

        {/* ─── Metrics Bar ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
          <div style={{ padding: "1.5rem", borderRadius: "10px", background: "var(--card-bg, #1e293b)", border: "1px solid var(--border)", textAlign: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Total Books</span>
            <div style={{ fontSize: "2.25rem", fontWeight: "700", color: "#c5a059", marginTop: "0.25rem" }}>{books.length}</div>
          </div>
          <div style={{ padding: "1.5rem", borderRadius: "10px", background: "var(--card-bg, #1e293b)", border: "1px solid var(--border)", textAlign: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Active Coupons</span>
            <div style={{ fontSize: "2.25rem", fontWeight: "700", color: "#4ade80", marginTop: "0.25rem" }}>{coupons.filter(c => c.active).length}</div>
          </div>
        </div>

        {/* ─── Book Catalogue Table / List ─── */}
        <div style={{ marginBottom: "3rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 className="section-title" style={{ fontSize: "1.4rem", margin: 0 }}>Book Catalogue ({books.length})</h2>
            <button className="btn btn-outline btn-sm" onClick={loadBooks} disabled={booksLoading}>
              {booksLoading ? "Refreshing..." : "🔄 Refresh"}
            </button>
          </div>

          {bookMessage ? <p style={{ color: "crimson", marginBottom: "1rem" }}>{bookMessage}</p> : null}
          {booksLoading && books.length === 0 ? <p className="muted">Loading book catalogue...</p> : null}

          {books.length === 0 && !booksLoading ? (
            <p className="muted" style={{ padding: "2rem", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "8px" }}>
              No books added yet. Use the form below to publish your first book.
            </p>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {books.map((b) => (
              <div
                key={b._id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr auto",
                  gap: "1.25rem",
                  alignItems: "center",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--card-bg, rgba(255,255,255,0.03))",
                }}
              >
                <div style={{ width: 70, height: 95, position: "relative", borderRadius: "4px", overflow: "hidden", background: b.color || "#1e293b" }}>
                  <Image
                    src={b.cover || "/images/default-book.svg"}
                    alt={b.title}
                    fill
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                </div>

                <div>
                  <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.25rem 0", fontWeight: 600 }}>{b.title}</h3>
                  <p className="muted" style={{ margin: "0 0 0.4rem 0", fontSize: "0.9rem" }}>By {b.author} • {b.genre} • {b.pages} pages</p>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", fontSize: "0.9rem" }}>
                    <span style={{ color: "#c5a059", fontWeight: 600 }}>₹{b.sellingPrice || b.price}</span>
                    {b.actualPrice > (b.sellingPrice || b.price) ? (
                      <span className="muted" style={{ textDecoration: "line-through" }}>₹{b.actualPrice}</span>
                    ) : null}
                    <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", background: b.isActive ? "#166534" : "#991b1b", color: "#fff" }}>
                      {b.isActive ? "Live" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-outline btn-sm" type="button" onClick={() => handleEditBook(b)}>
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    type="button"
                    style={{ borderColor: "crimson", color: "crimson" }}
                    onClick={() => deleteBook(b._id, b.title)}
                    disabled={deletingBookId === b._id}
                  >
                    {deletingBookId === b._id ? "Deleting..." : "🗑️ Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Edit Book Modal / Form Section ─── */}
        {editingBook ? (
          <div style={{ padding: "1.5rem", borderRadius: "8px", border: "2px solid #c5a059", background: "var(--card-bg, #0f172a)", marginBottom: "3rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 className="section-title" style={{ fontSize: "1.3rem", margin: 0, color: "#c5a059" }}>Edit Book: {editingBook.title}</h2>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => setEditingBook(null)}>
                ✖ Cancel Edit
              </button>
            </div>

            <form onSubmit={saveEditBook}>
              <div className="form-group">
                <label htmlFor="edit-title">Book Title</label>
                <input id="edit-title" required value={editingBook.title} onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-author">Author</label>
                <input id="edit-author" required value={editingBook.author} onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-slug">Slug</label>
                <input id="edit-slug" value={editingBook.slug} onChange={(e) => setEditingBook({ ...editingBook, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} />
              </div>
              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label htmlFor="edit-actualPrice">Actual Price (INR)</label>
                  <input id="edit-actualPrice" type="number" min="1" required value={editingBook.actualPrice} onChange={(e) => setEditingBook({ ...editingBook, actualPrice: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-sellingPrice">Selling Price (INR)</label>
                  <input id="edit-sellingPrice" type="number" min="1" required value={editingBook.sellingPrice || editingBook.price} onChange={(e) => setEditingBook({ ...editingBook, sellingPrice: Number(e.target.value), price: Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="edit-genre">Genre</label>
                <input id="edit-genre" value={editingBook.genre} onChange={(e) => setEditingBook({ ...editingBook, genre: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-pages">Pages</label>
                <input id="edit-pages" type="number" min="0" value={editingBook.pages} onChange={(e) => setEditingBook({ ...editingBook, pages: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-description">Description</label>
                <textarea id="edit-description" rows={4} required value={editingBook.description} onChange={(e) => setEditingBook({ ...editingBook, description: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-htmlContent">Book HTML Content</label>
                <textarea id="edit-htmlContent" rows={8} value={editingBook.htmlContent} onChange={(e) => setEditingBook({ ...editingBook, htmlContent: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-coverFile">Replace Cover Image (Optional)</label>
                <input id="edit-coverFile" type="file" accept="image/*" onChange={(e) => setEditCoverFile(e.target.files?.[0] || null)} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-readerFile">Replace Reader HTML (Optional)</label>
                <input id="edit-readerFile" type="file" accept=".html,text/html" onChange={(e) => setEditReaderFile(e.target.files?.[0] || null)} />
              </div>
              <div className="form-group">
                <label htmlFor="edit-pdfFile">Replace PDF (Optional)</label>
                <input id="edit-pdfFile" type="file" accept="application/pdf" onChange={(e) => setEditPdfFile(e.target.files?.[0] || null)} />
              </div>
              <div className="form-row-checkbox" style={{ marginBottom: "1rem" }}>
                <input id="edit-isActive" type="checkbox" checked={editingBook.isActive} onChange={(e) => setEditingBook({ ...editingBook, isActive: e.target.checked })} />
                <label htmlFor="edit-isActive">Is Live on Store</label>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>{submitting ? "Updating..." : "Save Changes"}</button>
                <button className="btn btn-outline" type="button" onClick={() => setEditingBook(null)}>Cancel</button>
              </div>
            </form>
          </div>
        ) : null}

        {/* ─── Add New Book Form Section ─── */}
        <hr style={{ margin: "2.5rem 0", borderColor: "var(--border)" }} />
        <h2 className="section-title" style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>➕ Add New Book</h2>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>Upload a new book and make it live on the website instantly.</p>

        <form onSubmit={submitBook}>
          <div className="form-group">
            <label htmlFor="title">Book Title *</label>
            <input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. The Art & Science of Prompting" />
          </div>
          <div className="form-group">
            <label htmlFor="author">Author *</label>
            <input id="author" required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="e.g. Veer Sukhadiya" />
          </div>
          <div className="form-group">
            <label htmlFor="slug">Slug (URL string)</label>
            <input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} placeholder="auto-generated if left empty" />
          </div>
          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="actualPrice">Actual Price (INR) *</label>
              <input id="actualPrice" type="number" min="1" required value={form.actualPrice} onChange={(e) => setForm({ ...form, actualPrice: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="sellingPrice">Selling Price (INR) *</label>
              <input id="sellingPrice" type="number" min="1" required value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="genre">Genre</label>
            <input id="genre" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="e.g. AI / Technology" />
          </div>
          <div className="form-group">
            <label htmlFor="pages">Pages</label>
            <input id="pages" type="number" min="1" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea id="description" rows={4} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }} placeholder="Detailed book description..." />
          </div>
          <div className="form-group">
            <label htmlFor="htmlContent">Book HTML Content *</label>
            <textarea id="htmlContent" rows={8} required value={form.htmlContent} onChange={(e) => setForm({ ...form, htmlContent: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }} placeholder="Paste the HTML content for the book reader here..." />
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
          <button className="btn btn-primary btn-full" disabled={submitting}>{submitting ? "Publishing Book..." : "🚀 Publish Book"}</button>
        </form>

        {/* ─── Coupon Management Section ─── */}
        <hr style={{ margin: "2.5rem 0", borderColor: "var(--border)" }} />
        <form onSubmit={createCoupon}>
          <h2 className="section-title" style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>Create Coupon</h2>
          <div className="form-group">
            <label htmlFor="couponCode">Coupon Code</label>
            <input id="couponCode" required value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="e.g. SPECIAL50" />
          </div>
          <div className="form-group">
            <label htmlFor="couponPercent">Discount Percent</label>
            <input id="couponPercent" type="number" min="1" max="100" required value={couponPercent} onChange={(e) => setCouponPercent(e.target.value)} />
          </div>
          <div className="form-row-checkbox">
            <input id="couponActive" type="checkbox" checked={couponActive} onChange={(e) => setCouponActive(e.target.checked)} />
            <label htmlFor="couponActive">Active</label>
          </div>
          {couponMessage ? <p style={{ color: couponMessage.includes("success") ? "green" : "crimson", marginBottom: "1rem" }}>{couponMessage}</p> : null}
          <button className="btn btn-outline btn-full" type="submit">Save Coupon</button>
        </form>

        <div style={{ marginTop: "2rem" }}>
          <h3 className="section-title" style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>Coupon Codes</h3>
          <p className="muted" style={{ marginBottom: "1rem" }}>Active codes provide discount percentages to users at checkout.</p>
          {couponsLoading ? <p className="muted">Loading coupons...</p> : null}
          {!couponsLoading && coupons.length === 0 ? <p className="muted">No coupon codes yet.</p> : null}
          {coupons.map((coupon) => {
            const isWorking = coupon.active && coupon.discountPercent >= 1 && coupon.discountPercent <= 100;
            return (
              <div key={coupon._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", padding: "0.85rem 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <strong>{coupon.code}</strong> <span className="muted">— {coupon.discountPercent}% off</span>
                  <p style={{ color: isWorking ? "green" : "crimson", margin: "0.25rem 0 0" }}>{isWorking ? "Active" : "Inactive"}</p>
                </div>
                <button className="btn btn-outline" type="button" onClick={() => deleteCoupon(coupon.code)} disabled={deletingCoupon === coupon.code}>
                  {deletingCoupon === coupon.code ? "Deleting..." : "Delete"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
