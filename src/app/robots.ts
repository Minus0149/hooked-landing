import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * AI crawlers are allowed on purpose. This is a marketing site for a product
 * that wants to be found, and /llms.txt exists to give those crawlers a clean
 * summary rather than making them guess from a page full of WebGL. The API is
 * the only thing closed off.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        // named explicitly so the intent is on the record, not just implied
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-User",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
        ],
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
