import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoalForm } from "@/app/dashboard/ahorros/goal-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar sobre de ahorro" };
export const dynamic = "force-dynamic";

export default async function EditSavingsGoalPage({
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

  const { data: goal } = await supabase
    .from("savings_goals")
    .select("id, name, description, color")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!goal) {
    redirect("/dashboard/ahorros");
  }

  return (
    <main className="movement-shell">
      <nav className="dashboard-nav">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">₡</span>
          <span>Finanzas claras</span>
        </Link>
        <Link className="back-link" href={`/dashboard/ahorros/${goal.id}`}>
          ← Volver al sobre
        </Link>
      </nav>

      <section className="movement-page">
        <header className="movement-heading">
          <span className="eyebrow">Corrección</span>
          <h1>Editar sobre de ahorro</h1>
          <p>
            Corregí el nombre, la descripción o el color de este sobre.
          </p>
        </header>

        <article className="movement-card">
          <GoalForm
            goal={{
              id: goal.id,
              name: goal.name,
              description: goal.description ?? "",
              color: goal.color,
            }}
          />
        </article>
      </section>
    </main>
  );
}
