import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoalForm } from "@/app/dashboard/ahorros/goal-form";
import { normalizePeriodMode } from "@/lib/periods";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar meta de ahorro" };
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
    .select(
      "id, name, target_amount, target_date, monthly_target, contribution_frequency, color",
    )
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!goal) {
    redirect("/dashboard/ahorros");
  }

  const frequency = normalizePeriodMode(goal.contribution_frequency);

  return (
    <main className="movement-shell">
      <nav className="dashboard-nav">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">₡</span>
          <span>Finanzas claras</span>
        </Link>
        <Link className="back-link" href={`/dashboard/ahorros/${goal.id}`}>
          ← Volver a la meta
        </Link>
      </nav>

      <section className="movement-page">
        <header className="movement-heading">
          <span className="eyebrow">Corrección</span>
          <h1>Editar meta de ahorro</h1>
          <p>
            Corregí el nombre, los montos, la fecha objetivo, la frecuencia o
            el color de esta meta.
          </p>
        </header>

        <article className="movement-card">
          <GoalForm
            defaultFrequency={frequency}
            goal={{
              id: goal.id,
              name: goal.name,
              targetAmount: Number(goal.target_amount),
              monthlyTarget: goal.monthly_target
                ? Number(goal.monthly_target)
                : null,
              targetDate: goal.target_date,
              contributionFrequency: frequency,
              color: goal.color,
            }}
          />
        </article>
      </section>
    </main>
  );
}
