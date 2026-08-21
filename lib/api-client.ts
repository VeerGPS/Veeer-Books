// Tiny `fetch` wrapper used by client components.
//
// In the original project, the front-end called
//     http://localhost:8787/api/...
// hard-coded. After migration the API is co-deployed on the same Vercel
// domain, so we just call same-origin `/api/...` and there is no CORS pain.

const BASE = "/api";

type FetchInit = RequestInit & { json?: unknown };

async function call(path: string, init: FetchInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) || {}),
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("purchased_books");
    }
    const err = new Error(data.error || `Request failed (${res.status})`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return data;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const apiSignup = (payload: {
  fullName: string;
  email: string;
  password: string;
  termsAccepted: boolean;
}) => call("/auth/signup", { method: "POST", json: payload });

export const apiVerifyOtp = (payload: { email: string; otp: string }) =>
  call("/auth/verify-otp", { method: "POST", json: payload });

export const apiLogin = (payload: { email: string; password: string }) =>
  call("/auth/login", { method: "POST", json: payload });

export const apiSendOtp = (payload: { email: string }) =>
  call("/auth/send-otp", { method: "POST", json: payload });

// ─── Razorpay ────────────────────────────────────────────────────────────────
export const apiRazorpayKey = () =>
  call("/razorpay/key", { method: "GET" }) as Promise<{ key: string }>;

export const apiRazorpayOrder = (payload: {
  amountINR: number;
  items: number[];
}) => call("/razorpay/order", { method: "POST", json: payload });

export const apiRazorpayVerify = (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => call("/razorpay/verify", { method: "POST", json: payload });
