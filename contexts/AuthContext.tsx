"use client";
// Centralised authentication and author state.

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
  isAuthor: boolean;
  authorStatus: "active" | "pending" | "suspended" | null;
  authorProfile: any | null;
};

type AuthContextValue = AuthState & {
  isLoggedIn: boolean;
  isReady: boolean;
  refreshAuthorStatus: () => Promise<void>;
  setSession: (token: string, purchasedBooks: number[]) => void;
  addPurchasedBooks: (ids: number[]) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    purchasedBooks: [],
    isAuthor: false,
    authorStatus: null,
    authorProfile: null,
  });
  const [isReady, setIsReady] = useState(false);

  const fetchAuthorStatus = useCallback(async (tokenToUse: string | null) => {
    if (!tokenToUse) {
      setState((prev) => ({
        ...prev,
        isAuthor: false,
        authorStatus: null,
        authorProfile: null,
      }));
      return;
    }

    try {
      const res = await fetch("/api/author/profile", {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });
      if (res.ok) {
        const data = await res.json();

        // Check if token was expired/unauthenticated
        if (data?.authenticated === false) {
          localStorage.removeItem("auth_token");
          setState((prev) => ({
            ...prev,
            token: null,
            isAuthor: false,
            authorStatus: null,
            authorProfile: null,
          }));
          return;
        }

        if (data?.profile && data.profile.status === "active") {
          setState((prev) => ({
            ...prev,
            isAuthor: true,
            authorStatus: data.profile.status,
            authorProfile: data.profile,
          }));
          return;
        } else if (data?.profile) {
          setState((prev) => ({
            ...prev,
            isAuthor: Boolean(data.profile._id),
            authorStatus: data.profile.status,
            authorProfile: data.profile,
          }));
          return;
        }
      } else if (res.status === 401) {
        localStorage.removeItem("auth_token");
        setState((prev) => ({
          ...prev,
          token: null,
          isAuthor: false,
          authorStatus: null,
          authorProfile: null,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isAuthor: false,
        authorStatus: null,
        authorProfile: null,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        isAuthor: false,
        authorStatus: null,
        authorProfile: null,
      }));
    }
  }, []);

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const token = localStorage.getItem("auth_token");
      const raw = localStorage.getItem("purchased_books");
      const purchased = raw ? (JSON.parse(raw) as number[]) : [];
      if (token) {
        setState((prev) => ({ ...prev, token, purchasedBooks: purchased }));
        fetchAuthorStatus(token);
      }
    } catch {
      /* ignore corrupted storage */
    } finally {
      setIsReady(true);
    }
  }, [fetchAuthorStatus]);

  const refreshAuthorStatus = useCallback(async () => {
    const currentToken = state.token || (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
    if (currentToken) {
      await fetchAuthorStatus(currentToken);
    }
  }, [state.token, fetchAuthorStatus]);

  const setSession = useCallback(
    (token: string, purchasedBooks: number[]) => {
      localStorage.setItem("auth_token", token);
      localStorage.setItem(
        "purchased_books",
        JSON.stringify(purchasedBooks ?? [])
      );
      setState((prev) => ({
        ...prev,
        token,
        purchasedBooks: purchasedBooks ?? [],
      }));
      fetchAuthorStatus(token);
    },
    [fetchAuthorStatus]
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
    setState({
      token: null,
      purchasedBooks: [],
      isAuthor: false,
      authorStatus: null,
      authorProfile: null,
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isLoggedIn: !!state.token,
      isReady,
      refreshAuthorStatus,
      setSession,
      addPurchasedBooks,
      logout,
    }),
    [state, isReady, refreshAuthorStatus, setSession, addPurchasedBooks, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
