import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoalForm } from "@/app/dashboard/ahorros/goal-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sobres de ahorro" };
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
      "id, name, description, color, status, savings_movements(type, amount)",
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
      return {
        ...goal,
        balance,
        movementCount: goal.savings_movements.length,
      };
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
            <span className="eyebrow">Dinero separado por propósito</span>
            <h1>Sobres de ahorro</h1>
            <p>
              Separá tus ahorros en sobres y registrá aportes o retiros sin
              establecer montos ni fechas límite.
            </p>
          </div>
          <div className="savings-total">
            <span>Total en sobres</span>
            <strong>{money.format(totalSaved)}</strong>
            <small>{goalsWithBalance.length} sobres creados</small>
          </div>
        </header>

        <div className="savings-layout">
          <section>
            <div className="section-title">
              <h2>Mis sobres</h2>
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
                      <i style={{ backgroundColor: goal.color }}>₡</i>
                      <span>
                        {goal.status === "active" ? "Disponible" : "Pausado"}
                      </span>
                    </div>
                    <h3>{goal.name}</h3>
                    {goal.description ? <p>{goal.description}</p> : null}
                    <div className="goal-amounts">
                      <strong>{money.format(goal.balance)}</strong>
                      <small>saldo disponible</small>
                    </div>
                    <div className="goal-footer">
                      <span>{goal.movementCount} movimientos</span>
                      <strong>Ver sobre →</strong>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <article className="empty-card savings-empty">
                <h3>Creá tu primer sobre</h3>
                <p>
                  Podés separar dinero para emergencias, vacaciones, compras o
                  cualquier propósito.
                </p>
              </article>
            )}
          </section>

          <aside className="new-goal-card">
            <span className="eyebrow">Nuevo sobre</span>
            <h2>¿Para qué querés separar dinero?</h2>
            <p>Creá el sobre y después registrá todos los aportes o retiros.</p>
            <GoalForm />
          </aside>
        </div>
      </section>
    </main>
  );
}
