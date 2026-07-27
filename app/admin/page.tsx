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
      const bookId = editingBook._id || String(editingBook.id);
      const uploadData = new FormData();
      uploadData.append("id", bookId);
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

  const deleteBook = async (book: AdminBook) => {
    const bookId = book._id || String(book.id);
    if (!window.confirm(`Are you sure you want to delete "${book.title}"? This cannot be undone.`)) return;

    setDeletingBookId(bookId);
    try {
      const res = await fetch(`/api/admin/books?id=${encodeURIComponent(bookId)}`, {
        method: "DELETE",
        headers: { "x-admin-password": ADMIN_PASSWORD },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete book");
      setBooks((prev) => prev.filter((b) => (b._id || String(b.id)) !== bookId));
      alert(`✅ Book "${book.title}" deleted.`);
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

  // Light Theme styling helper
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontSize: "0.95rem",
    outline: "none",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "0.4rem",
    fontWeight: 600,
    color: "#0f172a",
    fontSize: "0.9rem",
  };

  if (!authorized) {
    return (
      <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "6rem 1rem 4rem", color: "#0f172a" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "2rem", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem", color: "#0f172a", textAlign: "center" }}>Admin Access</h1>
          <p style={{ color: "#475569", marginBottom: "1.5rem", textAlign: "center" }}>Enter the admin password to manage books and store configuration.</p>
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="admin-password" style={labelStyle}>Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={inputStyle}
            />
          </div>
          {error ? <p style={{ color: "#dc2626", marginBottom: "1rem", fontWeight: 500 }}>{error}</p> : null}
          <button className="btn btn-primary btn-full" onClick={unlock} style={{ padding: "0.85rem", fontSize: "1rem", fontWeight: 600 }}>Enter Admin Panel</button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "6rem 1rem 4rem", color: "#0f172a" }}>
      <div style={{ maxWidth: 1060, margin: "0 auto", backgroundColor: "#ffffff", padding: "2.5rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 25px rgba(0, 0, 0, 0.05)" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1.25rem", borderBottom: "2px solid #f1f5f9" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Admin Dashboard</h1>
            <p style={{ color: "#475569", margin: "0.25rem 0 0 0", fontSize: "0.95rem" }}>Manage book catalogue, pricing, uploaded files, and coupons with light mode theme.</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={loadBooks} disabled={booksLoading} style={{ color: "#0f172a", borderColor: "#cbd5e1", backgroundColor: "#ffffff" }}>
            {booksLoading ? "Refreshing..." : "🔄 Refresh Catalogue"}
          </button>
        </div>

        {/* ─── Metrics Cards ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
          <div style={{ padding: "1.5rem", borderRadius: "12px", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textAlign: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "#475569", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Total Books</span>
            <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#b45309", marginTop: "0.25rem" }}>{books.length}</div>
          </div>
          <div style={{ padding: "1.5rem", borderRadius: "12px", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textAlign: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "#475569", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Active Coupons</span>
            <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#15803d", marginTop: "0.25rem" }}>{coupons.filter(c => c.active).length}</div>
          </div>
        </div>

        {/* ─── Book Management List ─── */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>Book Catalogue ({books.length})</h2>

          {bookMessage ? <p style={{ color: "#dc2626", marginBottom: "1rem", fontWeight: 500 }}>{bookMessage}</p> : null}
          {booksLoading && books.length === 0 ? <p style={{ color: "#475569" }}>Loading book catalogue...</p> : null}

          {books.length === 0 && !booksLoading ? (
            <p style={{ padding: "2.5rem", textAlign: "center", border: "2px dashed #cbd5e1", borderRadius: "12px", color: "#475569", backgroundColor: "#f8fafc" }}>
              No books added yet. Use the form below to publish your first book.
            </p>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {books.map((b) => (
              <div
                key={b._id || b.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr auto",
                  gap: "1.25rem",
                  alignItems: "center",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ width: 70, height: 95, position: "relative", borderRadius: "6px", overflow: "hidden", border: "1px solid #e2e8f0", backgroundColor: "#f1f5f9" }}>
                  <Image
                    src={b.cover || "/images/default-book.svg"}
                    alt={b.title}
                    fill
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                </div>

                <div>
                  <h3 style={{ fontSize: "1.15rem", margin: "0 0 0.25rem 0", fontWeight: 700, color: "#0f172a" }}>{b.title}</h3>
                  <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.9rem", color: "#475569" }}>By <strong>{b.author}</strong> • {b.genre} • {b.pages} pages</p>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", fontSize: "0.95rem" }}>
                    <span style={{ color: "#b45309", fontWeight: 700 }}>₹{b.sellingPrice || b.price}</span>
                    {b.actualPrice > (b.sellingPrice || b.price) ? (
                      <span style={{ color: "#64748b", textDecoration: "line-through", fontSize: "0.85rem" }}>₹{b.actualPrice}</span>
                    ) : null}
                    <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, backgroundColor: b.isActive ? "#dcfce7" : "#fee2e2", color: b.isActive ? "#15803d" : "#b91c1c" }}>
                      {b.isActive ? "Live on Store" : "Hidden / Inactive"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <button className="btn btn-outline btn-sm" type="button" onClick={() => handleEditBook(b)} style={{ color: "#0f172a", borderColor: "#cbd5e1", backgroundColor: "#ffffff" }}>
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    type="button"
                    style={{ borderColor: "#fca5a5", color: "#dc2626", backgroundColor: "#fff5f5" }}
                    onClick={() => deleteBook(b)}
                    disabled={deletingBookId === (b._id || String(b.id))}
                  >
                    {deletingBookId === (b._id || String(b.id)) ? "Deleting..." : "🗑️ Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Edit Book Form Section ─── */}
        {editingBook ? (
          <div style={{ padding: "2rem", borderRadius: "12px", border: "2px solid #b45309", backgroundColor: "#fffbebf5", marginBottom: "3rem", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.4rem", margin: 0, color: "#b45309", fontWeight: 700 }}>✏️ Edit Book: {editingBook.title}</h2>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => setEditingBook(null)} style={{ color: "#0f172a", borderColor: "#cbd5e1", backgroundColor: "#ffffff" }}>
                ✖ Cancel Edit
              </button>
            </div>

            <form onSubmit={saveEditBook}>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="edit-title" style={labelStyle}>Book Title *</label>
                <input id="edit-title" required value={editingBook.title} onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="edit-author" style={labelStyle}>Author *</label>
                <input id="edit-author" required value={editingBook.author} onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="edit-slug" style={labelStyle}>Slug (URL string)</label>
                <input id="edit-slug" value={editingBook.slug} onChange={(e) => setEditingBook({ ...editingBook, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label htmlFor="edit-actualPrice" style={labelStyle}>Actual Price (INR) *</label>
                  <input id="edit-actualPrice" type="number" min="1" required value={editingBook.actualPrice} onChange={(e) => setEditingBook({ ...editingBook, actualPrice: Number(e.target.value) })} style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="edit-sellingPrice" style={labelStyle}>Selling Price (INR) *</label>
                  <input id="edit-sellingPrice" type="number" min="1" required value={editingBook.sellingPrice || editingBook.price} onChange={(e) => setEditingBook({ ...editingBook, sellingPrice: Number(e.target.value), price: Number(e.target.value) })} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="edit-genre" style={labelStyle}>Genre</label>
                <input id="edit-genre" value={editingBook.genre} onChange={(e) => setEditingBook({ ...editingBook, genre: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="edit-pages" style={labelStyle}>Pages</label>
                <input id="edit-pages" type="number" min="0" value={editingBook.pages} onChange={(e) => setEditingBook({ ...editingBook, pages: Number(e.target.value) })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="edit-description" style={labelStyle}>Description *</label>
                <textarea id="edit-description" rows={4} required value={editingBook.description} onChange={(e) => setEditingBook({ ...editingBook, description: e.target.value })} style={{ ...inputStyle, fontFamily: "inherit" }} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="edit-htmlContent" style={labelStyle}>Book HTML Reader Content</label>
                <textarea id="edit-htmlContent" rows={8} value={editingBook.htmlContent} onChange={(e) => setEditingBook({ ...editingBook, htmlContent: e.target.value })} style={{ ...inputStyle, fontFamily: "inherit" }} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="edit-coverFile" style={labelStyle}>Replace Cover Image File (Optional)</label>
                <input id="edit-coverFile" type="file" accept="image/*" onChange={(e) => setEditCoverFile(e.target.files?.[0] || null)} style={inputStyle} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="edit-readerFile" style={labelStyle}>Replace Reader HTML File (Optional)</label>
                <input id="edit-readerFile" type="file" accept=".html,text/html" onChange={(e) => setEditReaderFile(e.target.files?.[0] || null)} style={inputStyle} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="edit-pdfFile" style={labelStyle}>Replace PDF File (Optional)</label>
                <input id="edit-pdfFile" type="file" accept="application/pdf" onChange={(e) => setEditPdfFile(e.target.files?.[0] || null)} style={inputStyle} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <input id="edit-isActive" type="checkbox" checked={editingBook.isActive} onChange={(e) => setEditingBook({ ...editingBook, isActive: e.target.checked })} style={{ width: 18, height: 18, cursor: "pointer" }} />
                <label htmlFor="edit-isActive" style={{ fontWeight: 600, color: "#0f172a", cursor: "pointer" }}>Is Live on Store</label>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button className="btn btn-primary" style={{ flex: 1, padding: "0.85rem", fontWeight: 600 }} disabled={submitting}>{submitting ? "Updating Book..." : "Save Changes"}</button>
                <button className="btn btn-outline" type="button" onClick={() => setEditingBook(null)} style={{ padding: "0.85rem", color: "#0f172a", borderColor: "#cbd5e1" }}>Cancel</button>
              </div>
            </form>
          </div>
        ) : null}

        {/* ─── Add New Book Form Section ─── */}
        <hr style={{ margin: "2.5rem 0", borderColor: "#e2e8f0" }} />
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>➕ Add New Book</h2>
        <p style={{ color: "#475569", marginBottom: "1.75rem", fontSize: "0.95rem" }}>Upload a new book and make it live on the website instantly.</p>

        <form onSubmit={submitBook}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="title" style={labelStyle}>Book Title *</label>
            <input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. The Art & Science of Prompting" style={inputStyle} />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="author" style={labelStyle}>Author *</label>
            <input id="author" required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="e.g. Veer Sukhadiya" style={inputStyle} />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="slug" style={labelStyle}>Slug (URL string)</label>
            <input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} placeholder="auto-generated if left empty" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
            <div>
              <label htmlFor="actualPrice" style={labelStyle}>Actual Price (INR) *</label>
              <input id="actualPrice" type="number" min="1" required value={form.actualPrice} onChange={(e) => setForm({ ...form, actualPrice: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="sellingPrice" style={labelStyle}>Selling Price (INR) *</label>
              <input id="sellingPrice" type="number" min="1" required value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="genre" style={labelStyle}>Genre</label>
            <input id="genre" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="e.g. AI / Technology" style={inputStyle} />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="pages" style={labelStyle}>Pages</label>
            <input id="pages" type="number" min="1" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="description" style={labelStyle}>Description *</label>
            <textarea id="description" rows={4} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, fontFamily: "inherit" }} placeholder="Detailed book description..." />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="htmlContent" style={labelStyle}>Book HTML Content *</label>
            <textarea id="htmlContent" rows={8} required value={form.htmlContent} onChange={(e) => setForm({ ...form, htmlContent: e.target.value })} style={{ ...inputStyle, fontFamily: "inherit" }} placeholder="Paste the HTML content for the book reader here..." />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="coverFile" style={labelStyle}>Upload Cover Image</label>
            <input id="coverFile" type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="readerFile" style={labelStyle}>Upload Reader HTML</label>
            <input id="readerFile" type="file" accept=".html,text/html" onChange={(e) => setReaderFile(e.target.files?.[0] || null)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="pdfFile" style={labelStyle}>Upload PDF</label>
            <input id="pdfFile" type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} style={inputStyle} />
          </div>
          {error ? <p style={{ color: "#dc2626", marginBottom: "1.25rem", fontWeight: 600 }}>{error}</p> : null}
          <button className="btn btn-primary btn-full" disabled={submitting} style={{ padding: "0.9rem", fontSize: "1.05rem", fontWeight: 700 }}>{submitting ? "Publishing Book..." : "🚀 Publish Book"}</button>
        </form>

        {/* ─── Coupon Management Section ─── */}
        <hr style={{ margin: "2.5rem 0", borderColor: "#e2e8f0" }} />
        <form onSubmit={createCoupon}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>Create Coupon</h2>
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="couponCode" style={labelStyle}>Coupon Code</label>
            <input id="couponCode" required value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="e.g. SPECIAL50" style={inputStyle} />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="couponPercent" style={labelStyle}>Discount Percent</label>
            <input id="couponPercent" type="number" min="1" max="100" required value={couponPercent} onChange={(e) => setCouponPercent(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <input id="couponActive" type="checkbox" checked={couponActive} onChange={(e) => setCouponActive(e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer" }} />
            <label htmlFor="couponActive" style={{ fontWeight: 600, color: "#0f172a", cursor: "pointer" }}>Active</label>
          </div>
          {couponMessage ? <p style={{ color: couponMessage.includes("success") ? "#15803d" : "#dc2626", marginBottom: "1.25rem", fontWeight: 500 }}>{couponMessage}</p> : null}
          <button className="btn btn-outline btn-full" type="submit" style={{ padding: "0.85rem", color: "#0f172a", borderColor: "#cbd5e1", backgroundColor: "#ffffff", fontWeight: 600 }}>Save Coupon</button>
        </form>

        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>Coupon Codes</h3>
          <p style={{ color: "#475569", marginBottom: "1rem", fontSize: "0.9rem" }}>Active codes provide discount percentages to users at checkout.</p>
          {couponsLoading ? <p style={{ color: "#475569" }}>Loading coupons...</p> : null}
          {!couponsLoading && coupons.length === 0 ? <p style={{ color: "#475569" }}>No coupon codes yet.</p> : null}
          {coupons.map((coupon) => {
            const isWorking = coupon.active && coupon.discountPercent >= 1 && coupon.discountPercent <= 100;
            return (
              <div key={coupon._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", padding: "1rem 0", borderBottom: "1px solid #e2e8f0" }}>
                <div>
                  <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>{coupon.code}</strong> <span style={{ color: "#475569" }}>— {coupon.discountPercent}% off</span>
                  <p style={{ color: isWorking ? "#15803d" : "#dc2626", margin: "0.25rem 0 0", fontSize: "0.85rem", fontWeight: 600 }}>{isWorking ? "Active" : "Inactive"}</p>
                </div>
                <button className="btn btn-outline" type="button" onClick={() => deleteCoupon(coupon.code)} disabled={deletingCoupon === coupon.code} style={{ color: "#dc2626", borderColor: "#fca5a5", backgroundColor: "#fff5f5" }}>
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
