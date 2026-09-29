"use client";

import Link from "next/link";
import { useState } from "react";
import { adminKey, verifyAdminPassword } from "@/lib/admin-client";

type R = { _id: string; bookId: number; name: string; rating: number; title?: string; body: string; status: "published" | "hidden"; createdAt: string };

export default function AdminReviewsPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<R[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews", { headers: { "x-admin-password": adminKey() } });
      const j = await res.json();
      setRows(j.reviews || []);
    } finally {
      setLoading(false);
    }
  };

  const unlock = async () => {
    if (await verifyAdminPassword(password)) { setAuthorized(true); setError(""); void load(); }
    else setError("Incorrect admin password.");
  };

  const setStatus = async (id: string, status: R["status"]) => {
    await fetch("/api/admin/reviews", { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-password": adminKey() }, body: JSON.stringify({ id, status }) });
    setRows((rs) => rs.map((r) => (r._id === id ? { ...r, status } : r)));
  };

  if (!authorized) {
    return (
      <main className="container" style={{ maxWidth: 420, padding: "4rem 16px" }}>
        <h1 style={{ fontFamily: "var(--serif)" }}>Review moderation</h1>
        <form onSubmit={(e) => { e.preventDefault(); void unlock(); }} style={{ display: "grid", gap: ".6rem" }}>
          <input type="password" className="gift-input" placeholder="Admin password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn btn-primary">Unlock</button>
          {error ? <p className="gift-err">{error}</p> : null}
        </form>
      </main>
    );
  }

  return (
    <main className="container" style={{ maxWidth: 960, padding: "2.5rem 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--serif)", margin: 0 }}>Reviews ({rows.length})</h1>
        <Link href="/admin" className="btn btn-outline btn-sm">← Admin</Link>
      </div>
      <p className="muted">Reviews go live immediately. Hide anything abusive, off-topic or spam.</p>
      {loading ? <p>Loading…</p> : null}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {rows.map((r) => (
          <li key={r._id} style={{ background: "#fff", border: "1px solid #e6e1d6", borderRadius: 12, padding: "1rem", marginBottom: ".75rem", opacity: r.status === "hidden" ? 0.6 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div><b>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</b> · Book #{r.bookId} · {r.name} · {new Date(r.createdAt).toLocaleDateString("en-IN")}</div>
              {r.status === "published"
                ? <button className="btn btn-outline btn-sm" onClick={() => setStatus(r._id, "hidden")}>Hide</button>
                : <button className="btn btn-primary btn-sm" onClick={() => setStatus(r._id, "published")}>Publish</button>}
            </div>
            {r.title ? <div style={{ fontWeight: 700, marginTop: ".4rem" }}>{r.title}</div> : null}
            <p style={{ margin: ".3rem 0 0", whiteSpace: "pre-line" }}>{r.body}</p>
          </li>
        ))}
      </ul>
      {!loading && !rows.length ? <p className="muted">No reviews yet.</p> : null}
    </main>
  );
}
