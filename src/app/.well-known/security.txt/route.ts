import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

/**
 * security.txt (RFC 9116) — where to send a vulnerability report.
 *
 * Expires is required by the RFC and must be in the future; bump it when it gets
 * close, or researchers are told the contact is stale.
 */
export function GET() {
  const expires = new Date(Date.UTC(2027, 7, 12)).toISOString();

  const body = `# hooked. — security contact
# If you have found a vulnerability, please tell us before telling anyone else.

Contact: mailto:security@hookedcue.com
Expires: ${expires}
Preferred-Languages: en
Canonical: ${siteUrl}/.well-known/security.txt
Policy: ${siteUrl}/terms

# hooked. is a small project in closed testing, run by one person.
# We will confirm receipt as quickly as we can. Please don't run automated
# scanners against production, don't access accounts that aren't yours, and give
# us a reasonable window to fix anything before disclosing it.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
