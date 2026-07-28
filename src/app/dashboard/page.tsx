import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Resumen mensual" };
export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

function monthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  );
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { start, end } = monthRange();
  const [{ data: profile }, { data: transactions }, { data: goals }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("transactions")
        .select(
          "id, type, amount, description, transaction_date, expense_kind, categories(name, color)",
        )
        .gte("transaction_date", start)
        .lte("transaction_date", end)
        .order("transaction_date", { ascending: false }),
      supabase
        .from("savings_goals")
        .select(
          "id, name, target_amount, color, status, savings_movements(type, amount)",
        )
        .eq("status", "active")
        .limit(3),
    ]);

  const income =
    transactions
      ?.filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount), 0) ?? 0;
  const expenses =
    transactions
      ?.filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Number(item.amount), 0) ?? 0;
  const balance = income - expenses;
  const displayName = profile?.display_name || "Tu cuenta";
  const goalsWithBalance =
    goals?.map((goal) => {
      const saved = goal.savings_movements.reduce(
        (sum, movement) =>
          sum +
          (movement.type === "deposit"
            ? Number(movement.amount)
            : -Number(movement.amount)),
        0,
      );
      return {
        ...goal,
        saved,
        percentage: Math.min(
          100,
          Math.max(0, (saved / Number(goal.target_amount)) * 100),
        ),
      };
    }) ?? [];
  const totalSaved = goalsWithBalance.reduce(
    (sum, goal) => sum + goal.saved,
    0,
  );

  return (
    <main className="dashboard-shell">
      <nav className="dashboard-nav">
        <a className="brand" href="/dashboard">
          <span className="brand-mark">₡</span>
          <span>Finanzas claras</span>
        </a>
        <div className="dashboard-user">
          <div className="user-copy">
            <strong>{displayName}</strong>
            <span>Sesión segura</span>
          </div>
          <form action={logoutAction}>
            <button className="logout-button" type="submit">
              Salir
            </button>
          </form>
        </div>
      </nav>

      <section className="dashboard-main">
        <header className="dashboard-heading">
          <div>
            <span className="eyebrow">Resumen mensual</span>
            <h1>Hola, {displayName}.</h1>
          </div>
          <Link className="button button-primary" href="/dashboard/nuevo">
            + Nuevo movimiento
          </Link>
        </header>

        <div className="dashboard-grid">
          <article className="metric-card">
            <span>Ingresos</span>
            <strong>{money.format(income)}</strong>
            <small>Registrados este mes</small>
          </article>
          <article className="metric-card">
            <span>Gastos</span>
            <strong>{money.format(expenses)}</strong>
            <small>Registrados este mes</small>
          </article>
          <article className="metric-card metric-card-highlight">
            <span>Balance</span>
            <strong>{money.format(balance)}</strong>
            <small>Ingresos menos gastos</small>
          </article>
          <article className="metric-card">
            <span>Ahorro total</span>
            <strong>{money.format(totalSaved)}</strong>
            <small>{goalsWithBalance.length} metas activas</small>
          </article>
        </div>

        <div className="dashboard-content">
          <article className="empty-card movements-card">
            <div className="card-heading">
              <div>
                <h2>Movimientos recientes</h2>
                <span>{transactions?.length ?? 0} este mes</span>
              </div>
              <Link href="/dashboard/nuevo">Agregar</Link>
            </div>
            {transactions?.length ? (
              <div className="transaction-list">
                {transactions.slice(0, 8).map((transaction) => {
                  const category = Array.isArray(transaction.categories)
                    ? transaction.categories[0]
                    : transaction.categories;
                  const isIncome = transaction.type === "income";

                  return (
                    <div className="transaction-row" key={transaction.id}>
                      <i
                        className="transaction-icon"
                        style={{
                          backgroundColor:
                            category?.color ||
                            (isIncome ? "var(--green)" : "var(--orange)"),
                        }}
                      >
                        {isIncome ? "+" : "−"}
                      </i>
                      <span className="transaction-copy">
                        <strong>
                          {transaction.description ||
                            category?.name ||
                            "Sin descripción"}
                        </strong>
                        <small>
                          {category?.name || "Sin categoría"} ·{" "}
                          {new Intl.DateTimeFormat("es-CR", {
                            day: "numeric",
                            month: "short",
                            timeZone: "UTC",
                          }).format(
                            new Date(`${transaction.transaction_date}T00:00:00Z`),
                          )}
                          {transaction.expense_kind
                            ? ` · ${
                                transaction.expense_kind === "fixed"
                                  ? "Fijo"
                                  : "Variable"
                              }`
                            : ""}
                        </small>
                      </span>
                      <strong
                        className={
                          isIncome
                            ? "transaction-amount income-amount"
                            : "transaction-amount expense-amount"
                        }
                      >
                        {isIncome ? "+" : "−"}
                        {money.format(Number(transaction.amount))}
                      </strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <p>
                  Todavía no hay movimientos este mes. Registrá tu primer
                  ingreso o gasto para comenzar.
                </p>
                <Link className="empty-action" href="/dashboard/nuevo">
                  Registrar mi primer movimiento →
                </Link>
              </>
            )}
          </article>

          <article className="empty-card">
            <div className="card-heading">
              <div>
                <h2>Metas de ahorro</h2>
                <span>{goalsWithBalance.length} activas</span>
              </div>
              <Link href="/dashboard/ahorros">Ver todas</Link>
            </div>
            {goalsWithBalance.length ? (
              <div className="dashboard-goals">
                {goalsWithBalance.map((goal) => (
                  <Link
                    className="dashboard-goal"
                    href={`/dashboard/ahorros/${goal.id}`}
                    key={goal.id}
                  >
                    <div>
                      <i style={{ backgroundColor: goal.color }} />
                      <span>{goal.name}</span>
                      <strong>{Math.round(goal.percentage)}%</strong>
                    </div>
                    <div className="goal-progress">
                      <span
                        style={{
                          backgroundColor: goal.color,
                          width: `${goal.percentage}%`,
                        }}
                      />
                    </div>
                    <small>
                      {money.format(goal.saved)} de{" "}
                      {money.format(Number(goal.target_amount))}
                    </small>
                  </Link>
                ))}
              </div>
            ) : (
              <>
                <p>
                  Creá una meta para tu fondo de emergencia, un viaje o
                  cualquier objetivo importante.
                </p>
                <Link className="empty-action" href="/dashboard/ahorros">
                  Crear mi primera meta →
                </Link>
              </>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
