import { Product } from 'expo-iap';

// Google Play in-app product IDs for the "Support the app" tiers. Create each
// one in Play Console → Monetize → In-app products as a MANAGED product, with
// these exact IDs, a localized price, and status Active. They are CONSUMABLE:
// the app consumes each purchase so a supporter can tip again later. Every tier
// grants the same cosmetic Patron badge — the tier only sets how much is given.
//
// This is how the app offers a "choose how much" experience: Google Play Billing
// only sells fixed-price products (no arbitrary/custom amounts), so several price
// points stand in for a free-choice field. Add or remove tiers by editing this
// list AND creating/removing the matching product in Play Console — the
// verify-purchase Edge Function also allow-lists exactly these IDs.
//
// Order matters: listed low → high, and the UI shows them in this order.
export const SUPPORT_PRODUCT_IDS = [
  'support_tier_1',
  'support_tier_2',
  'support_tier_3',
  'support_tier_4',
  'support_tier_5',
] as const;

export type SupportProductId = (typeof SUPPORT_PRODUCT_IDS)[number];

// Sorts fetched products back into the SUPPORT_PRODUCT_IDS order (the store may
// return them in any order) and drops anything unrecognised.
export function orderSupportProducts(products: Product[]): Product[] {
  return SUPPORT_PRODUCT_IDS
    .map(id => products.find(p => p.id === id))
    .filter((p): p is Product => !!p);
}
