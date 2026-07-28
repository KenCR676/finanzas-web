import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HowToSlides } from "@/app/dashboard/como-usar/how-to-slides";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cómo usar" };
export const dynamic = "force-dynamic";

export default async function HowToPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims?.sub) {
    redirect("/login");
  }

  return (
    <main className="movement-shell">
      <nav className="dashboard-nav">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">₡</span>
          <span>Finanzas claras</span>
        </Link>
        <Link className="back-link" href="/dashboard">
          ← Volver al resumen
        </Link>
      </nav>

      <section className="guide-page">
        <header className="guide-page-heading">
          <span className="eyebrow">Centro de ayuda</span>
          <h1>Cómo usar Finanzas claras</h1>
          <p>
            Una explicación rápida de las funciones principales. Las
            diapositivas avanzan automáticamente o podés controlarlas.
          </p>
        </header>
        <HowToSlides />
      </section>
    </main>
  );
}
