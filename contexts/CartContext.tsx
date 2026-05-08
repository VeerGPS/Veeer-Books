"use client";
// Cart state — array of book IDs, persisted to localStorage under
// the SAME key (`cartItems`) as the original project. This is important:
// users with leftover cart data from the legacy site should see it
// preserved on first visit to the migrated app.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CartContextValue = {
  items: number[];
  hasItem: (id: number) => boolean;
  add: (id: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "cartItems";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<number[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as number[]);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (next: number[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage full / private mode */
    }
  };

  const add = useCallback((id: number) => {
    setItems((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const remove = useCallback((id: number) => {
    setItems((prev) => {
      const next = prev.filter((x) => x !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const clear = useCallback(() => persist([]), []);

  const hasItem = useCallback((id: number) => items.includes(id), [items]);

  const value = useMemo<CartContextValue>(
    () => ({ items, hasItem, add, remove, clear }),
    [items, hasItem, add, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
