import { Product } from 'expo-iap';

// "Support the app" — a free-choice donation done compliantly. Google Play
// Billing has no arbitrary/custom amounts (every product is a fixed price), so a
// BANK of fixed-price products stands in for a type-any-amount field: the user
// types a whole amount and we buy the product priced at exactly that amount.
//
// Create one MANAGED product per amount in Play Console (id `support_<n>`,
// price = that many units of your account's base currency, status Active). A CSV
// for bulk import + the id list live in docs/support-products.csv. The
// verify-purchase Edge Function allow-lists exactly this id pattern + range.
export const SUPPORT_MIN_AMOUNT = 5;
export const SUPPORT_MAX_AMOUNT = 50;

export function supportProductId(amount: number): string {
  return `support_${amount}`;
}

// Every id in the bank — passed to fetchProducts so we can show the store's
// localized price for the amount the user typed.
export const SUPPORT_PRODUCT_IDS: string[] = Array.from(
  { length: SUPPORT_MAX_AMOUNT - SUPPORT_MIN_AMOUNT + 1 },
  (_, i) => supportProductId(SUPPORT_MIN_AMOUNT + i),
);

export function isValidSupportAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount >= SUPPORT_MIN_AMOUNT && amount <= SUPPORT_MAX_AMOUNT;
}

// The store product for a typed amount, if its price has been fetched.
export function findSupportProduct(products: Product[], amount: number): Product | undefined {
  return products.find(p => p.id === supportProductId(amount));
}
