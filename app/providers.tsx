"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import AuthModals from "@/components/modals/AuthModals";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CurrencyProvider>
      <CartProvider>
        <ModalProvider>
          {children}
          {/* Modals mounted once at the root so any page can trigger them */}
          <AuthModals />
        </ModalProvider>
      </CartProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
