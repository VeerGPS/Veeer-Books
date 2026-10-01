"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_DEALS, type PublicDeals } from "@/lib/deals-shared";
import { GIFT_BOOK } from "@/lib/gift";

const FALLBACK: PublicDeals = {
  gift: { ...GIFT_BOOK },
  sale: { active: false, percent: 0, label: "", scope: "all" },
  multiBuy: DEFAULT_DEALS.multiBuy,
  firstOrder: DEFAULT_DEALS.firstOrder,
  referral: DEFAULT_DEALS.referral,
  bar: DEFAULT_DEALS.bar,
  popups: DEFAULT_DEALS.popups,
};

const DealsCtx = createContext<PublicDeals>(FALLBACK);

/** Deal settings from /admin/deals, loaded on the server with every page. */
export function DealsProvider({ value, children }: { value?: PublicDeals; children: ReactNode }) {
  return <DealsCtx.Provider value={value || FALLBACK}>{children}</DealsCtx.Provider>;
}

export const useDeals = () => useContext(DealsCtx);
