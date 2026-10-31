/**
 * The backend's answer for a temporary inbox: 422 with {"error":"disposable"}
 * (web/convex holds the list). Any other 422 is still a failure the route
 * reports as its own, as before. No imports, so tests run it as is.
 */
export async function isDisposableAnswer(res: Response): Promise<boolean> {
  if (res.status !== 422) return false;
  const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
  return body?.error === "disposable";
}
