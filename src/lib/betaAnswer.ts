/**
 * The backend's answer for a temporary inbox: 422 with {"error":"disposable"}
 * (web/convex holds the list). Any other 422 is still a failure the route
 * reports as its own, as before. No imports, so tests run it as is.
 * readCapped (below) bounds the request body the same route reads.
 */
export async function isDisposableAnswer(res: Response): Promise<boolean> {
  if (res.status !== 422) return false;
  const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
  return body?.error === "disposable";
}

/**
 * The request body as text, or null once it passes `max` bytes. request.text()
 * buffered the whole body before the route checked its size, so one POST of
 * hundreds of megabytes sat in this server's memory first. A declared length
 * over the cap is refused unread; otherwise reading stops at the cap.
 */
export async function readCapped(request: Request, max: number): Promise<string | null> {
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > max) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  return new TextDecoder().decode(all);
}
