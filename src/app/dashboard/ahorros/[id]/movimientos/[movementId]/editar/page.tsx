import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SavingsMovementForm } from "@/app/dashboard/ahorros/[id]/savings-movement-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar movimiento del sobre" };
export const dynamic = "force-dynamic";

export default async function EditSavingsMovementPage({
  params,
}: {
  params: Promise<{ id: string; movementId: string }>;
}) {
  const { id, movementId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: movement } = await supabase
    .from("savings_movements")
    .select("id, type, amount, movement_date, description")
    .eq("id", movementId)
    .eq("savings_goal_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!movement) {
    redirect(`/dashboard/ahorros/${id}`);
  }

  return (
    <main className="movement-shell">
      <nav className="dashboard-nav">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">₡</span>
          <span>Finanzas claras</span>
        </Link>
        <Link className="back-link" href={`/dashboard/ahorros/${id}`}>
          ← Volver al sobre
        </Link>
      </nav>

      <section className="movement-page">
        <header className="movement-heading">
          <span className="eyebrow">Corrección</span>
          <h1>Editar movimiento</h1>
          <p>
            Modificá el tipo, monto, fecha o descripción del aporte o retiro.
          </p>
        </header>

        <article className="movement-card">
          <SavingsMovementForm
            goalId={id}
            movement={{
              id: movement.id,
              type: movement.type as "deposit" | "withdrawal",
              amount: Number(movement.amount),
              movementDate: movement.movement_date,
              description: movement.description ?? "",
            }}
            today={movement.movement_date}
          />
        </article>
      </section>
    </main>
  );
}
