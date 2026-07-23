export type Coupon = {
  code: string;
  discountPercent: number;
  active: boolean;
};

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function calculateDiscount(subtotal: number, discountPercent: number) {
  const safePercent = Math.max(0, Math.min(100, Number(discountPercent) || 0));
  const discount = subtotal * (safePercent / 100);
  return {
    discount,
    total: Math.max(0, subtotal - discount),
    discountPercent: safePercent,
  };
}
