"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { absUrl } from "@/lib/site";
import StudioShell, { StatusPill, coverUrl, timeAgo, useStudio } from "@/components/studio/StudioShell";
import { canEdit, inr, payoutDateLabel, statusInfo, JOURNEY } from "@/lib/publishing";

export default function BookshelfPage() {
  return (
    <StudioShell>
      <Bookshelf />
    </StudioShell>
  );
}

type Row = {
  key: string;
  kind: "submission" | "live";
  id?: string;
  title: string;
  subtitle?: string;
  penName?: string;
  status: string;
  price?: number;
  cover: string | null;
  updatedAt?: string;
  code?: string;
  slug?: string;
  completeness?: number;
  feedback?: string;
  seriesName?: string;
  seriesNumber?: number;
};

const FILTERS = [
  { id: "all", label: "All titles" },
  { id: "live", label: "Live" },
  { id: "review", label: "In review" },
  { id: "action", label: "Action needed" },
  { id: "draft", label: "Drafts" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function bucket(status: string): FilterId {
  if (status === "PUBLISHED") return "live";
  if (status === "DRAFT") return "draft";
  if (status === "CHANGES_REQUESTED" || status === "REJECTED") return "action";
  return "review";
}

function Bookshelf() {
  const { data, token, reload, toast } = useStudio();
  const { profile, metrics, submissions = [], publishedBooks = [], notifications = [], agreementStatus } = data;
  const [filter, setFilter] = useState<FilterId>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"updated" | "title">("updated");
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = submissions.map((s: any) => ({
      key: s._id,
      kind: "submission",
      id: s._id,
      title: s.title,
      subtitle: s.subtitle,
      penName: s.penName,
      status: s.status,
      price: s.desiredPrice,
      cover: coverUrl(s),
      updatedAt: s.updatedAt,
      code: s.submissionId,
      slug: s.publishedBookSlug,
      completeness: s.completenessPercentage,
      feedback: s.adminFeedback,
      seriesName: s.seriesName,
      seriesNumber: s.seriesNumber,
    }));
    // Live books that didn't come through the submission flow (e.g. added by the store team).
    const linked = new Set(submissions.map((s: any) => s.publishedBookSlug).filter(Boolean));
    for (const b of publishedBooks) {
      if (linked.has(b.slug)) continue;
      out.push({
        key: `live-${b.slug}`, kind: "live", title: b.title, penName: b.author, status: "PUBLISHED",
        price: b.sellingPrice || b.price, cover: b.cover || null, updatedAt: b.updatedAt, slug: b.slug,
      });
    }
    return out;
  }, [submissions, publishedBooks]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, live: 0, review: 0, action: 0, draft: 0 };
    rows.forEach((r) => { c[bucket(r.status)]++; });
    return c;
  }, [rows]);

  const shown = rows
    .filter((r) => filter === "all" || bucket(r.status) === filter)
    .filter((r) => !q.trim() || `${r.title} ${r.subtitle || ""} ${r.code || ""} ${r.seriesName || ""}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => sort === "title"
      ? a.title.localeCompare(b.title)
      : new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

  const needsAction = rows.filter((r) => r.status === "CHANGES_REQUESTED");

  const deleteDraft = async (row: Row) => {
    if (!row.id) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/author/submissions/${row.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not delete the draft");
      toast(`“${row.title}” deleted`);
      setConfirmDelete(null);
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete the draft");
    } finally {
      setBusy(false);
    }
  };

  const firstName = (profile?.penName || profile?.fullName || "").split(" ")[0];

  return (
    <>
      <div className="studio-head">
        <div>
          <h1>Bookshelf</h1>
          <p>{firstName ? `Welcome back, ${firstName}. ` : ""}Create, edit and track every title you publish.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {profile?.slug ? <Link href={`/author/${profile.slug}`} className="s-btn" target="_blank">Your author page ↗</Link> : null}
          <Link href="/author/publish/new" className="s-btn s-btn-primary">+ Create new title</Link>
        </div>
      </div>

      {agreementStatus && !agreementStatus.isAccepted ? (
        <div className="s-alert s-alert-info">
          <div className="s-alert-body">
            <b>Accept the publishing agreement</b>
            You’ll need to accept the current Digital Publishing Agreement before your first book can be reviewed.
          </div>
          <Link href="/author/account#agreement" className="s-btn s-btn-sm">Review &amp; accept</Link>
        </div>
      ) : agreementStatus?.isAccepted && agreementStatus.activeAgreement?.version && agreementStatus.acceptedRecord?.agreementVersion !== agreementStatus.activeAgreement.version ? (
        <div className="s-alert s-alert-info">
          <div className="s-alert-body">
            <b>Publishing agreement updated to {agreementStatus.activeAgreement.version}</b>
            Royalties are now paid on the last day of every month. Please review and accept the updated agreement.
          </div>
          <Link href="/author/account#agreement" className="s-btn s-btn-sm">Review update</Link>
        </div>
      ) : null}

      {needsAction.map((r) => (
        <div className="s-alert s-alert-warn" key={`warn-${r.key}`}>
          <div className="s-alert-body">
            <b>Changes requested on “{r.title}”</b>
            {r.feedback ? <>Editor’s note: “{r.feedback.slice(0, 220)}{r.feedback.length > 220 ? "…" : ""}”</> : "Our editors asked for a few changes before publishing."}
          </div>
          <Link href={`/author/submissions/${r.id}/edit`} className="s-btn s-btn-sm s-btn-primary">Update &amp; resubmit</Link>
        </div>
      ))}

      <div className="s-kpis">
        <Kpi label="Live titles" value={String(counts.live)} note={`${counts.review} in review · ${counts.draft} drafts`} />
        <Kpi label="Copies sold" value={String(metrics?.totalSalesCount || 0)} note="All time" />
        <Kpi label="Royalties earned" value={inr(metrics?.totalAuthorEarnings || 0)} note={`You keep ${100 - (metrics?.activeCommissionRate ?? 15)}% of every sale`} />
        <Kpi label={`Payout on ${payoutDateLabel().replace(/ \d{4}$/, "")}`} value={inr(metrics?.pendingSettlement || 0)} note={<Link href="/author/payments" className="s-link">View payments</Link>} />
      </div>

      <div className="shelf-layout">
        <div className="s-card">
          <div className="shelf-tools">
            <input className="s-search" placeholder="Search by title, series or submission ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search titles" />
            <select className="s-select" style={{ width: "auto", height: 38 }} value={sort} onChange={(e) => setSort(e.target.value as any)} aria-label="Sort">
              <option value="updated">Last updated</option>
              <option value="title">Title A–Z</option>
            </select>
            <div className="s-chips" style={{ flexBasis: "100%" }}>
              {FILTERS.map((f) => (
                <button key={f.id} className={`s-chip ${filter === f.id ? "on" : ""}`} onClick={() => setFilter(f.id)}>
                  {f.label}<span className="n">{counts[f.id]}</span>
                </button>
              ))}
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="s-empty">
              <h3>Your bookshelf is empty</h3>
              <p>Set up your first title in three steps — details, content and pricing. You can save a draft at any point and come back later.</p>
              <Link href="/author/publish/new" className="s-btn s-btn-primary">Create your first title</Link>
            </div>
          ) : shown.length === 0 ? (
            <div className="s-empty"><p>No titles match these filters.</p></div>
          ) : (
            shown.map((r) => <ShelfRow key={r.key} row={r} onDelete={() => setConfirmDelete(r)} />)
          )}
        </div>

        <aside className="s-side">
          <div className="s-card s-card-pad">
            <h3 className="s-card-title">Recent activity</h3>
            {notifications.length === 0 ? (
              <p className="s-sub" style={{ marginTop: "0.5rem" }}>Updates about your books will appear here.</p>
            ) : (
              <ul className="s-list">
                {notifications.slice(0, 6).map((n: any) => (
                  <li key={n._id}>
                    {n.link ? <Link href={n.link} className="t">{n.title}</Link> : <div className="t">{n.title}</div>}
                    <div className="d">{timeAgo(n.createdAt)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="s-card s-card-pad">
            <h3 className="s-card-title">Publishing guides</h3>
            <ul className="s-list">
              <li><Link href="/author/help#manuscript" className="t">Preparing your manuscript</Link><div className="d">Formats, fonts and chapter headings</div></li>
              <li><Link href="/author/help#cover" className="t">Designing a cover that sells</Link><div className="d">Size, readability and thumbnails</div></li>
              <li><Link href="/author/help#pricing" className="t">Pricing & royalties</Link><div className="d">How much you earn per sale</div></li>
              <li><Link href="/author/help#review" className="t">What happens in review</Link><div className="d">Timelines and common fixes</div></li>
            </ul>
          </div>
        </aside>
      </div>

      {confirmDelete ? (
        <div className="s-modal-veil" role="dialog" aria-modal="true" onClick={() => !busy && setConfirmDelete(null)}>
          <div className="s-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this draft?</h3>
            <p className="s-muted">“{confirmDelete.title}” and its uploaded files will be removed from your bookshelf. This can’t be undone.</p>
            <div className="s-modal-actions">
              <button className="s-btn" disabled={busy} onClick={() => setConfirmDelete(null)}>Keep draft</button>
              <button className="s-btn s-btn-primary" style={{ background: "#b91c1c", borderColor: "#b91c1c" }} disabled={busy} onClick={() => deleteDraft(confirmDelete)}>
                {busy ? "Deleting…" : "Delete draft"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note?: React.ReactNode }) {
  return (
    <div className="s-kpi">
      <div className="s-kpi-label">{label}</div>
      <div className="s-kpi-value">{value}</div>
      {note ? <div className="s-kpi-note">{note}</div> : null}
    </div>
  );
}

function ShelfRow({ row, onDelete }: { row: Row; onDelete: () => void }) {
  const info = statusInfo(row.status);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const editable = row.kind === "submission" && canEdit(row.status);
  const editHref = row.id ? `/author/submissions/${row.id}/edit` : "";
  const detailHref = row.id ? `/author/submissions/${row.id}` : "";

  return (
    <div className="shelf-row">
      <div className="shelf-cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {row.cover ? <img src={row.cover} alt="" loading="lazy" /> : <span>No cover yet</span>}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="shelf-title">{row.title || "Untitled"}</div>
        {row.subtitle ? <div className="s-muted" style={{ fontSize: "0.88rem" }}>{row.subtitle}</div> : null}
        <div className="shelf-meta">
          {row.penName ? <span>by {row.penName}</span> : null}
          {row.seriesName ? <span>{row.seriesName}{row.seriesNumber ? ` · Book ${row.seriesNumber}` : ""}</span> : null}
          {row.price ? <span>{inr(row.price)}</span> : null}
          {row.code ? <span>{row.code}</span> : null}
          {row.updatedAt ? <span>Updated {timeAgo(row.updatedAt)}</span> : null}
        </div>
        <div className="shelf-status">
          <StatusPill status={row.status} />
          <span className="journey" title={JOURNEY.join(" → ")} aria-hidden="true">
            {JOURNEY.map((_, i) => (
              <span key={i} className={i < info.step ? (row.status === "CHANGES_REQUESTED" && i === info.step - 1 ? "warn" : "on") : ""} />
            ))}
          </span>
          <span>{row.status === "DRAFT" && typeof row.completeness === "number" ? `${row.completeness}% complete — ` : ""}{info.help}</span>
        </div>
      </div>
      <div className="shelf-actions">
        {row.status === "DRAFT" && editHref ? <Link href={editHref} className="s-btn s-btn-sm s-btn-primary">Continue setup</Link> : null}
        {row.status === "CHANGES_REQUESTED" && editHref ? <Link href={editHref} className="s-btn s-btn-sm s-btn-primary">Fix &amp; resubmit</Link> : null}
        {row.status === "PUBLISHED" && row.slug ? <Link href={`/product/${row.slug}`} className="s-btn s-btn-sm" target="_blank">View in store ↗</Link> : null}
        {row.status === "PUBLISHED" && row.slug ? <ShareLink slug={row.slug} title={row.title} /> : null}
        {!editable && detailHref && row.status !== "PUBLISHED" ? <Link href={detailHref} className="s-btn s-btn-sm">Track progress</Link> : null}
        {row.kind === "submission" ? (
          <div className="s-menu" ref={ref}>
            <button className="s-btn s-btn-sm s-btn-ghost" aria-label="More actions" aria-expanded={open} onClick={() => setOpen((v) => !v)}>•••</button>
            {open ? (
              <div className="s-menu-list">
                {editable ? <Link href={editHref}>Edit book details</Link> : null}
                {editable ? <Link href={`${editHref}?tab=content`}>Edit content</Link> : null}
                {editable ? <Link href={`${editHref}?tab=pricing`}>Edit pricing</Link> : null}
                {detailHref ? <Link href={detailHref}>View status &amp; history</Link> : null}
                {row.status === "PUBLISHED" ? <Link href="/author/reports">View sales report</Link> : null}
                {row.status === "DRAFT" ? <button className="s-btn-danger" onClick={() => { setOpen(false); onDelete(); }}>Delete draft</button> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Lets authors promote a live book in one tap: native share sheet on phones, WhatsApp link or copied URL elsewhere. */
function ShareLink({ slug, title }: { slug: string; title: string }) {
  const [msg, setMsg] = useState("");
  const share = async () => {
    const url = `${window.location.origin}/product/${slug}`;
    const text = `My book “${title}” is now available on Veeer Sukhadiya Books`;
    try {
      if (navigator.share) { await navigator.share({ title, text, url }); return; }
      await navigator.clipboard.writeText(`${text}: ${url}`);
      setMsg("Link copied");
      setTimeout(() => setMsg(""), 2000);
    } catch { /* cancelled */ }
  };
  return (
    <>
      <button type="button" className="s-btn s-btn-sm" onClick={share}>{msg || "Share"}</button>
      <a className="s-btn s-btn-sm s-btn-ghost" target="_blank" rel="noopener noreferrer"
        href={`https://wa.me/?text=${encodeURIComponent(`My book “${title}” is now available on Veeer Sukhadiya Books: ${absUrl(`/product/${slug}`)}`)}`}>WhatsApp</a>
    </>
  );
}
