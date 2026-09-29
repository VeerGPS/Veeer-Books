"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import StudioShell, { useStudio, timeAgo } from "@/components/studio/StudioShell";

const AgreementDoc = dynamic(() => import("@/components/PublishingAgreementDocument"), {
  ssr: false,
  loading: () => <p className="s-muted">Loading agreement…</p>,
});

export default function AccountPage() {
  return (
    <StudioShell>
      <Account />
    </StudioShell>
  );
}

function Account() {
  const { data } = useStudio();
  return (
    <>
      <div className="studio-head">
        <div>
          <h1>Account</h1>
          <p>Your public author profile, publishing agreement and notifications.</p>
        </div>
        {data.profile?.slug ? <Link href={`/author/${data.profile.slug}`} className="s-btn">View public profile</Link> : null}
      </div>
      <div className="shelf-layout">
        <div style={{ display: "grid", gap: "1.25rem" }}>
          <ProfileForm />
          <Agreement />
        </div>
        <Notifications />
      </div>
    </>
  );
}

function ProfileForm() {
  const { data, token, reload, toast } = useStudio();
  const p = data.profile || {};
  const [f, setF] = useState({
    penName: p.penName || "",
    fullName: p.fullName || "",
    authorType: p.authorType || "Individual Author",
    country: p.country || "India",
    phone: p.phone || "",
    website: p.website || "",
    biography: p.biography || "",
    profilePhoto: p.profilePhoto || "",
    twitter: p.socialLinks?.twitter || "",
    instagram: p.socialLinks?.instagram || "",
    linkedin: p.socialLinks?.linkedin || "",
    youtube: p.socialLinks?.youtube || "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!f.penName.trim()) return setErr("Author name is required — it appears on your books.");
    if (f.website && !/^https?:\/\//i.test(f.website.trim())) return setErr("Website should start with https://");
    setBusy(true);
    try {
      const { twitter, instagram, linkedin, youtube, ...rest } = f;
      const res = await fetch("/api/author/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...rest, socialLinks: { ...(p.socialLinks || {}), twitter, instagram, linkedin, youtube } }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not save profile");
      await reload();
      toast("Profile saved");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="s-card s-card-pad" onSubmit={save}>
      <h3 className="s-card-title">Author profile</h3>
      <p className="s-sub" style={{ marginBottom: "1rem" }}>Readers see this on your author page and on every book you publish.</p>
      <div className="s-row">
        <div className="s-field"><label className="s-label">Author name (pen name)</label><input className="s-input" value={f.penName} onChange={set("penName")} maxLength={80} /></div>
        <div className="s-field"><label className="s-label">Legal name</label><input className="s-input" value={f.fullName} onChange={set("fullName")} maxLength={120} /><div className="s-hint">Private. Used for payouts and tax.</div></div>
      </div>
      <div className="s-row s-row-3col">
        <div className="s-field"><label className="s-label">Publishing as</label>
          <select className="s-select" value={f.authorType} onChange={set("authorType")}><option>Individual Author</option><option>Publisher</option></select>
        </div>
        <div className="s-field"><label className="s-label">Country</label><input className="s-input" value={f.country} onChange={set("country")} /></div>
        <div className="s-field"><label className="s-label">Phone</label><input className="s-input" value={f.phone} onChange={set("phone")} inputMode="tel" /></div>
      </div>
      <div className="s-field">
        <label className="s-label">About the author</label>
        <textarea className="s-textarea" rows={5} value={f.biography} onChange={set("biography")} maxLength={2000} placeholder="A short bio in the third person works best." />
        <div className="s-hint"><span>Shown on your author page.</span><span>{f.biography.length}/2000</span></div>
      </div>
      <div className="s-row">
        <div className="s-field"><label className="s-label">Website</label><input className="s-input" value={f.website} onChange={set("website")} placeholder="https://" /></div>
        <div className="s-field"><label className="s-label">Photo URL</label><input className="s-input" value={f.profilePhoto} onChange={set("profilePhoto")} placeholder="https://" /></div>
      </div>
      <div className="s-row">
        <div className="s-field"><label className="s-label">Instagram</label><input className="s-input" value={f.instagram} onChange={set("instagram")} /></div>
        <div className="s-field"><label className="s-label">X / Twitter</label><input className="s-input" value={f.twitter} onChange={set("twitter")} /></div>
      </div>
      <div className="s-row">
        <div className="s-field"><label className="s-label">LinkedIn</label><input className="s-input" value={f.linkedin} onChange={set("linkedin")} /></div>
        <div className="s-field"><label className="s-label">YouTube</label><input className="s-input" value={f.youtube} onChange={set("youtube")} /></div>
      </div>
      {err ? <div className="s-alert s-alert-bad"><div className="s-alert-body">{err}</div></div> : null}
      <button className="s-btn s-btn-primary" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
    </form>
  );
}

function Agreement() {
  const { data, token, reload, toast } = useStudio();
  const a = data.agreementStatus;
  const version = a?.activeAgreement?.version;
  const outdated = Boolean(a?.isAccepted && version && a.acceptedRecord?.agreementVersion !== version);
  const needs = !a?.isAccepted || outdated;
  const [open, setOpen] = useState(needs);
  const [rights, setRights] = useState(false);
  const [accurate, setAccurate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const accept = async () => {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/author/agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agreementVersion: version, rightsConfirmed: true, accurateInfoConfirmed: true, acceptanceType: "dashboard_standalone" }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not record acceptance");
      await reload();
      toast("Agreement accepted");
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not record acceptance");
    } finally { setBusy(false); }
  };

  return (
    <section id="agreement" className="s-card s-card-pad" style={{ scrollMarginTop: 90 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h3 className="s-card-title">Publishing agreement</h3>
          {outdated ? (
            <p className="s-sub">We’ve updated the agreement to version {version}: royalties are now paid on the last day of every month (Section 15). You accepted version {a?.acceptedRecord?.agreementVersion} — please review and accept the new version.</p>
          ) : a?.isAccepted ? (
            <p className="s-sub">Accepted version {a.acceptedRecord?.agreementVersion} on {a.acceptedRecord?.acceptedAt ? new Date(a.acceptedRecord.acceptedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}.</p>
          ) : (
            <p className="s-sub">You need to accept the current agreement{version ? ` (version ${version})` : ""} before submitting a book for review.</p>
          )}
        </div>
        <span className={`s-pill ${needs ? "tone-warn" : "tone-good"}`}>{outdated ? "Update available" : needs ? "Action needed" : "Accepted"}</span>
      </div>
      <button type="button" className="s-link" style={{ marginTop: "0.75rem" }} onClick={() => setOpen(!open)}>{open ? "Hide agreement" : "Read the agreement"}</button>
      {open ? (
        <div style={{ marginTop: "1rem", maxHeight: 460, overflow: "auto", border: "1px solid #ece7dd", borderRadius: 10, padding: "0.5rem" }}>
          <AgreementDoc version={version} />
        </div>
      ) : null}
      {needs ? (
        <div style={{ marginTop: "1rem" }}>
          <label className="s-check"><input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} /> <span>I own or control the rights to publish the books I submit.</span></label>
          <label className="s-check"><input type="checkbox" checked={accurate} onChange={(e) => setAccurate(e.target.checked)} /> <span>The information I provide is accurate, and I agree to the publishing agreement.</span></label>
          {err ? <div className="s-alert s-alert-bad"><div className="s-alert-body">{err}</div></div> : null}
          <button className="s-btn s-btn-primary" disabled={!rights || !accurate || busy} onClick={accept} style={{ marginTop: "0.5rem" }}>{busy ? "Saving…" : outdated ? `Accept version ${version}` : "Accept agreement"}</button>
        </div>
      ) : null}
    </section>
  );
}

function Notifications() {
  const { data } = useStudio();
  const list = data.notifications || [];
  return (
    <aside className="s-card s-card-pad s-side">
      <h3 className="s-card-title">Notifications</h3>
      {list.length ? (
        <ul className="s-list">
          {list.map((n: any) => {
            const inner = (
              <>
                <div className="t">{!n.isRead ? <span aria-label="unread" style={{ display: "inline-block", width: 7, height: 7, borderRadius: 4, background: "#b7791f", marginRight: 6, verticalAlign: "middle" }} /> : null}{n.title}</div>
                <div className="d">{n.message}</div>
                <div className="d">{timeAgo(n.createdAt)}</div>
              </>
            );
            return <li key={n._id}>{n.link ? <Link href={n.link} style={{ color: "inherit", textDecoration: "none" }}>{inner}</Link> : inner}</li>;
          })}
        </ul>
      ) : <p className="s-muted" style={{ fontSize: "0.9rem" }}>You’re all caught up.</p>}
    </aside>
  );
}
