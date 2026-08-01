import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finanzas claras",
    short_name: "Finanzas",
    description:
      "Controlá tu saldo, ingresos, gastos y sobres de ahorro de forma sencilla.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f0e7",
    theme_color: "#176b4d",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
