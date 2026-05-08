"use client";
// Centralised authentication state.
//
// In the original logic.js the auth token + purchasedBooks lived in
// localStorage and were read/written ad-hoc all over the codebase.
// We keep localStorage as the persistence layer (so refresh works
// the same), but put a thin React context on top for components.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthState = {
  token: string | null;
  purchasedBooks: number[];
};

type AuthContextValue = AuthState & {
  isLoggedIn: boolean;
  setSession: (token: string, purchasedBooks: number[]) => void;
  addPurchasedBooks: (ids: number[]) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    purchasedBooks: [],
  });

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const token = localStorage.getItem("auth_token");
      const raw = localStorage.getItem("purchased_books");
      const purchased = raw ? (JSON.parse(raw) as number[]) : [];
      if (token) setState({ token, purchasedBooks: purchased });
    } catch {
      /* ignore corrupted storage */
    }
  }, []);

  const setSession = useCallback(
    (token: string, purchasedBooks: number[]) => {
      localStorage.setItem("auth_token", token);
      localStorage.setItem(
        "purchased_books",
        JSON.stringify(purchasedBooks ?? [])
      );
      setState({ token, purchasedBooks: purchasedBooks ?? [] });
    },
    []
  );

  const addPurchasedBooks = useCallback((ids: number[]) => {
    setState((prev) => {
      const merged = Array.from(new Set([...prev.purchasedBooks, ...ids]));
      localStorage.setItem("purchased_books", JSON.stringify(merged));
      return { ...prev, purchasedBooks: merged };
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("purchased_books");
    localStorage.removeItem("cartItems");
    setState({ token: null, purchasedBooks: [] });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isLoggedIn: !!state.token,
      setSession,
      addPurchasedBooks,
      logout,
    }),
    [state, setSession, addPurchasedBooks, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
