"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

export default function AddToCartButton({ bookId }: { bookId: number }) {
  const router = useRouter();
  const { add, hasItem } = useCart();

  const onClick = () => {
    if (!hasItem(bookId)) add(bookId);
    router.push("/cart");
  };

  return (
    <button className="btn btn-primary" onClick={onClick}>
      {hasItem(bookId) ? "View in Cart" : "Add to Cart"}
    </button>
  );
}
