type AppIconMarkProps = {
  dimension: number;
};

export function AppIconMark({ dimension }: AppIconMarkProps) {
  const scale = dimension / 64;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        borderRadius: 18 * scale,
        background: "#176b4d",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        fontSize: 40 * scale,
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      <span style={{ display: "flex" }}>C</span>
      <span
        style={{
          position: "absolute",
          width: 4 * scale,
          height: 48 * scale,
          borderRadius: 4 * scale,
          background: "#ffffff",
          transform: "rotate(18deg)",
          left: 28 * scale,
          top: 8 * scale,
        }}
      />
      <span
        style={{
          position: "absolute",
          width: 4 * scale,
          height: 48 * scale,
          borderRadius: 4 * scale,
          background: "#ffffff",
          transform: "rotate(18deg)",
          left: 35 * scale,
          top: 8 * scale,
        }}
      />
    </div>
  );
}
