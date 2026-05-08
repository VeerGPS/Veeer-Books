"use client";
// Modal state lives at the app level so any component (Header, product page,
// cart page) can open the Login modal without re-implementing the trigger.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ModalKind = "login" | "signup" | "otp" | null;

type ModalContextValue = {
  open: ModalKind;
  show: (kind: ModalKind) => void;
  close: () => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<ModalKind>(null);

  const show = useCallback((kind: ModalKind) => setOpen(kind), []);
  const close = useCallback(() => setOpen(null), []);

  const value = useMemo<ModalContextValue>(
    () => ({ open, show, close }),
    [open, show, close]
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}
