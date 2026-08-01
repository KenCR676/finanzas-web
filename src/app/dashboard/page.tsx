import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { updatePeriodModeAction } from "@/app/dashboard/actions";
import { DashboardOnboarding } from "@/app/dashboard/como-usar/how-to-slides";
import {
  currentPeriod,
  normalizePeriodMode,
  recentPeriods,
  todayInCostaRica,
} from "@/lib/periods";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mi billetera" };
export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, period_mode")
    .eq("id", userId)
    .maybeSingle();
  const periodMode = normalizePeriodMode(profile?.period_mode);
  const { start, end, label: periodLabel } = currentPeriod(periodMode);
  const periods = recentPeriods(periodMode);
  const analyticsStart = periods[0].start;
  const today = todayInCostaRica();
  const [
    { data: transactions },
    { data: walletBalanceData },
    { data: goals },
    { data: behaviorTransactions },
  ] =
    await Promise.all([
      supabase
        .from("transactions")
        .select(
          "id, type, amount, description, transaction_date, expense_kind, categories(name, color)",
        )
        .eq("user_id", userId)
        .gte("transaction_date", start)
        .lte("transaction_date", end)
        .order("transaction_date", { ascending: false }),
      supabase.rpc("current_wallet_balance", { balance_date: today }),
      supabase
        .from("savings_goals")
        .select(
          "id, name, color, status, savings_movements(type, amount)",
        )
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(3),
      supabase
        .from("transactions")
        .select("type, amount, transaction_date")
        .eq("user_id", userId)
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
  const periodBalance = income - expenses;
  const walletBalance = Number(walletBalanceData ?? 0);
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
        movementCount: goal.savings_movements.length,
      };
    }) ?? [];
  const totalSaved = goalsWithBalance.reduce(
    (sum, goal) => sum + goal.saved,
    0,
  );
  const chartPeriods = periods.map((period) => ({
    ...period,
    income: 0,
    expenses: 0,
  }));

  behaviorTransactions?.forEach((transaction) => {
    const period = chartPeriods.find(
      (item) =>
        transaction.transaction_date >= item.start &&
        transaction.transaction_date <= item.end,
    );
    if (period) {
      if (transaction.type === "income") {
        period.income += Number(transaction.amount);
      } else {
        period.expenses += Number(transaction.amount);
      }
    }
  });

  const chartMaximum = Math.max(
    1,
    ...chartPeriods.flatMap((period) => [period.income, period.expenses]),
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
          <Link className="help-tab" href="/dashboard/reportes">
            Reportes
          </Link>
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
            <span className="eyebrow">
              Resumen {periodMode === "monthly" ? "mensual" : "quincenal"}
            </span>
            <h1>Hola, {displayName}.</h1>
            <p className="period-caption">{periodLabel}</p>
          </div>
          <div className="dashboard-heading-actions">
            <form className="period-selector" action={updatePeriodModeAction}>
              <button
                className={periodMode === "monthly" ? "active" : ""}
                name="periodMode"
                type="submit"
                value="monthly"
              >
                Mensual
              </button>
              <button
                className={periodMode === "fortnightly" ? "active" : ""}
                name="periodMode"
                type="submit"
                value="fortnightly"
              >
                Quincenal
              </button>
            </form>
            <Link className="button button-primary" href="/dashboard/nuevo">
              + Nuevo movimiento
            </Link>
          </div>
        </header>

        <div className="dashboard-grid">
          <article className="metric-card">
            <span>Ingresos</span>
            <strong>{money.format(income)}</strong>
            <small>En el periodo seleccionado</small>
          </article>
          <article className="metric-card">
            <span>Gastos</span>
            <strong>{money.format(expenses)}</strong>
            <small>En el periodo seleccionado</small>
          </article>
          <article className="metric-card metric-card-highlight">
            <span>Saldo en billetera</span>
            <strong>{money.format(walletBalance)}</strong>
            <small>
              No se reinicia · Este periodo: {periodBalance >= 0 ? "+" : ""}
              {money.format(periodBalance)}
            </small>
          </article>
          <article className="metric-card">
            <span>Total en sobres</span>
            <strong>{money.format(totalSaved)}</strong>
            <small>{goalsWithBalance.length} sobres activos</small>
          </article>
        </div>

        <div className="dashboard-content">
          <article className="empty-card movements-card">
            <div className="card-heading">
              <div>
                <h2>Movimientos recientes</h2>
                <span>{transactions?.length ?? 0} en este periodo</span>
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
                  Todavía no hay movimientos en este periodo. Registrá tu primer
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
                <h2>Sobres de ahorro</h2>
                <span>{goalsWithBalance.length} activos</span>
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
                      <strong>{money.format(goal.saved)}</strong>
                    </div>
                    <small>
                      {goal.movementCount} movimientos registrados
                    </small>
                  </Link>
                ))}
              </div>
            ) : (
              <>
                <p>
                  Creá un sobre para separar dinero para emergencias, viajes o
                  cualquier propósito.
                </p>
                <Link className="empty-action" href="/dashboard/ahorros">
                  Crear mi primer sobre →
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
              <span>
                Últimas 6 {periodMode === "monthly" ? "mensualidades" : "quincenas"}
              </span>
          </div>

          <div className="analytics-grid">
            <article className="analytics-card monthly-chart-card">
              <div className="chart-legend">
                <span><i className="income-dot" /> Ingresos</span>
                <span><i className="expense-dot" /> Gastos</span>
              </div>
              <div className="monthly-chart">
                {chartPeriods.map((period) => (
                  <div className="month-column" key={period.key}>
                    <div className="bar-pair">
                      <i
                        className="income-bar"
                        style={{
                          height: `${Math.max(
                            period.income ? 4 : 0,
                            (period.income / chartMaximum) * 100,
                          )}%`,
                        }}
                        title={`Ingresos: ${money.format(period.income)}`}
                      />
                      <i
                        className="expense-bar"
                        style={{
                          height: `${Math.max(
                            period.expenses ? 4 : 0,
                            (period.expenses / chartMaximum) * 100,
                          )}%`,
                        }}
                        title={`Gastos: ${money.format(period.expenses)}`}
                      />
                    </div>
                    <strong>{period.shortLabel}</strong>
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
