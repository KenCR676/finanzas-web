import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { DashboardOnboarding } from "@/app/dashboard/como-usar/how-to-slides";
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
    analyticsStart: new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
    )
      .toISOString()
      .slice(0, 10),
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { start, end, analyticsStart } = monthRange();
  const [
    { data: profile },
    { data: transactions },
    { data: goals },
    { data: behaviorTransactions },
  ] =
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
      supabase
        .from("transactions")
        .select("type, amount, transaction_date")
        .gte("transaction_date", analyticsStart)
        .lte("transaction_date", end)
        .order("transaction_date"),
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
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() - (5 - index));
    const key = date.toISOString().slice(0, 7);
    return {
      key,
      label: new Intl.DateTimeFormat("es-CR", {
        month: "short",
        timeZone: "UTC",
      })
        .format(date)
        .replace(".", ""),
      income: 0,
      expenses: 0,
    };
  });

  behaviorTransactions?.forEach((transaction) => {
    const month = months.find((item) =>
      transaction.transaction_date.startsWith(item.key),
    );
    if (month) {
      if (transaction.type === "income") {
        month.income += Number(transaction.amount);
      } else {
        month.expenses += Number(transaction.amount);
      }
    }
  });

  const chartMaximum = Math.max(
    1,
    ...months.flatMap((month) => [month.income, month.expenses]),
  );
  const expenseCategories = Array.from(
    (transactions ?? [])
      .filter((transaction) => transaction.type === "expense")
      .reduce((summary, transaction) => {
        const category = Array.isArray(transaction.categories)
          ? transaction.categories[0]
          : transaction.categories;
        const name = category?.name ?? "Sin categoría";
        const current = summary.get(name) ?? {
          name,
          color: category?.color ?? "var(--orange)",
          total: 0,
        };
        current.total += Number(transaction.amount);
        summary.set(name, current);
        return summary;
      }, new Map<string, { name: string; color: string; total: number }>())
      .values(),
  ).sort((a, b) => b.total - a.total);
  const fixedExpenses =
    transactions
      ?.filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.expense_kind === "fixed",
      )
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0) ?? 0;
  const variableExpenses = Math.max(0, expenses - fixedExpenses);

  return (
    <main className="dashboard-shell">
      <DashboardOnboarding />
      <nav className="dashboard-nav">
        <a className="brand" href="/dashboard">
          <span className="brand-mark">₡</span>
          <span>Finanzas claras</span>
        </a>
        <div className="dashboard-user">
          <Link className="help-tab" href="/dashboard/como-usar">
            Cómo usar
          </Link>
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
              <Link href="/dashboard/movimientos">Ver todos</Link>
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
                      <Link
                        className="edit-button"
                        href={`/dashboard/movimientos/${transaction.id}/editar`}
                      >
                        Editar
                      </Link>
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

        <section className="analytics-section">
          <div className="section-title analytics-title">
            <div>
              <span className="eyebrow">Comportamiento</span>
              <h2>Ingresos y gastos</h2>
            </div>
            <span>Últimos 6 meses</span>
          </div>

          <div className="analytics-grid">
            <article className="analytics-card monthly-chart-card">
              <div className="chart-legend">
                <span><i className="income-dot" /> Ingresos</span>
                <span><i className="expense-dot" /> Gastos</span>
              </div>
              <div className="monthly-chart">
                {months.map((month) => (
                  <div className="month-column" key={month.key}>
                    <div className="bar-pair">
                      <i
                        className="income-bar"
                        style={{
                          height: `${Math.max(
                            month.income ? 4 : 0,
                            (month.income / chartMaximum) * 100,
                          )}%`,
                        }}
                        title={`Ingresos: ${money.format(month.income)}`}
                      />
                      <i
                        className="expense-bar"
                        style={{
                          height: `${Math.max(
                            month.expenses ? 4 : 0,
                            (month.expenses / chartMaximum) * 100,
                          )}%`,
                        }}
                        title={`Gastos: ${money.format(month.expenses)}`}
                      />
                    </div>
                    <strong>{month.label}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="analytics-card">
              <h3>Gastos por categoría</h3>
              {expenseCategories.length ? (
                <div className="category-chart">
                  {expenseCategories.slice(0, 5).map((category) => (
                    <div key={category.name}>
                      <div>
                        <span>
                          <i style={{ backgroundColor: category.color }} />
                          {category.name}
                        </span>
                        <strong>{money.format(category.total)}</strong>
                      </div>
                      <div className="category-track">
                        <span
                          style={{
                            backgroundColor: category.color,
                            width: `${expenses ? (category.total / expenses) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="analytics-empty">
                  Registrá gastos para ver su distribución.
                </p>
              )}
            </article>

            <article className="analytics-card expense-kind-card">
              <h3>Fijos vs. variables</h3>
              <div className="expense-kind-summary">
                <div>
                  <span>Gastos fijos</span>
                  <strong>{money.format(fixedExpenses)}</strong>
                  <small>
                    {expenses ? Math.round((fixedExpenses / expenses) * 100) : 0}%
                  </small>
                </div>
                <div>
                  <span>Gastos variables</span>
                  <strong>{money.format(variableExpenses)}</strong>
                  <small>
                    {expenses
                      ? Math.round((variableExpenses / expenses) * 100)
                      : 0}
                    %
                  </small>
                </div>
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}
