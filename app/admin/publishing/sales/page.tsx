"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ADMIN_PASSWORD } from "@/lib/admin";

export default function AdminPublishingSalesPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  const [metrics, setMetrics] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const unlock = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthorized(true);
      setError("");
      void loadSales();
    } else {
      setError("Incorrect admin password.");
    }
  };

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/publishing/sales", {
        headers: { "x-admin-password": ADMIN_PASSWORD },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load sales ledger");
      setMetrics(data.metrics);
      setLedger(data.ledger || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      void loadSales();
    }
  }, [authorized]);

  if (!authorized) {
    return (
      <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "6rem 1rem 4rem", color: "#0f172a" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", padding: "2rem", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center" }}>Marketplace Sales Access</h1>
          <p style={{ color: "#475569", marginBottom: "1.5rem", textAlign: "center" }}>Enter password to view author revenue shares and settlement ledgers.</p>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600, fontSize: "0.9rem" }}>Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>
          {error && <p style={{ color: "#dc2626", marginBottom: "1rem", fontWeight: 500 }}>{error}</p>}
          <button className="btn btn-primary btn-full" onClick={unlock} style={{ padding: "0.85rem", fontWeight: 600 }}>
            View Marketplace Sales
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "4rem 1rem 6rem", color: "#0f172a" }}>
      <div className="container" style={{ maxWidth: 1160, margin: "0 auto" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1.25rem", borderBottom: "2px solid #e2e8f0" }}>
          <div>
            <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: 0 }}>💰 Author Marketplace Sales & Revenue</h1>
            <p style={{ color: "#475569", margin: "0.25rem 0 0 0", fontSize: "0.95rem" }}>
              Track gross sales, platform commissions, author payouts, and pending settlements.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <Link href="/admin/publishing" className="btn btn-outline btn-sm" style={{ backgroundColor: "#ffffff" }}>
              ← Publishing Queue
            </Link>
            <button className="btn btn-primary btn-sm" onClick={() => void loadSales()} disabled={loading}>
              {loading ? "Refreshing..." : "🔄 Refresh"}
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
          <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Total Marketplace Sales</span>
            <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.25rem" }}>{metrics?.totalSalesCount || 0}</div>
            <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Gross: ₹{(metrics?.totalGrossRevenue || 0).toFixed(2)}</span>
          </div>

          <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Platform Commissions</span>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#15803d", marginTop: "0.25rem" }}>
              ₹{(metrics?.totalPlatformCommission || 0).toFixed(2)}
            </div>
            <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Platform gross retain</span>
          </div>

          <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Author Royalties</span>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#b45309", marginTop: "0.25rem" }}>
              ₹{(metrics?.totalAuthorPayouts || 0).toFixed(2)}
            </div>
            <span style={{ fontSize: "0.82rem", color: "#64748b" }}>₹{(metrics?.pendingSettlement || 0).toFixed(2)} pending payout</span>
          </div>
        </div>

        {/* Sales Table */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
          {ledger.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
              No marketplace sales recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.92rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", color: "#475569" }}>Order ID</th>
                    <th style={{ padding: "12px 16px", color: "#475569" }}>Book Title</th>
                    <th style={{ padding: "12px 16px", color: "#475569" }}>Author</th>
                    <th style={{ padding: "12px 16px", color: "#475569" }}>Gross</th>
                    <th style={{ padding: "12px 16px", color: "#475569" }}>Platform Fee</th>
                    <th style={{ padding: "12px 16px", color: "#475569" }}>Author Share</th>
                    <th style={{ padding: "12px 16px", color: "#475569" }}>Settlement</th>
                    <th style={{ padding: "12px 16px", color: "#475569" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((sale: any) => (
                    <tr key={sale._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#64748b", fontSize: "0.82rem" }}>{sale.orderId}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{sale.bookTitle}</td>
                      <td style={{ padding: "12px 16px" }}>{sale.authorId?.penName || "Author"}</td>
                      <td style={{ padding: "12px 16px" }}>₹{sale.grossAmount?.toFixed(2)}</td>
                      <td style={{ padding: "12px 16px", color: "#15803d", fontWeight: 600 }}>+₹{sale.platformCommission?.toFixed(2)}</td>
                      <td style={{ padding: "12px 16px", color: "#b45309", fontWeight: 700 }}>₹{sale.authorShare?.toFixed(2)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "3px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: sale.settlementStatus === "settled" ? "#dcfce7" : "#fef3c7", color: sale.settlementStatus === "settled" ? "#15803d" : "#b45309" }}>
                          {sale.settlementStatus.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "0.85rem" }}>
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
