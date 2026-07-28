import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SavingsMovementForm } from "@/app/dashboard/ahorros/[id]/savings-movement-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Detalle de ahorro" };
export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

function todayInCostaRica() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function SavingsGoalPage({
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

  const [{ data: goal }, { data: movements }] = await Promise.all([
    supabase
      .from("savings_goals")
      .select("id, name, target_amount, target_date, monthly_target, color")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("savings_movements")
      .select("id, type, amount, movement_date, description")
      .eq("savings_goal_id", id)
      .eq("user_id", userId)
      .order("movement_date", { ascending: false }),
  ]);

  if (!goal) {
    redirect("/dashboard/ahorros");
  }

  const balance =
    movements?.reduce(
      (sum, movement) =>
        sum +
        (movement.type === "deposit"
          ? Number(movement.amount)
          : -Number(movement.amount)),
      0,
    ) ?? 0;
  const percentage = Math.min(
    100,
    Math.max(0, (balance / Number(goal.target_amount)) * 100),
  );

  return (
    <main className="movement-shell">
      <nav className="dashboard-nav">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">₡</span>
          <span>Finanzas claras</span>
        </Link>
        <Link className="back-link" href="/dashboard/ahorros">
          ← Todas las metas
        </Link>
      </nav>

      <section className="goal-detail-page">
        <header className="goal-detail-heading">
          <div>
            <span className="eyebrow">Meta de ahorro</span>
            <h1>{goal.name}</h1>
            <p>
              {goal.target_date
                ? `Fecha objetivo: ${new Intl.DateTimeFormat("es-CR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(`${goal.target_date}T00:00:00Z`))}`
                : "Sin fecha límite"}
            </p>
          </div>
          <div className="goal-balance-card">
            <span>Ahorrado hasta hoy</span>
            <strong>{money.format(balance)}</strong>
            <small>
              Faltan{" "}
              {money.format(
                Math.max(0, Number(goal.target_amount) - balance),
              )}
            </small>
          </div>
        </header>

        <div className="goal-progress-card">
          <div>
            <span>Progreso</span>
            <strong>{Math.round(percentage)}%</strong>
          </div>
          <div className="goal-progress goal-progress-large">
            <span
              style={{ backgroundColor: goal.color, width: `${percentage}%` }}
            />
          </div>
          <small>
            Objetivo: {money.format(Number(goal.target_amount))}
            {goal.monthly_target
              ? ` · Aporte mensual sugerido: ${money.format(
                  Number(goal.monthly_target),
                )}`
              : ""}
          </small>
        </div>

        <div className="goal-detail-layout">
          <article className="movement-card">
            <h2>Registrar movimiento</h2>
            <p className="card-intro">
              Sumá un aporte o registrá dinero que retiraste de esta meta.
            </p>
            <SavingsMovementForm goalId={goal.id} today={todayInCostaRica()} />
          </article>

          <article className="movement-card">
            <div className="section-title">
              <h2>Historial</h2>
              <span>{movements?.length ?? 0} movimientos</span>
            </div>
            {movements?.length ? (
              <div className="transaction-list">
                {movements.map((movement) => {
                  const isDeposit = movement.type === "deposit";
                  return (
                    <div className="transaction-row" key={movement.id}>
                      <i
                        className={`transaction-icon ${
                          isDeposit ? "income-dot" : "expense-dot"
                        }`}
                      >
                        {isDeposit ? "+" : "−"}
                      </i>
                      <span className="transaction-copy">
                        <strong>
                          {movement.description ||
                            (isDeposit ? "Aporte" : "Retiro")}
                        </strong>
                        <small>
                          {new Intl.DateTimeFormat("es-CR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            timeZone: "UTC",
                          }).format(
                            new Date(`${movement.movement_date}T00:00:00Z`),
                          )}
                        </small>
                      </span>
                      <strong
                        className={`transaction-amount ${
                          isDeposit ? "income-amount" : "expense-amount"
                        }`}
                      >
                        {isDeposit ? "+" : "−"}
                        {money.format(Number(movement.amount))}
                      </strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="history-empty">
                <strong>Aún no hay aportes</strong>
                <p>Tu historial aparecerá después del primer movimiento.</p>
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
