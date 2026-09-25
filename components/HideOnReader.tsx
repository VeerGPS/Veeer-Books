"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Renders its children everywhere except the full-screen book reader. */
export default function HideOnReader({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  return pathname.startsWith("/reader") ? null : <>{children}</>;
}
