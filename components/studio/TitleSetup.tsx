"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStudio, coverUrl } from "@/components/studio/StudioShell";
import PublishingAgreementDocument from "@/components/PublishingAgreementDocument";
import { trackMarketplaceEvent } from "@/lib/analytics";
import {
  AGE_GROUPS, AI_OPTIONS, CONTRIBUTOR_ROLES, COVER_EXTS, COVER_IDEAL, COVER_MAX_MB, COVER_MIN,
  DEFAULT_CATEGORIES, DEFAULT_LANGUAGES, DESCRIPTION_MAX, DESCRIPTION_MIN, EMPTY_FORM, MANUSCRIPT_EXTS,
  MANUSCRIPT_MAX_MB, MAX_CATEGORIES, MAX_KEYWORDS, canEdit, checkTabs, extOf, formFromSubmission,
  formatBytes, inr, royaltyFor, statusInfo, toFormData, type SetupForm, type BlobRef,
} from "@/lib/publishing";

type Tab = "details" | "content" | "pricing";
const TABS: { id: Tab; label: string }[] = [
  { id: "details", label: "Book details" },
  { id: "content", label: "Manuscript & cover" },
  { id: "pricing", label: "Pricing & publish" },
];

type Check = { level: "ok" | "warn" | "bad"; text: string };
type SavedFile = { originalName?: string; storagePath?: string; sizeBytes?: number; uploadedAt?: string } | null;

export default function TitleSetup({ submissionId }: { submissionId?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { data, token, reload, toast } = useStudio();
  const settings = data.platformSettings || {};
  const categories: string[] = settings.supportedCategories?.length ? settings.supportedCategories : DEFAULT_CATEGORIES;
  const languages: string[] = settings.supportedLanguages?.length ? settings.supportedLanguages : DEFAULT_LANGUAGES;
  const commission = Number(settings.platformCommissionPercentage ?? data.metrics?.activeCommissionRate ?? 15);
  const limits = { min: Number(settings.minBookPrice ?? 49), max: Number(settings.maxBookPrice ?? 9999) };
  const agreementVersion = data.agreementStatus?.activeAgreement?.version;

  const [id, setId] = useState<string | undefined>(submissionId);
  const [tab, setTab] = useState<Tab>((params?.get("tab") as Tab) || "details");
  const [form, setForm] = useState<SetupForm>({ ...EMPTY_FORM, penName: data.profile?.penName || "" });
  const [status, setStatus] = useState<string>("DRAFT");
  const [feedback, setFeedback] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(!!submissionId);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState<"" | "draft" | "submit">("");
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);

  // Files
  const [manuscript, setManuscript] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [savedManuscript, setSavedManuscript] = useState<SavedFile>(null);
  const [savedCover, setSavedCover] = useState<SavedFile>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverChecks, setCoverChecks] = useState<Check[]>([]);
  const [msChecks, setMsChecks] = useState<Check[]>([]);
  const [msPreview, setMsPreview] = useState<string | null>(null);

  // ── Load an existing title ──────────────────────────────────────
  useEffect(() => {
    if (!submissionId) {
      trackMarketplaceEvent("book_submission_started");
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/author/submissions/${submissionId}`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load this title");
        if (!alive) return;
        const s = json.submission;
        setForm(formFromSubmission(s));
        setStatus(s.status);
        setFeedback(s.adminFeedback || "");
        setCode(s.submissionId || "");
        setSavedManuscript(s.manuscriptFile?.storagePath ? s.manuscriptFile : null);
        setSavedCover(s.coverFile?.storagePath ? s.coverFile : null);
        setCoverPreview(coverUrl(s));
      } catch (e) {
        if (alive) setLoadError(e instanceof Error ? e.message : "Could not load this title");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [submissionId, token]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = useCallback(<K extends keyof SetupForm>(k: K, v: SetupForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  }, []);

  const files = { manuscript: !!(manuscript || savedManuscript), cover: !!(cover || savedCover) };
  const checks = checkTabs(form, files, limits);
  const editable = canEdit(status);
  const isResubmit = status === "CHANGES_REQUESTED";
  const totalItems = 11;
  const missingCount = checks.details.missing.length + checks.content.missing.length + checks.pricing.missing.length;
  const pct = Math.max(0, Math.round(((totalItems - Math.min(totalItems, missingCount)) / totalItems) * 100));

  // ── Files ───────────────────────────────────────────────────────
  const pickCover = (file: File | null) => {
    if (!file) return;
    const c: Check[] = [];
    if (!COVER_EXTS.includes(extOf(file.name))) {
      setCoverChecks([{ level: "bad", text: "Use a JPG, PNG or WEBP image." }]);
      return;
    }
    if (file.size > COVER_MAX_MB * 1024 * 1024) {
      setCoverChecks([{ level: "bad", text: `The image is ${formatBytes(file.size)} — please keep it under ${COVER_MAX_MB} MB.` }]);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight, ratio = h / w;
      if (w < COVER_MIN.width || h < COVER_MIN.height) c.push({ level: "bad", text: `Too small (${w}×${h}px). Covers need at least ${COVER_MIN.width}×${COVER_MIN.height}px.` });
      else if (w < COVER_IDEAL.width || h < COVER_IDEAL.height) c.push({ level: "warn", text: `${w}×${h}px works, but ${COVER_IDEAL.width}×${COVER_IDEAL.height}px looks sharper on large screens.` });
      else c.push({ level: "ok", text: `${w}×${h}px — great resolution.` });
      if (ratio < 1.45 || ratio > 1.75) c.push({ level: "warn", text: `Aspect ratio is ${ratio.toFixed(2)}:1. Portrait covers around 1.6:1 display best.` });
      else c.push({ level: "ok", text: "Portrait shape fits the store and reader." });
      c.push({ level: "ok", text: `${extOf(file.name).slice(1).toUpperCase()}, ${formatBytes(file.size)}` });
      setCoverChecks(c);
      if (c.some((x) => x.level === "bad")) { URL.revokeObjectURL(url); return; }
      setCover(file);
      setCoverPreview(url);
      setDirty(true);
      trackMarketplaceEvent("cover_uploaded");
    };
    img.onerror = () => setCoverChecks([{ level: "bad", text: "We couldn’t read this image. Try exporting it again as JPG or PNG." }]);
    img.src = url;
  };

  const pickManuscript = async (file: File | null) => {
    if (!file) return;
    const ext = extOf(file.name);
    if (!MANUSCRIPT_EXTS.includes(ext)) {
      setMsChecks([{ level: "bad", text: "Upload a PDF, DOCX, DOC, EPUB, RTF or TXT file." }]);
      return;
    }
    if (file.size > MANUSCRIPT_MAX_MB * 1024 * 1024) {
      setMsChecks([{ level: "bad", text: `The file is ${formatBytes(file.size)} — the limit is ${MANUSCRIPT_MAX_MB} MB. Compress images and try again.` }]);
      return;
    }
    const c: Check[] = [{ level: "ok", text: `${ext.slice(1).toUpperCase()} file, ${formatBytes(file.size)}` }];
    if (ext === ".pdf") {
      try {
        const text = await file.slice(0, Math.min(file.size, 20 * 1024 * 1024)).text();
        const pages = (text.match(/\/Type\s*\/Page(?!s)/g) || []).length;
        if (pages) c.push({ level: pages < 10 ? "warn" : "ok", text: pages < 10 ? `Only about ${pages} pages — make sure this is the complete book.` : `About ${pages} pages detected.` });
      } catch { /* page count is optional */ }
      if (msPreview) URL.revokeObjectURL(msPreview);
      setMsPreview(URL.createObjectURL(file));
    } else {
      setMsPreview(null);
      if (ext === ".txt") c.push({ level: "warn", text: "Plain text loses formatting. A DOCX or PDF gives our formatters more to work with." });
    }
    setMsChecks(c);
    setManuscript(file);
    setDirty(true);
    trackMarketplaceEvent("manuscript_uploaded");
  };

  // ── Save ────────────────────────────────────────────────────────
  const save = async (action: "draft" | "submit" | "resubmit", nextTab?: Tab) => {
    setError("");
    if (!form.title.trim()) {
      setTab("details");
      setShowErrors(true);
      setError("Add a book title before saving.");
      return false;
    }
    if (action !== "draft" && !checks.ready) {
      setShowErrors(true);
      const first: Tab = !checks.details.done ? "details" : !checks.content.done ? "content" : "pricing";
      setTab(first);
      setError("A few things are still missing — they’re highlighted below.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }
    setSaving(action === "draft" ? "draft" : "submit");
    try {
      // Large files go straight to cloud storage when it's configured (no 4.5 MB server limit).
      let manuscriptBlob: BlobRef | null = null;
      let coverBlob: BlobRef | null = null;
      if ((manuscript || cover) && (await directUploadsEnabled())) {
        if (cover) coverBlob = await uploadDirect(cover, "covers", token || "", (p) => setUploadPct(p));
        if (manuscript) manuscriptBlob = await uploadDirect(manuscript, "manuscripts", token || "", (p) => setUploadPct(p));
        setUploadPct(null);
      }
      const body = toFormData(form, action, { manuscript, cover, manuscriptBlob, coverBlob }, agreementVersion);
      const res = await fetch(id ? `/api/author/submissions/${id}` : "/api/author/submissions", {
        method: id ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (res.status === 413) throw new Error("That upload is too large for the server. Please compress the file (under 4 MB) and try again, or ask the site owner to turn on large uploads.");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Saving failed — please try again.");
      const s = json.submission;
      setDirty(false);
      setManuscript(null);
      setCover(null);
      if (s) {
        setStatus(s.status);
        setCode(s.submissionId || code);
        setSavedManuscript(s.manuscriptFile?.storagePath ? s.manuscriptFile : savedManuscript);
        setSavedCover(s.coverFile?.storagePath ? s.coverFile : savedCover);
      }
      reload();
      if (action !== "draft") {
        trackMarketplaceEvent(action === "resubmit" ? "submission_resubmitted" : "submission_submitted");
        toast(action === "resubmit" ? "Resubmitted — our editors will take another look." : "Submitted for review 🎉");
        router.push(s?._id ? `/author/submissions/${s._id}` : "/author/dashboard");
        return true;
      }
      toast("Draft saved");
      const newId = s?._id || id;
      if (!id && newId) {
        setId(newId);
        router.replace(`/author/submissions/${newId}/edit?tab=${nextTab || tab}`);
      }
      if (nextTab) { setTab(nextTab); window.scrollTo({ top: 0, behavior: "smooth" }); }
      return true;
    } catch (e) {
      setUploadPct(null);
      setError(e instanceof Error ? e.message : "Saving failed — please try again.");
      return false;
    } finally {
      setSaving("");
    }
  };

  const goTab = (t: Tab) => { setTab(t); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const tabIndex = TABS.findIndex((t) => t.id === tab);
  const nextTab = TABS[tabIndex + 1]?.id;
  const prevTab = TABS[tabIndex - 1]?.id;

  if (loading) return <div className="s-card s-empty"><p>Loading title…</p></div>;
  if (loadError) {
    return (
      <div className="s-card s-empty">
        <h3>We couldn’t open this title</h3>
        <p>{loadError}</p>
        <Link href="/author/dashboard" className="s-btn s-btn-primary">Back to Bookshelf</Link>
      </div>
    );
  }

  const tabState = (t: Tab) => (t === "details" ? checks.details : t === "content" ? checks.content : checks.pricing);
  const miss = (t: Tab, item: string) => showErrors && tabState(t).missing.some((m) => m.startsWith(item));

  return (
    <>
      <div className="setup-top">
        <div>
          <div className="setup-crumb"><Link href="/author/dashboard">Bookshelf</Link> / {id ? "Edit title" : "New title"}{code ? ` · ${code}` : ""}</div>
          <h1 className="setup-title">{form.title.trim() || "Untitled book"}</h1>
        </div>
        <span className={`s-pill tone-${statusInfo(status).tone}`}>{statusInfo(status).label}</span>
      </div>

      {!editable ? (
        <div className="s-alert s-alert-info">
          <div className="s-alert-body">
            <b>This title is {statusInfo(status).label.toLowerCase()}</b>
            You can’t edit it while it’s with our editors. {statusInfo(status).help}
          </div>
          {id ? <Link href={`/author/submissions/${id}`} className="s-btn s-btn-sm">Track progress</Link> : null}
        </div>
      ) : null}

      {isResubmit && feedback ? (
        <div className="s-alert s-alert-warn">
          <div className="s-alert-body"><b>Editor’s notes</b>{feedback}</div>
        </div>
      ) : null}

      {error ? <div className="s-alert s-alert-bad" role="alert"><div className="s-alert-body">{error}</div></div> : null}

      <div className="setup-tabs" role="tablist">
        {TABS.map((t, i) => {
          const st = tabState(t.id);
          return (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={`setup-tab ${tab === t.id ? "on" : ""} ${st.done ? "done" : ""}`} onClick={() => goTab(t.id)}>
              <span className="num">{st.done ? "✓" : i + 1}</span>
              <span>
                <span className="lbl">{t.label}</span>
                <span className="st">{st.done ? "Complete" : `${st.missing.length} item${st.missing.length === 1 ? "" : "s"} left`}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="setup-layout">
        <fieldset disabled={!editable} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <div className="s-card">
            {tab === "details" && (
              <>
                <Section title="Language" help="The language your book is written in.">
                  <select className="s-select" value={form.language} onChange={(e) => set("language", e.target.value)}>
                    {languages.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </Section>

                <Section title="Title" help="Enter it exactly as it appears on your cover. You can’t change the title after the book is live.">
                  <div className="s-field">
                    <label className="s-label" htmlFor="f-title">Book title</label>
                    <input id="f-title" className={`s-input ${miss("details", "Book title") ? "err" : ""}`} value={form.title} maxLength={200} onChange={(e) => set("title", e.target.value)} placeholder="e.g. The Shattered Sky" />
                  </div>
                  <div className="s-field">
                    <label className="s-label" htmlFor="f-sub">Subtitle <span className="opt">(optional)</span></label>
                    <input id="f-sub" className="s-input" value={form.subtitle} maxLength={200} onChange={(e) => set("subtitle", e.target.value)} placeholder="e.g. A Young Adult Fantasy Adventure" />
                  </div>
                </Section>

                <Section title="Series" optional help="Part of a series? Readers can find all your books in order.">
                  <div className="s-row-3">
                    <div className="s-field"><label className="s-label">Series name</label><input className="s-input" value={form.seriesName} onChange={(e) => set("seriesName", e.target.value)} placeholder="e.g. The Sky Chronicles" /></div>
                    <div className="s-field"><label className="s-label">Book number</label><input className="s-input" type="number" min={1} value={form.seriesNumber} onChange={(e) => set("seriesNumber", e.target.value)} placeholder="1" /></div>
                  </div>
                </Section>

                <Section title="Edition" optional help="Use this for a revised or expanded edition.">
                  <input className="s-input" style={{ maxWidth: 260 }} value={form.edition} onChange={(e) => set("edition", e.target.value)} placeholder="e.g. 2nd edition" />
                </Section>

                <Section title="Author" help="The name readers will see. This can be a pen name.">
                  <div className="s-field">
                    <label className="s-label">Primary author</label>
                    <input className={`s-input ${miss("details", "Author") ? "err" : ""}`} value={form.penName} onChange={(e) => set("penName", e.target.value)} />
                  </div>
                  <label className="s-label">Contributors <span className="opt">(optional)</span></label>
                  {form.contributors.map((c, i) => (
                    <div className="contrib-row" key={i}>
                      <select className="s-select" value={c.role} onChange={(e) => set("contributors", form.contributors.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))}>
                        {CONTRIBUTOR_ROLES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                      <input className="s-input" value={c.name} placeholder="Full name" onChange={(e) => set("contributors", form.contributors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                      <button type="button" className="icon-btn" aria-label="Remove contributor" onClick={() => set("contributors", form.contributors.filter((_, j) => j !== i))}>×</button>
                    </div>
                  ))}
                  {form.contributors.length < 10 ? (
                    <button type="button" className="s-btn s-btn-sm" onClick={() => set("contributors", [...form.contributors, { role: "Co-author", name: "" }])}>+ Add contributor</button>
                  ) : null}
                </Section>

                <Section title="Description" help="This appears on your book’s store page. Hook readers in the first two lines, then tell them what they’ll get.">
                  <textarea
                    className={`s-textarea ${miss("details", "Description") ? "err" : ""}`}
                    rows={9}
                    value={form.description}
                    maxLength={DESCRIPTION_MAX + 200}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder={"Start with a strong hook…\n\nLeave a blank line between paragraphs."}
                  />
                  <div className="s-hint">
                    <span>{form.description.trim().length < DESCRIPTION_MIN ? `Aim for at least ${DESCRIPTION_MIN} characters — detailed descriptions sell better.` : "Looks good. Blank lines become paragraphs."}</span>
                    <span className={form.description.length > DESCRIPTION_MAX ? "over" : ""}>{form.description.length.toLocaleString()} / {DESCRIPTION_MAX.toLocaleString()}</span>
                  </div>
                </Section>

                <Section title="Publishing rights" help="Only publish work you have the rights to. Public-domain books must add something original, like a translation or annotations.">
                  <div className="s-radio-group" style={{ marginBottom: "0.8rem" }}>
                    <Radio on={form.publishingRights === "own_copyright"} onClick={() => set("publishingRights", "own_copyright")} title="I own the copyright" text="I wrote this book or hold the necessary publishing rights." />
                    <Radio on={form.publishingRights === "public_domain"} onClick={() => set("publishingRights", "public_domain")} title="This is a public-domain work" text="The original text is out of copyright; I’ve added original content." />
                  </div>
                  <label className="s-check" style={miss("details", "Publishing rights") ? { color: "#b91c1c" } : undefined}>
                    <input type="checkbox" checked={form.rightsConfirmed} onChange={(e) => set("rightsConfirmed", e.target.checked)} />
                    <span>I confirm I have all the rights needed to publish and sell this book, including its text, images and cover.</span>
                  </label>
                </Section>

                <Section title="Primary audience" help="Helps us show your book to the right readers and keep the store safe for children.">
                  <div className="s-field">
                    <label className="s-label">Reading age</label>
                    <select className={`s-select ${miss("details", "Primary audience") ? "err" : ""}`} value={form.ageGroup} onChange={(e) => set("ageGroup", e.target.value)}>
                      <option value="">Select an age group</option>
                      {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <label className="s-check">
                    <input type="checkbox" checked={form.matureContent} onChange={(e) => set("matureContent", e.target.checked)} />
                    <span>This book contains mature themes (graphic violence, sexual content or strong language).</span>
                  </label>
                </Section>

                <Section title="Categories" help={`Choose up to ${MAX_CATEGORIES}. Your first pick is the main shelf your book appears on.`}>
                  <div className="cat-grid" style={miss("details", "At least one category") ? { outline: "1px solid #b91c1c", borderRadius: 8, padding: 4 } : undefined}>
                    {categories.map((c) => {
                      const idx = form.categories.indexOf(c);
                      const on = idx >= 0;
                      const dis = !on && form.categories.length >= MAX_CATEGORIES;
                      return (
                        <label key={c} className={`cat-opt ${on ? "on" : ""} ${dis ? "dis" : ""}`}>
                          <input type="checkbox" checked={on} disabled={dis} onChange={() => set("categories", on ? form.categories.filter((x) => x !== c) : [...form.categories, c])} />
                          {c}
                          {on ? <span className="rank">{idx === 0 ? "MAIN" : `#${idx + 1}`}</span> : null}
                        </label>
                      );
                    })}
                  </div>
                </Section>

                <Section title="Keywords" optional help={`Up to ${MAX_KEYWORDS} words or short phrases readers might search for — themes, setting, character types. Don’t repeat your title or category.`}>
                  <div className="kw-grid">
                    {form.keywords.map((k, i) => (
                      <input key={i} className="s-input" value={k} maxLength={50} placeholder={`Keyword ${i + 1}`} onChange={(e) => set("keywords", form.keywords.map((x, j) => (j === i ? e.target.value : x)))} />
                    ))}
                  </div>
                </Section>

                <Section title="AI-generated content" help="We ask every author so readers know how a book was made. This isn’t shown on your store page unless content was AI-generated.">
                  <div className="s-row">
                    <div className="s-field">
                      <label className="s-label">Text</label>
                      <select className="s-select" value={form.aiText} onChange={(e) => set("aiText", e.target.value as any)}>
                        {AI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label} — {o.help}</option>)}
                      </select>
                    </div>
                    <div className="s-field">
                      <label className="s-label">Images &amp; cover</label>
                      <select className="s-select" value={form.aiImages} onChange={(e) => set("aiImages", e.target.value as any)}>
                        {AI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label} — {o.help}</option>)}
                      </select>
                    </div>
                  </div>
                </Section>
              </>
            )}

            {tab === "content" && (
              <>
                <Section title="Manuscript" help={`Upload the complete, final text. Accepted: PDF, DOCX, DOC, EPUB, RTF, TXT — up to ${MANUSCRIPT_MAX_MB} MB. Our team formats it for the web reader.`}>
                  <DropZone accept={MANUSCRIPT_EXTS.join(",")} onFile={pickManuscript} error={miss("content", "Manuscript")}>
                    <b>{manuscript || savedManuscript ? "Replace manuscript" : "Upload manuscript"}</b>
                    <p>Drag a file here or click to browse</p>
                  </DropZone>
                  {manuscript || savedManuscript ? (
                    <div className="file-card" style={{ marginTop: "0.75rem" }}>
                      <div className="ic">{extOf((manuscript?.name || savedManuscript?.originalName || ".doc")).slice(1).toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="nm">{manuscript?.name || savedManuscript?.originalName}</div>
                        <div className="mt">{manuscript ? `${formatBytes(manuscript.size)} · not saved yet` : `${formatBytes(savedManuscript?.sizeBytes)} · uploaded`}</div>
                      </div>
                      {msPreview ? <a href={msPreview} target="_blank" rel="noreferrer" className="s-btn s-btn-sm">Preview</a> : null}
                    </div>
                  ) : null}
                  {msChecks.length ? <CheckList items={msChecks} /> : null}
                  <p className="s-sub" style={{ marginTop: "0.75rem" }}>Tip: use real headings for chapter titles and remove blank pages — it makes your book easier to navigate in the reader.</p>
                </Section>

                <Section title="Cover" help={`JPG, PNG or WEBP, up to ${COVER_MAX_MB} MB. Ideal size ${COVER_IDEAL.width}×${COVER_IDEAL.height}px (1.6:1), at least ${COVER_MIN.width}×${COVER_MIN.height}px.`}>
                  <div className="cover-wrap">
                    <div className="cover-mock">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {coverPreview ? <img src={coverPreview} alt="Cover preview" /> : <span>Your cover will appear here</span>}
                    </div>
                    <div>
                      <DropZone accept={COVER_EXTS.join(",")} onFile={pickCover} error={miss("content", "Book cover")}>
                        <b>{cover || savedCover ? "Replace cover" : "Upload cover"}</b>
                        <p>Drag an image here or click to browse</p>
                      </DropZone>
                      {coverChecks.length ? <CheckList items={coverChecks} /> : null}
                      <ul className="checks" style={{ color: "#57534e" }}>
                        <li><span className="ok">•</span>Make the title readable at thumbnail size.</li>
                        <li><span className="ok">•</span>Only the front cover — no spine or back cover.</li>
                        <li><span className="ok">•</span>Avoid borders, prices or “bestseller” badges.</li>
                      </ul>
                    </div>
                  </div>
                </Section>

                <Section title="ISBN" optional help="An ISBN isn’t required for web-reader books. If you have one for this edition, add it here.">
                  <input className="s-input" style={{ maxWidth: 300 }} value={form.isbn} onChange={(e) => set("isbn", e.target.value.replace(/[^0-9Xx-]/g, ""))} placeholder="978-…" />
                </Section>

                <Section title="Free preview" help="Readers can try the first part of your book before buying. A good sample ends on a hook.">
                  <input type="range" className="range" min={5} max={20} step={1} value={form.previewPercent} onChange={(e) => set("previewPercent", Number(e.target.value))} aria-label="Free preview size" />
                  <div className="s-hint"><span>5%</span><b style={{ color: "#1c1917" }}>First {form.previewPercent}% of the book</b><span>20%</span></div>
                </Section>
              </>
            )}

            {tab === "pricing" && (
              <PricingTab form={form} set={set} commission={commission} limits={limits} miss={(i: string) => miss("pricing", i)} onShowAgreement={() => setShowAgreement(true)} agreementAccepted={!!data.agreementStatus?.isAccepted} isResubmit={isResubmit} />
            )}
          </div>
        </fieldset>

        <aside className="setup-aside">
          <div className="s-card s-card-pad">
            <div style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
              <div className="sum-cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {coverPreview ? <img src={coverPreview} alt="" /> : null}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--serif)", fontWeight: 700, lineHeight: 1.25 }}>{form.title.trim() || "Untitled book"}</div>
                <div className="s-sub">{form.penName || "Author"}</div>
                {Number(form.desiredPrice) ? <div style={{ fontWeight: 800, marginTop: "0.4rem" }}>{inr(Number(form.desiredPrice))}</div> : null}
              </div>
            </div>
            <div style={{ margin: "1rem 0 0.4rem", display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
              <b>Setup progress</b><span className="s-sub">{pct}%</span>
            </div>
            <div className="meter"><div style={{ width: `${pct}%` }} /></div>
            <ul className="sum-list" style={{ marginTop: "0.9rem" }}>
              {TABS.map((t) => {
                const st = tabState(t.id);
                return (
                  <li key={t.id}>
                    <span className={st.done ? "ok" : "no"}>{st.done ? "✓" : "○"}</span>
                    <span>
                      <button className="s-link" style={{ textDecoration: "none", color: "#1c1917" }} onClick={() => goTab(t.id)}>{t.label}</button>
                      {!st.done ? <span className="s-sub" style={{ display: "block" }}>Missing: {st.missing.join(", ")}</span> : null}
                    </span>
                  </li>
                );
              })}
            </ul>
            <hr style={{ border: 0, borderTop: "1px solid #efebe3", margin: "1rem 0" }} />
            <div className="s-sub">You earn</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#15803d" }}>{inr(royaltyFor(Number(form.desiredPrice) || 0, commission).earn, 2)} <span className="s-sub" style={{ fontWeight: 500 }}>per sale</span></div>
          </div>
        </aside>
      </div>

      {editable ? (
        <div className="setup-foot">
          <div className="setup-foot-inner">
            <span className="grow">{dirty ? "You have unsaved changes" : id ? "All changes saved" : "Nothing saved yet"}</span>
            <button className="s-btn" disabled={!!saving} onClick={() => save("draft")}>{saving === "draft" ? (uploadPct !== null ? `Uploading ${uploadPct}%…` : "Saving…") : "Save as draft"}</button>
            {prevTab ? <button className="s-btn s-btn-ghost" onClick={() => goTab(prevTab)}>← Back</button> : null}
            {nextTab ? (
              <button className="s-btn s-btn-primary" disabled={!!saving} onClick={() => (dirty || !id ? save("draft", nextTab) : goTab(nextTab))}>
                {saving === "draft" ? (uploadPct !== null ? `Uploading ${uploadPct}%…` : "Saving…") : "Save and continue →"}
              </button>
            ) : (
              <button className="s-btn s-btn-accent" disabled={!!saving} onClick={() => save(isResubmit ? "resubmit" : "submit")}>
                {saving === "submit" ? (uploadPct !== null ? `Uploading ${uploadPct}%…` : "Submitting…") : isResubmit ? "Resubmit for review" : "Submit for review"}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {showAgreement ? (
        <div className="s-modal-veil" role="dialog" aria-modal="true" onClick={() => setShowAgreement(false)}>
          <div className="s-modal" style={{ maxWidth: 820, maxHeight: "85vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <h3>Digital Publishing Agreement</h3>
            <PublishingAgreementDocument />
            <div className="s-modal-actions">
              <button className="s-btn" onClick={() => setShowAgreement(false)}>Close</button>
              <button className="s-btn s-btn-primary" onClick={() => { set("termsAccepted", true); set("accurateInfoConfirmed", true); setShowAgreement(false); }}>I agree</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PricingTab({ form, set, commission, limits, miss, onShowAgreement, agreementAccepted, isResubmit }: {
  form: SetupForm;
  set: <K extends keyof SetupForm>(k: K, v: SetupForm[K]) => void;
  commission: number;
  limits: { min: number; max: number };
  miss: (item: string) => boolean;
  onShowAgreement: () => void;
  agreementAccepted: boolean;
  isResubmit: boolean;
}) {
  const [copies, setCopies] = useState(25);
  const price = Number(form.desiredPrice) || 0;
  const r = royaltyFor(price, commission);
  const mrp = Number(form.actualPrice) || 0;
  const discount = mrp > price && price > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const today = useMemo(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toISOString().slice(0, 10);
  }, []);

  return (
    <>
      <Section title="List price" help={`Set a price between ${inr(limits.min)} and ${inr(limits.max)}. Most books on our store sell for ₹99–₹249.`}>
        <div className="s-row">
          <div className="s-field">
            <label className="s-label">Your price (INR)</label>
            <div className="price-input"><span>₹</span><input className={`s-input ${miss("List price") || miss("Price between") ? "err" : ""}`} type="number" min={limits.min} max={limits.max} value={form.desiredPrice} onChange={(e) => set("desiredPrice", e.target.value)} placeholder="149" /></div>
          </div>
          <div className="s-field">
            <label className="s-label">Original price <span className="opt">(optional, shown struck-through)</span></label>
            <div className="price-input"><span>₹</span><input className={`s-input ${miss("Original price") ? "err" : ""}`} type="number" min={0} value={form.actualPrice} onChange={(e) => set("actualPrice", e.target.value)} placeholder="199" /></div>
          </div>
        </div>
        {discount ? <p className="s-sub">Readers will see <b>{discount}% off</b> on your store page.</p> : null}
      </Section>

      <Section title="Royalties" help="You keep the rest of every sale after the platform fee. Taxes and payment processing are covered by the platform fee.">
        <div className="royalty">
          <table>
            <thead><tr><th>Per sale</th><th className="num">Amount</th></tr></thead>
            <tbody>
              <tr><td>List price</td><td className="num">{inr(r.price, 2)}</td></tr>
              <tr><td>Platform fee ({commission}%)</td><td className="num">− {inr(r.fee, 2)}</td></tr>
              <tr className="total"><td>You earn ({r.rate}%)</td><td className="num">{inr(r.earn, 2)}</td></tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <label className="s-label">Estimate: if you sell <b>{copies}</b> copies a month</label>
          <input type="range" className="range" min={1} max={500} value={copies} onChange={(e) => setCopies(Number(e.target.value))} aria-label="Copies per month" />
          <div style={{ fontSize: "1.05rem" }}>≈ <b style={{ color: "#15803d" }}>{inr(r.earn * copies)}</b> a month · <b>{inr(r.earn * copies * 12)}</b> a year</div>
          <p className="s-sub">An illustration only — actual sales vary.</p>
        </div>
      </Section>

      <Section title="Promotions" help="Bundles and offers help new readers discover you. You still earn your share of the bundle price.">
        <label className="s-check">
          <input type="checkbox" checked={form.bundleEligible} onChange={(e) => set("bundleEligible", e.target.checked)} />
          <span>Include my book in store bundles and limited-time offers</span>
        </label>
      </Section>

      <Section title="Release" help="Choose when your book goes on sale once it’s approved.">
        <div className="s-radio-group">
          <Radio on={form.releaseOption === "on_approval"} onClick={() => set("releaseOption", "on_approval")} title="Publish as soon as it’s approved" text="Usually 3–5 working days after you submit." />
          <Radio on={form.releaseOption === "scheduled"} onClick={() => set("releaseOption", "scheduled")} title="Schedule a release date" text="Great for launches — at least 7 days from today." />
        </div>
        {form.releaseOption === "scheduled" ? (
          <div className="s-field" style={{ marginTop: "0.75rem", maxWidth: 240 }}>
            <label className="s-label">Release date</label>
            <input type="date" className={`s-input ${miss("Release date") ? "err" : ""}`} min={today} value={form.scheduledReleaseDate} onChange={(e) => set("scheduledReleaseDate", e.target.value)} />
          </div>
        ) : null}
      </Section>

      {isResubmit ? (
        <Section title="Note to the editor" optional help="Tell our editors what you changed.">
          <textarea className="s-textarea" rows={3} value={form.authorNotes} onChange={(e) => set("authorNotes", e.target.value)} placeholder="e.g. Replaced the cover and fixed the chapter headings." />
        </Section>
      ) : null}

      <Section title="Terms" help="Your book is reviewed by our editorial team before it goes live.">
        <label className="s-check" style={miss("Accept the publishing agreement") ? { color: "#b91c1c" } : undefined}>
          <input type="checkbox" checked={form.termsAccepted} onChange={(e) => { set("termsAccepted", e.target.checked); set("accurateInfoConfirmed", e.target.checked); }} />
          <span>
            I agree to the <button type="button" className="s-link" onClick={onShowAgreement}>Digital Publishing Agreement</button> and confirm the information I’ve entered is accurate. I keep full copyright of my work.
          </span>
        </label>
        {agreementAccepted ? <p className="s-sub" style={{ marginTop: "0.5rem" }}>You’ve already accepted the current agreement on your account.</p> : null}
      </Section>
    </>
  );
}

function Section({ title, help, optional, children }: { title: string; help?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <section className="setup-section">
      <div className="sl">
        <h3>{title} {optional ? <span className="opt">(optional)</span> : null}</h3>
        {help ? <p>{help}</p> : null}
      </div>
      <div style={{ minWidth: 0 }}>{children}</div>
    </section>
  );
}

function Radio({ on, onClick, title, text }: { on: boolean; onClick: () => void; title: string; text: string }) {
  return (
    <label className={`s-radio ${on ? "on" : ""}`}>
      <input type="radio" checked={on} onChange={onClick} />
      <span><b>{title}</b><span>{text}</span></span>
    </label>
  );
}

function CheckList({ items }: { items: Check[] }) {
  return (
    <ul className="checks">
      {items.map((c, i) => (
        <li key={i}><span className={c.level === "ok" ? "ok" : c.level === "warn" ? "wn" : "bd"}>{c.level === "ok" ? "✓" : c.level === "warn" ? "!" : "×"}</span><span>{c.text}</span></li>
      ))}
    </ul>
  );
}

function DropZone({ accept, onFile, error, children }: { accept: string; onFile: (f: File | null) => void; error?: boolean; children: React.ReactNode }) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div
      className={`drop ${over ? "over" : ""}`}
      style={error ? { borderColor: "#b91c1c" } : undefined}
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.current?.click(); } }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer.files?.[0] || null); }}
    >
      {children}
      <input ref={input} type="file" accept={accept} hidden onChange={(e) => { onFile(e.target.files?.[0] || null); e.target.value = ""; }} />
    </div>
  );
}

// ── Direct uploads (Vercel Blob) ───────────────────────────────────
let directCache: boolean | null = null;
async function directUploadsEnabled() {
  if (directCache !== null) return directCache;
  try {
    const r = await fetch("/api/author/uploads");
    directCache = r.ok ? Boolean((await r.json()).enabled) : false;
  } catch {
    directCache = false;
  }
  return directCache;
}

async function uploadDirect(file: File, folder: "covers" | "manuscripts", token: string, onPct: (p: number) => void): Promise<BlobRef> {
  const { upload } = await import("@vercel/blob/client");
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "").slice(-80) || "file";
  const res = await upload(`${folder}/${safe}`, file, {
    access: "public",
    handleUploadUrl: "/api/author/uploads",
    headers: { Authorization: `Bearer ${token}` },
    multipart: file.size > 8 * 1024 * 1024,
    onUploadProgress: ({ percentage }) => onPct(Math.round(percentage)),
  });
  return { url: res.url, pathname: res.pathname, originalName: file.name, size: file.size, contentType: file.type || res.contentType || "application/octet-stream" };
}
