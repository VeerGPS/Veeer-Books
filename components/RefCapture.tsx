"use client";

import { useEffect } from "react";
import { saveRefCode } from "@/lib/referral-client";

/** Saves ?ref=CODE from any shared link so the friend discount applies at checkout. */
export default function RefCapture() {
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) saveRefCode(ref);
    } catch { /* ignore */ }
  }, []);
  return null;
}
