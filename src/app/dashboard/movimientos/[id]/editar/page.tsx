import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MovementForm } from "@/app/dashboard/nuevo/movement-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar movimiento" };
export const dynamic = "force-dynamic";

export default async function EditMovementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const [{ data: movement }, { data: categories }] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "id, type, amount, category_id, description, transaction_date, expense_kind",
      )
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("id, name, type, color")
      .eq("user_id", userId)
      .order("name"),
  ]);

  if (!movement) {
    redirect("/dashboard/movimientos");
  }

  return (
    <main className="movement-shell">
      <nav className="dashboard-nav">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">₡</span>
          <span>Finanzas claras</span>
        </Link>
        <Link className="back-link" href="/dashboard/movimientos">
          ← Volver al historial
        </Link>
      </nav>

      <section className="movement-page">
        <header className="movement-heading">
          <span className="eyebrow">Corrección</span>
          <h1>Editar movimiento</h1>
          <p>
            Modificá los datos necesarios. El resumen y los gráficos se
            recalcularán al guardar.
          </p>
        </header>

        <article className="movement-card">
          <MovementForm
            categories={
              (categories ?? []) as Array<{
                id: string;
                name: string;
                type: "income" | "expense";
                color: string;
              }>
            }
            movement={{
              id: movement.id,
              type: movement.type as "income" | "expense",
              amount: Number(movement.amount),
              categoryId: movement.category_id ?? "",
              description: movement.description ?? "",
              transactionDate: movement.transaction_date,
              expenseKind: movement.expense_kind as
                | "fixed"
                | "variable"
                | null,
            }}
            today={movement.transaction_date}
          />
        </article>
      </section>
    </main>
  );
}
