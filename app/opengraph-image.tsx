import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "CardSnap — sports card grading estimates";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #0c0a09 100%)",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
              color: "#0a0a0a",
            }}
          >
            CS
          </div>
          <span style={{ fontSize: 48, fontWeight: 800, color: "#fafafa" }}>
            CardSnap
          </span>
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 600,
            color: "#d4d4d8",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          Is your card worth grading?
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 20,
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Raw & graded estimates · PSA context · Grade / skip insight
        </div>
      </div>
    ),
    { ...size }
  );
}
