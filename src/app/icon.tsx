import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          borderRadius: 18,
          background: "#176b4d",
          color: "#ffffff",
          fontSize: 40,
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        <span style={{ display: "flex" }}>C</span>
        <span
          style={{
            position: "absolute",
            width: 4,
            height: 48,
            borderRadius: 4,
            background: "#ffffff",
            transform: "rotate(18deg)",
            left: 28,
            top: 8,
          }}
        />
        <span
          style={{
            position: "absolute",
            width: 4,
            height: 48,
            borderRadius: 4,
            background: "#ffffff",
            transform: "rotate(18deg)",
            left: 35,
            top: 8,
          }}
        />
      </div>
    ),
    size,
  );
}
