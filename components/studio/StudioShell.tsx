"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { statusInfo } from "@/lib/publishing";
import "./studio.css";

export type StudioData = {
  hasProfile: boolean;
  profile: any;
  metrics: Record<string, any>;
  submissions: any[];
  publishedBooks: any[];
  salesLedger: any[];
  notifications: any[];
  platformSettings?: any;
  agreementStatus?: { isAccepted: boolean; acceptedRecord: any; activeAgreement: any };
};

type Ctx = {
  data: StudioData;
  token: string;
  reload: () => Promise<void>;
  toast: (msg: string) => void;
};

const StudioCtx = createContext<Ctx | null>(null);

export function useStudio() {
  const ctx = useContext(StudioCtx);
  if (!ctx) throw new Error("useStudio must be used inside <StudioShell>");
  return ctx;
}

// Keep the last dashboard payload in memory so moving between studio pages is instant.
let cache: { token: string; data: StudioData; at: number } | null = null;

const NAV = [
  { href: "/author/dashboard", label: "Bookshelf" },
  { href: "/author/reports", label: "Reports" },
  { href: "/author/promote", label: "Promote" },
  { href: "/author/payments", label: "Payments" },
  { href: "/author/account", label: "Account" },
  { href: "/author/help", label: "Help" },
];

export default function StudioShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const pathname = usePathname() || "";
  const { isLoggedIn, token, isReady, refreshAuthorStatus } = useAuth();
  const { show } = useModal();
  const [data, setData] = useState<StudioData | null>(cache && cache.token === token ? cache.data : null);
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const res = await fetch("/api/author/dashboard", { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.status === 401 || json?.authenticated === false) {
        localStorage.removeItem("auth_token");
        await refreshAuthorStatus();
        return;
      }
      if (!res.ok) throw new Error(json?.error || "Could not load your studio");
      cache = { token, data: json, at: Date.now() };
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your studio");
    } finally {
      setLoading(false);
    }
  }, [token, refreshAuthorStatus]);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn || !token) { setLoading(false); return; }
    const fresh = cache && cache.token === token && Date.now() - cache.at < 20_000;
    if (!fresh) load();
  }, [isReady, isLoggedIn, token, load]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(""), 3200);
  }, []);

  const active = NAV.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"))?.href
    || (pathname.startsWith("/author/publish") || pathname.startsWith("/author/submissions") ? "/author/dashboard" : "");

  const bar = (
    <div className="studio-bar">
      <div className="studio-bar-inner">
        <Link href="/author/dashboard" className="studio-brand">
          Author Studio <i>Beta</i>
        </Link>
        <nav className="studio-nav" aria-label="Author Studio">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={active === n.href ? "on" : ""}>{n.label}</Link>
          ))}
        </nav>
        {isLoggedIn && data?.hasProfile ? (
          <Link href="/author/publish/new" className="s-btn s-btn-accent s-btn-sm">+ Create new title</Link>
        ) : null}
      </div>
    </div>
  );

  let body: ReactNode;
  if (!isReady || (loading && !data)) {
    body = <div className="s-card s-empty"><p>Loading your studio…</p></div>;
  } else if (!isLoggedIn) {
    body = (
      <div className="s-card s-empty">
        <h3>Sign in to Author Studio</h3>
        <p>Publish your books, track sales and royalties, and manage payouts — all in one place.</p>
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="s-btn s-btn-primary" onClick={() => show("login")}>Sign in</button>
          <button className="s-btn" onClick={() => show("signup")}>Create an account</button>
        </div>
      </div>
    );
  } else if (error && !data) {
    body = (
      <div className="s-card s-empty">
        <h3>We couldn’t load your studio</h3>
        <p>{error}</p>
        <button className="s-btn s-btn-primary" onClick={() => { setLoading(true); load(); }}>Try again</button>
      </div>
    );
  } else if (data && !data.hasProfile) {
    body = (
      <div className="s-card s-empty">
        <h3>Set up your author profile</h3>
        <p>Tell readers who you are and where to send your royalties. It takes about two minutes, and then you can publish your first book.</p>
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/author/setup" className="s-btn s-btn-primary">Set up author profile</Link>
          <Link href="/publish" className="s-btn">How publishing works</Link>
        </div>
      </div>
    );
  } else if (data) {
    body = (
      <StudioCtx.Provider value={{ data, token: token || "", reload: load, toast }}>
        {children}
      </StudioCtx.Provider>
    );
  }

  return (
    <div className="studio">
      {bar}
      <div className="studio-main" style={wide ? { maxWidth: 1320 } : undefined}>{body}</div>
      {toastMsg ? <div className="s-toast" role="status">{toastMsg}</div> : null}
    </div>
  );
}

/** Shared helpers used by several studio screens. */
export function StatusPill({ status }: { status?: string }) {
  const s = statusInfo(status);
  return <span className={`s-pill tone-${s.tone}`}>{s.label}</span>;
}

export function coverUrl(sub: any): string | null {
  if (sub?.coverFile?.storagePath) return `/api/files/secure/${sub.coverFile.storagePath}`;
  if (sub?.cover) return sub.cover;
  return null;
}

export function timeAgo(d?: string | Date) {
  if (!d) return "";
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
