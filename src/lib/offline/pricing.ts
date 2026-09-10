import type { LocalCart, LocalCartItem } from './db';

export type BranchPricingContext = {
  branchId: string;
  currency: string;
  serviceChargePct: number;
  taxRate: number;
  quickPayAmounts: number[];
  paymentMethods: string[];
};

export type CartTotals = {
  subtotal: number;
  taxTotal: number;
  serviceCharge: number;
  discountTotal: number;
  tipAmount: number;
  loyaltyPointsRedeemed: number;
  total: number;
};

export function pricingFromSnapshot(snapshot: Record<string, unknown>): BranchPricingContext {
  const pricing = (snapshot.pricing as Record<string, unknown>) || {};
  const branch = (snapshot.branch as Record<string, unknown>) || {};
  return {
    branchId: String(snapshot.branchId ?? snapshot.branch_id ?? branch.id ?? ''),
    currency: String(pricing.currency ?? branch.currency ?? 'PKR'),
    serviceChargePct: Number(pricing.serviceChargePct ?? pricing.service_charge_pct ?? 0),
    taxRate: Number(pricing.taxRate ?? pricing.tax_rate ?? 0),
    quickPayAmounts: (pricing.quickPayAmounts as number[]) || (pricing.quick_pay_amounts as number[]) || [],
    paymentMethods: (pricing.paymentMethods as string[]) || (pricing.payment_methods as string[]) || ['cash', 'card'],
  };
}

export function computeCartTotals(
  items: LocalCartItem[],
  ctx: BranchPricingContext,
  opts: {
    discountTotal?: number;
    discountPct?: number;
    tipAmount?: number;
    loyaltyPointsRedeemed?: number;
  } = {}
): CartTotals {
  const subtotal = items.reduce((s, i) => s + Number(i.lineTotal || 0), 0);
  let discountTotal = Number(opts.discountTotal || 0);
  const loyaltyPointsRedeemed = Number(opts.loyaltyPointsRedeemed || 0);
  if (loyaltyPointsRedeemed > 0) {
    discountTotal += loyaltyPointsRedeemed;
  }
  if (opts.discountPct && opts.discountPct > 0) {
    discountTotal = Math.round((subtotal * opts.discountPct) / 100 * 100) / 100;
  }
  const afterDiscount = Math.max(0, subtotal - discountTotal);
  const taxRate = ctx.taxRate > 1 ? ctx.taxRate / 100 : ctx.taxRate;
  const taxTotal = Math.round(afterDiscount * taxRate * 100) / 100;
  const serviceCharge = Math.round((afterDiscount * ctx.serviceChargePct) / 100 * 100) / 100;
  const tipAmount = Number(opts.tipAmount || 0);
  const total = Math.round((afterDiscount + taxTotal + serviceCharge + tipAmount) * 100) / 100;

  return {
    subtotal,
    taxTotal,
    serviceCharge,
    discountTotal,
    tipAmount,
    loyaltyPointsRedeemed,
    total,
  };
}

export function recalcLocalCart(cart: LocalCart, ctx: BranchPricingContext): LocalCart {
  const totals = computeCartTotals(cart.items, ctx, {
    discountTotal: cart.discountTotal,
    discountPct: cart.discountPct,
    tipAmount: cart.tipAmount,
    loyaltyPointsRedeemed: cart.loyaltyPointsRedeemed,
  });
  return { ...cart, ...totals };
}
