import { ImageResponse } from "next/og";
import { bigArt, indieArchive, weekLabel } from "@/lib/indieHook";

export const revalidate = 300;

/** The indie hook of the week as a 1080 × 1920 image for Instagram stories. */
export async function GET() {
  const [now] = await indieArchive();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #13131b 0%, #08080c 60%)",
          color: "#f4f2ee",
          padding: 90,
        }}
      >
        <div style={{ display: "flex", fontSize: 40, letterSpacing: 8, color: "#00e5a0", fontWeight: 700 }}>INDIE HOOK OF THE WEEK</div>
        {now ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bigArt(now.artwork, 1000)} width={820} height={820} style={{ borderRadius: 48, marginTop: 70 }} alt="" />
            <div style={{ display: "flex", fontSize: 84, fontWeight: 800, marginTop: 70, textAlign: "center", lineHeight: 1.05 }}>{now.title}</div>
            <div style={{ display: "flex", fontSize: 48, color: "#b9b7c2", marginTop: 20 }}>{now.artist}</div>
            <div style={{ display: "flex", fontSize: 34, color: "#8e8c99", marginTop: 30 }}>{`week of ${weekLabel(now.week)}`}</div>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 60, marginTop: 80 }}>coming soon</div>
        )}
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 110, fontSize: 64, fontWeight: 800 }}>
          hookedcue<span style={{ color: "#ff3d71" }}>.</span>
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#8e8c99", marginTop: 12 }}>hookedcue.com/indie-hook</div>
      </div>
    ),
    { width: 1080, height: 1920 },
  );
}
