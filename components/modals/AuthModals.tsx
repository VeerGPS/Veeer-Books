"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { apiLogin, apiSignup, apiVerifyOtp } from "@/lib/api-client";

// ─── Generic modal shell ────────────────────────────────────────────────────
function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  // Lock body scroll while a modal is open + close on Esc
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <h2>{title}</h2>
        {children}
        <button
          type="button"
          className="btn btn-outline btn-full"
          style={{ marginTop: "1rem" }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Login ─────────────────────────────────────────────────────────────────
function LoginModal() {
  const { setSession } = useAuth();
  const { close, show } = useModal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await apiLogin({ email, password });
      setSession(data.token, data.purchasedBooks || []);
      alert("Logged in successfully!");
      close();
      // Soft refresh to update server-rendered surfaces if any
      window.location.reload();
    } catch (err) {
      setError((err as Error).message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Welcome Back" onClose={close}>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="login-email">Email Address</label>
          <input
            id="login-email"
            type="email"
            placeholder="reader@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && (
          <p style={{ color: "#c0392b", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
      <div className="modal-switch">
        Don&apos;t have an account?{" "}
        <button onClick={() => show("signup")} type="button">
          Sign Up
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Signup ────────────────────────────────────────────────────────────────
function SignupModal() {
  const { close, show } = useModal();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiSignup({
        fullName,
        email,
        password,
        termsAccepted: terms,
      });
      // Stash email so the OTP modal can use it
      localStorage.setItem("temp_email", email);
      alert("OTP sent to your email!");
      show("otp");
    } catch (err) {
      setError((err as Error).message || "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Create Account" onClose={close}>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="signup-name">Full Name</label>
          <input
            id="signup-name"
            type="text"
            placeholder="Veeer Sukhadiya"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="signup-email">Email Address</label>
          <input
            id="signup-email"
            type="email"
            placeholder="reader@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
          />
        </div>
        <label className="form-row-checkbox">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            required
          />
          <span>
            I agree to the <Link href="/terms">Terms of Service</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </span>
        </label>
        {error && (
          <p style={{ color: "#c0392b", fontSize: "0.9rem", margin: "0.75rem 0" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          className="btn btn-primary btn-full"
          style={{ marginTop: "1rem" }}
          disabled={busy}
        >
          {busy ? "Sending OTP…" : "Sign Up & Send OTP"}
        </button>
      </form>
      <div className="modal-switch">
        Already have an account?{" "}
        <button onClick={() => show("login")} type="button">
          Login
        </button>
      </div>
    </ModalShell>
  );
}

// ─── OTP ───────────────────────────────────────────────────────────────────
function OtpModal() {
  const { setSession } = useAuth();
  const { close } = useModal();
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = localStorage.getItem("temp_email");
    if (!email) {
      setError("Session expired. Please sign up again.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const data = await apiVerifyOtp({ email, otp });
      setSession(data.token, data.purchasedBooks || []);
      localStorage.removeItem("temp_email");
      alert("Email verified successfully! You are now logged in.");
      close();
      window.location.reload();
    } catch (err) {
      setError((err as Error).message || "Invalid OTP");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Verify Email" onClose={close}>
      <p style={{ marginBottom: "1.25rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        We sent a 6-digit code to your email.
      </p>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="otp-input">Enter OTP</label>
          <input
            id="otp-input"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            placeholder="123456"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            style={{ letterSpacing: "4px", textAlign: "center", fontSize: "1.4rem" }}
            autoComplete="one-time-code"
          />
        </div>
        {error && (
          <p style={{ color: "#c0392b", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          className="btn btn-primary btn-full"
          style={{ marginTop: "1rem" }}
          disabled={busy}
        >
          {busy ? "Verifying…" : "Verify & Login"}
        </button>
      </form>
    </ModalShell>
  );
}

// ─── Aggregator — mounted once at the root ─────────────────────────────────
export default function AuthModals() {
  const { open } = useModal();
  if (open === "login") return <LoginModal />;
  if (open === "signup") return <SignupModal />;
  if (open === "otp") return <OtpModal />;
  return null;
}
