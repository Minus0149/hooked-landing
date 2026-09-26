/**
 * The artist promotion packages shown on /artists.
 *
 * The app's backend decides what is actually charged (web/convex/
 * promotionRules.ts, DEFAULT_PROMOTION_CONFIG, admin-editable). Keep these in
 * step with it; tests/promotion-page.test.mjs checks the maths here.
 */
export const PROMOTION_PACKAGES = [
  { id: "try", name: "Try it", listeners: 100, priceInr: 99 },
  { id: "starter", name: "Starter", listeners: 500, priceInr: 399 },
  { id: "boost", name: "Boost", listeners: 2000, priceInr: 1399 },
  { id: "launch", name: "Launch", listeners: 5000, priceInr: 2999 },
] as const;

export const LAUNCH_OFFER_PERCENT = 50;
export const CAMPAIGN_DAYS = 30;
export const COUNTED_LISTEN_SECONDS = 3;

export const perListener = (priceInr: number, listeners: number) =>
  Math.round((priceInr / listeners) * 100) / 100;
