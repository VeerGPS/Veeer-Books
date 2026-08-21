"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ADMIN_PASSWORD } from "@/lib/admin";

export default function AdminPublishingSettingsPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [settings, setSettings] = useState({
    platformCommissionPercentage: 15,
    adminNotificationEmail: "veeersukhadiyabooks95@gmail.com",
    minBookPrice: 49,
    maxBookPrice: 9999,
    contentGuidelinesText: "",
    authorTermsText: "",
  });

  // Agreement versions state
  const [versions, setVersions] = useState<any[]>([]);
  const [activeVersion, setActiveVersion] = useState<any>(null);
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [newVersionForm, setNewVersionForm] = useState({
    version: "",
    title: "Veeer Sukhadiya Books Digital Publishing Agreement",
    content: "",
    summary: "",
    makeActive: true,
  });
  const [creatingVersion, setCreatingVersion] = useState(false);

  const unlock = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthorized(true);
      setError("");
      void loadData();
    } else {
      setError("Incorrect admin password.");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load general platform settings
      const res = await fetch("/api/admin/publishing/settings", {
        headers: { "x-admin-password": ADMIN_PASSWORD },
      });
      const data = await res.json();
      if (data.settings) {
        setSettings({
          platformCommissionPercentage: data.settings.platformCommissionPercentage || 15,
          adminNotificationEmail: data.settings.adminNotificationEmail || "veeersukhadiyabooks95@gmail.com",
          minBookPrice: data.settings.minBookPrice || 49,
          maxBookPrice: data.settings.maxBookPrice || 9999,
          contentGuidelinesText: data.settings.contentGuidelinesText || "",
          authorTermsText: data.settings.authorTermsText || "",
        });
      }

      // 2. Load agreement versions and acceptance stats
      const vRes = await fetch("/api/admin/publishing/agreements", {
        headers: { "x-admin-password": ADMIN_PASSWORD },
      });
      const vData = await vRes.json();
      if (vData.versions) {
        setVersions(vData.versions);
        const active = vData.versions.find((v: any) => v.isActive) || vData.activeVersion;
        setActiveVersion(active);
        if (active && !newVersionForm.content) {
          setNewVersionForm((prev) => ({
            ...prev,
            content: active.content,
            version: `VSB-DPA-1.${vData.versions.length}`,
          }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      void loadData();
    }
  }, [authorized]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    try {
      const res = await fetch("/api/admin/publishing/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": ADMIN_PASSWORD,
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      setSuccessMessage("✅ Commercial settings saved successfully!");
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : "Save failed"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSetActiveVersion = async (versionStr: string) => {
    if (!confirm(`Are you sure you want to set version ${versionStr} as the active agreement? Existing author acceptance records will remain immutable.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/publishing/agreements/${encodeURIComponent(versionStr)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": ADMIN_PASSWORD,
        },
        body: JSON.stringify({ action: "SET_ACTIVE" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to activate version");
      alert(`✅ ${json.message}`);
      await loadData();
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : "Activation failed"}`);
    }
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingVersion(true);
    try {
      const res = await fetch("/api/admin/publishing/agreements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": ADMIN_PASSWORD,
        },
        body: JSON.stringify(newVersionForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create agreement version");

      alert(`✅ ${json.message}`);
      setShowNewVersionModal(false);
      await loadData();
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : "Creation failed"}`);
    } finally {
      setCreatingVersion(false);
    }
  };

  if (!authorized) {
    return (
      <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "6rem 1rem 4rem", color: "#0f172a" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", padding: "2rem", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center" }}>Platform Settings Access</h1>
          <p style={{ color: "#475569", marginBottom: "1.5rem", textAlign: "center" }}>Enter password to manage publishing rules, commission %, and agreement versions.</p>
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
            Unlock Settings
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "4rem 1rem 6rem", color: "#0f172a" }}>
      <div className="container" style={{ maxWidth: 960, margin: "0 auto" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1.25rem", borderBottom: "2px solid #e2e8f0", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: 0 }}>⚙️ Platform & Publishing Agreement Control</h1>
            <p style={{ color: "#475569", margin: "0.25rem 0 0 0", fontSize: "0.95rem" }}>
              Manage platform commission %, admin notification emails, and versioned publishing agreements.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/admin/publishing" className="btn btn-outline btn-sm" style={{ backgroundColor: "#ffffff" }}>
              ← Publishing Queue
            </Link>
            <Link href="/admin/publishing/sales" className="btn btn-outline btn-sm" style={{ backgroundColor: "#ffffff" }}>
              Revenue Ledger
            </Link>
          </div>
        </div>

        {/* ─── SECTION 1: PUBLISHING AGREEMENT VERSION CONTROL ─────────────── */}
        <div style={{ backgroundColor: "#ffffff", padding: "2.5rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", marginBottom: "2.5rem" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", color: "var(--accent-dark)", letterSpacing: "1px" }}>
                AUDITABLE LEGAL INFRASTRUCTURE
              </span>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0.2rem 0 0 0" }}>
                📜 Digital Publishing Agreement Versions
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setShowNewVersionModal(true)}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700 }}
            >
              + Create New Agreement Version
            </button>
          </div>

          {/* Active Version Banner */}
          {activeVersion && (
            <div style={{ backgroundColor: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "12px", padding: "1.25rem 1.5rem", marginBottom: "1.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: "1px" }}>
                  CURRENT ACTIVE AGREEMENT
                </span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#166534", margin: "0.2rem 0" }}>
                  {activeVersion.version} — {activeVersion.title}
                </h3>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#15803d" }}>
                  Effective Date: {new Date(activeVersion.effectiveDate || activeVersion.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })} • Accepted by <strong>{activeVersion.acceptanceCount || 0}</strong> author(s).
                </p>
              </div>

              <Link
                href="/publishing-agreement"
                target="_blank"
                className="btn btn-outline btn-sm"
                style={{ backgroundColor: "#ffffff", borderColor: "#86efac", color: "#166534", fontWeight: 700 }}
              >
                View Public Viewer ↗
              </Link>
            </div>
          )}

          {/* Versions Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Version</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Title / Summary</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Effective Date</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Author Acceptances</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Status</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v._id || v.version} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--accent-dark)" }}>
                      {v.version}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600 }}>{v.title}</div>
                      {v.summary && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{v.summary}</div>}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>
                      {new Date(v.effectiveDate || v.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ backgroundColor: "#f1f5f9", padding: "4px 10px", borderRadius: "12px", fontWeight: 700, fontSize: "0.85rem" }}>
                        {v.acceptanceCount || 0} Authors
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {v.isActive ? (
                        <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "12px", fontWeight: 700, fontSize: "0.8rem" }}>
                          ✓ Active
                        </span>
                      ) : (
                        <span style={{ backgroundColor: "#f1f5f9", color: "#64748b", padding: "4px 10px", borderRadius: "12px", fontWeight: 600, fontSize: "0.8rem" }}>
                          Historical
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      {!v.isActive ? (
                        <button
                          onClick={() => handleSetActiveVersion(v.version)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                        >
                          Set Active
                        </button>
                      ) : (
                        <span style={{ color: "#15803d", fontWeight: 700, fontSize: "0.82rem" }}>
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── CREATE NEW VERSION MODAL ────────────────────────────────────── */}
        {showNewVersionModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "2rem", maxWidth: 750, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>Create New Agreement Version</h3>
                <button onClick={() => setShowNewVersionModal(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b" }}>✕</button>
              </div>

              <form onSubmit={handleCreateVersion}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.3rem" }}>Version Code *</label>
                    <input
                      required
                      placeholder="e.g. VSB-DPA-1.1"
                      value={newVersionForm.version}
                      onChange={(e) => setNewVersionForm({ ...newVersionForm, version: e.target.value })}
                      style={{ width: "100%", padding: "0.65rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.3rem" }}>Agreement Title *</label>
                    <input
                      required
                      value={newVersionForm.title}
                      onChange={(e) => setNewVersionForm({ ...newVersionForm, title: e.target.value })}
                      style={{ width: "100%", padding: "0.65rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.3rem" }}>Summary of Changes</label>
                  <input
                    placeholder="Brief description of updates in this revision"
                    value={newVersionForm.summary}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, summary: e.target.value })}
                    style={{ width: "100%", padding: "0.65rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.3rem" }}>Agreement Document Text (28 Sections) *</label>
                  <textarea
                    rows={12}
                    required
                    value={newVersionForm.content}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, content: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontFamily: "monospace", fontSize: "0.85rem" }}
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>
                    <input
                      type="checkbox"
                      checked={newVersionForm.makeActive}
                      onChange={(e) => setNewVersionForm({ ...newVersionForm, makeActive: e.target.checked })}
                    />
                    Set this version as the Active Publishing Agreement immediately upon creation
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button type="button" onClick={() => setShowNewVersionModal(false)} className="btn btn-outline btn-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={creatingVersion} className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
                    {creatingVersion ? "Creating..." : "Publish New Agreement Version"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── SECTION 2: COMMERCIALS & NOTIFICATION SETTINGS ─────────────── */}
        <form onSubmit={handleSaveSettings} style={{ backgroundColor: "#ffffff", padding: "2.5rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "1.25rem" }}>
            💰 Commercial Rules & Notification Settings
          </h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                Platform Commission (%) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={settings.platformCommissionPercentage}
                onChange={(e) => setSettings({ ...settings, platformCommissionPercentage: Number(e.target.value) })}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
              <small style={{ color: "#64748b" }}>e.g. 15 means 15% platform fee, 85% author royalty share.</small>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                Admin Notification Email *
              </label>
              <input
                type="email"
                required
                value={settings.adminNotificationEmail}
                onChange={(e) => setSettings({ ...settings, adminNotificationEmail: e.target.value })}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
              <small style={{ color: "#64748b" }}>Receives all author milestone and submission review alerts.</small>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                Minimum Book Price (INR)
              </label>
              <input
                type="number"
                min="1"
                value={settings.minBookPrice}
                onChange={(e) => setSettings({ ...settings, minBookPrice: Number(e.target.value) })}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                Maximum Book Price (INR)
              </label>
              <input
                type="number"
                min="1"
                value={settings.maxBookPrice}
                onChange={(e) => setSettings({ ...settings, maxBookPrice: Number(e.target.value) })}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "1.75rem" }}>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.3rem" }}>
              Author Content & Quality Guidelines (Markdown)
            </label>
            <textarea
              rows={5}
              value={settings.contentGuidelinesText}
              onChange={(e) => setSettings({ ...settings, contentGuidelinesText: e.target.value })}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontFamily: "monospace", fontSize: "0.88rem" }}
            />
          </div>

          {successMessage && (
            <div style={{ padding: "0.75rem 1rem", backgroundColor: "#f0fdf4", color: "#15803d", borderRadius: "8px", fontWeight: 600, marginBottom: "1.25rem" }}>
              {successMessage}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: "0.85rem 2.5rem", fontWeight: 700 }}>
            {saving ? "Saving Changes..." : "Save Commercial Settings"}
          </button>
        </form>
      </div>
    </main>
  );
}
