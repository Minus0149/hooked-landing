const strip = (u: string) => u.replace(/\/+$/, "");

export const siteUrl = strip(process.env.NEXT_PUBLIC_SITE_URL ?? "https://hookedcue.com");

const rawApp = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.hookedcue.com";
// a localhost app url baked into a production build ships a dead button —
// fall back to the site itself so the CTA at least lands somewhere real
export const appUrl = rawApp.includes("localhost") ? siteUrl : strip(rawApp);

// only open a new tab when it actually leaves the site
export const appLinkProps =
  appUrl === siteUrl ? {} : ({ target: "_blank", rel: "noreferrer" } as const);
