/**
 * The maker credit in every footer: a link back to Minus's hub.
 * rel="me" ties hookedcue.com to his other profiles.
 */
export const MAKER_URL = "https://unawareminus.com";

export default function MakerCredit() {
  return (
    <span className="maker-credit">
      by Minus · <a href={MAKER_URL} rel="me">unawareminus.com</a>
    </span>
  );
}
