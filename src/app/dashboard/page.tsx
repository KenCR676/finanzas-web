import type { Metadata } from "next";
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
        .select("type, amount, description, transaction_date")
        .gte("transaction_date", start)
        .lte("transaction_date", end)
        .order("transaction_date", { ascending: false }),
      supabase
        .from("savings_goals")
        .select("id, name, target_amount, status")
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
          <button className="button button-primary" type="button">
            + Nuevo movimiento
          </button>
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
            <span>Metas activas</span>
            <strong>{goals?.length ?? 0}</strong>
            <small>Objetivos de ahorro</small>
          </article>
        </div>

        <div className="dashboard-content">
          <article className="empty-card">
            <h2>Movimientos recientes</h2>
            {transactions?.length ? (
              <div className="category-list">
                {transactions.slice(0, 5).map((transaction, index) => (
                  <div className="category-row" key={`${transaction.transaction_date}-${index}`}>
                    <span>
                      <i
                        className={`category-swatch ${
                          transaction.type === "income"
                            ? "income-dot"
                            : "expense-dot"
                        }`}
                      />
                      {transaction.description || "Sin descripción"}
                    </span>
                    <strong>{money.format(Number(transaction.amount))}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p>
                  Todavía no hay movimientos este mes. El próximo paso será
                  agregar el formulario para registrar el primero.
                </p>
                <span className="empty-action">Tu historial aparecerá aquí →</span>
              </>
            )}
          </article>

          <article className="empty-card">
            <h2>Metas de ahorro</h2>
            {goals?.length ? (
              <div className="category-list">
                {goals.map((goal) => (
                  <div className="category-row" key={goal.id}>
                    <span>{goal.name}</span>
                    <strong>{money.format(Number(goal.target_amount))}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p>
                  Creá una meta para tu fondo de emergencia, un viaje o
                  cualquier objetivo importante.
                </p>
                <span className="empty-action">Prepará tu primera meta →</span>
              </>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
