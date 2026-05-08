// Razorpay SDK initialization.
// We keep a singleton instance — same as the original `new Razorpay(...)`
// at the top of server.js — so credentials are read once.

import Razorpay from "razorpay";

let _client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (_client) return _client;
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay credentials missing — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET"
    );
  }
  _client = new Razorpay({ key_id, key_secret });
  return _client;
}
