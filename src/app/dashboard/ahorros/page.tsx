import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoalForm } from "@/app/dashboard/ahorros/goal-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ahorros" };
export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

export default async function SavingsPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: goals } = await supabase
    .from("savings_goals")
    .select(
      "id, name, target_amount, target_date, monthly_target, color, status, savings_movements(type, amount)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const goalsWithBalance =
    goals?.map((goal) => {
      const balance = goal.savings_movements.reduce(
        (sum, movement) =>
          sum +
          (movement.type === "deposit"
            ? Number(movement.amount)
            : -Number(movement.amount)),
        0,
      );
      const percentage = Math.min(
        100,
        Math.max(0, (balance / Number(goal.target_amount)) * 100),
      );
      return { ...goal, balance, percentage };
    }) ?? [];
  const totalSaved = goalsWithBalance.reduce(
    (sum, goal) => sum + goal.balance,
    0,
  );

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

      <section className="savings-page">
        <header className="savings-heading">
          <div>
            <span className="eyebrow">Tus objetivos</span>
            <h1>Ahorros</h1>
            <p>
              Organizá tus metas y registrá cada aporte sin mezclarlo con tus
              gastos del mes.
            </p>
          </div>
          <div className="savings-total">
            <span>Total ahorrado</span>
            <strong>{money.format(totalSaved)}</strong>
            <small>{goalsWithBalance.length} metas creadas</small>
          </div>
        </header>

        <div className="savings-layout">
          <section>
            <div className="section-title">
              <h2>Mis metas</h2>
              <span>{goalsWithBalance.length} en total</span>
            </div>

            {goalsWithBalance.length ? (
              <div className="goal-grid">
                {goalsWithBalance.map((goal) => (
                  <Link
                    className="goal-card"
                    href={`/dashboard/ahorros/${goal.id}`}
                    key={goal.id}
                  >
                    <div className="goal-card-top">
                      <i style={{ backgroundColor: goal.color }}>◎</i>
                      <span>{goal.status === "active" ? "Activa" : "Pausada"}</span>
                    </div>
                    <h3>{goal.name}</h3>
                    <div className="goal-amounts">
                      <strong>{money.format(goal.balance)}</strong>
                      <small>de {money.format(Number(goal.target_amount))}</small>
                    </div>
                    <div className="goal-progress">
                      <span style={{ width: `${goal.percentage}%` }} />
                    </div>
                    <div className="goal-footer">
                      <span>{Math.round(goal.percentage)}% completado</span>
                      <strong>Ver meta →</strong>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <article className="empty-card savings-empty">
                <h3>Tu primera meta empieza aquí</h3>
                <p>
                  Podés comenzar con un fondo de emergencia, un viaje o una
                  compra importante.
                </p>
              </article>
            )}
          </section>

          <aside className="new-goal-card">
            <span className="eyebrow">Nueva meta</span>
            <h2>¿Para qué querés ahorrar?</h2>
            <p>Definí tu objetivo. Podrás registrar aportes después de crearla.</p>
            <GoalForm />
          </aside>
        </div>
      </section>
    </main>
  );
}
