"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useModal } from "@/contexts/ModalContext";
import BundleHeaderBanner from "./BundleHeaderBanner";

export default function Header() {
  const { isLoggedIn, logout } = useAuth();
  const { items } = useCart();
  const { show } = useModal();
  const [navOpen, setNavOpen] = useState(false);

  const close = () => setNavOpen(false);

  return (
    <header style={{ position: "relative" }}>
      <BundleHeaderBanner />
      <div className="container">
        <nav>
          <Link href="/" className="logo" onClick={close}>
            <Image
              src="/images/logo.png"
              alt="Veeer Books Logo"
              width={36}
              height={36}
              priority
            />
            <span>Veeer Sukhadiya Books</span>
          </Link>

          <button
            className="nav-toggle"
            aria-label="Toggle navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
          >
            ☰
          </button>

          <div className={`nav-menu${navOpen ? " open" : ""}`}>
            <div className="nav-group-primary">
              <Link href="/" onClick={close}>
                Home
              </Link>
              <Link href="/#collections" onClick={close}>
                Collections
              </Link>
              <Link href="/#about" onClick={close}>
                About
              </Link>
            </div>

            <div className="nav-group-user">
              {isLoggedIn ? (
                <>
                  <Link href="/library" onClick={close}>
                    My Library
                  </Link>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      logout();
                      close();
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="linklike"
                    onClick={() => {
                      show("login");
                      close();
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      show("signup");
                      close();
                    }}
                  >
                    Sign Up
                  </button>
                </>
              )}

              <Link
                href="/cart"
                className="btn btn-outline btn-sm"
                onClick={close}
              >
                Cart ({items.length})
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
