import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MovementForm } from "@/app/dashboard/nuevo/movement-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nuevo movimiento" };
export const dynamic = "force-dynamic";

function todayInCostaRica() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function NewMovementPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type, color")
    .eq("user_id", userId)
    .order("name");

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

      <section className="movement-page">
        <header className="movement-heading">
          <span className="eyebrow">Registro diario</span>
          <h1>Nuevo movimiento</h1>
          <p>
            Agregá un ingreso o gasto y tu resumen mensual se actualizará
            automáticamente.
          </p>
        </header>

        <article className="movement-card">
          {categories?.length ? (
            <MovementForm
              categories={categories as Array<{
                id: string;
                name: string;
                type: "income" | "expense";
                color: string;
              }>}
              today={todayInCostaRica()}
            />
          ) : (
            <div className="form-message form-message-error">
              No encontramos categorías para tu cuenta. Volvé a intentarlo más
              tarde.
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
