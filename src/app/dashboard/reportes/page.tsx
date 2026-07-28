import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PrintButton } from "@/app/dashboard/reportes/print-button";
import { currentPeriod, normalizePeriodMode } from "@/lib/periods";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reportes" };
export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

function validDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("period_mode")
    .eq("id", userId)
    .maybeSingle();
  const periodMode = normalizePeriodMode(profile?.period_mode);
  const defaultRange = currentPeriod(periodMode);
  const from = validDate(query.from) ? query.from! : defaultRange.start;
  const to = validDate(query.to) ? query.to! : defaultRange.end;
  const normalizedFrom = from <= to ? from : to;
  const normalizedTo = from <= to ? to : from;

  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      "id, type, amount, description, transaction_date, expense_kind, categories(name, color)",
    )
    .eq("user_id", userId)
    .gte("transaction_date", normalizedFrom)
    .lte("transaction_date", normalizedTo)
    .order("transaction_date", { ascending: false });

  const income =
    transactions
      ?.filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0) ?? 0;
  const expenses =
    transactions
      ?.filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0) ?? 0;
  const balance = income - expenses;

  return (
    <main className="movement-shell">
      <nav className="dashboard-nav no-print">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">₡</span>
          <span>Finanzas claras</span>
        </Link>
        <Link className="back-link" href="/dashboard">
          ← Volver al resumen
        </Link>
      </nav>

      <section className="reports-page">
        <header className="reports-heading">
          <div>
            <span className="eyebrow">Análisis descargable</span>
            <h1>Reportes financieros</h1>
            <p>
              Elegí un rango de fechas para revisar y descargar tus ingresos,
              gastos y balance.
            </p>
          </div>
        </header>

        <form className="report-filters no-print" method="get">
          <div className="field">
            <label htmlFor="from">Desde</label>
            <input
              className="auth-input"
              defaultValue={normalizedFrom}
              id="from"
              name="from"
              required
              type="date"
            />
          </div>
          <div className="field">
            <label htmlFor="to">Hasta</label>
            <input
              className="auth-input"
              defaultValue={normalizedTo}
              id="to"
              name="to"
              required
              type="date"
            />
          </div>
          <button className="button button-primary" type="submit">
            Aplicar fechas
          </button>
        </form>

        <div className="report-summary">
          <article>
            <span>Ingresos</span>
            <strong className="income-amount">{money.format(income)}</strong>
          </article>
          <article>
            <span>Gastos</span>
            <strong className="expense-amount">{money.format(expenses)}</strong>
          </article>
          <article className="report-balance">
            <span>Balance</span>
            <strong>{money.format(balance)}</strong>
          </article>
        </div>

        <div className="report-actions no-print">
          <a
            className="button button-primary"
            href={`/dashboard/reportes/descargar?from=${normalizedFrom}&to=${normalizedTo}`}
          >
            Descargar CSV
          </a>
          <PrintButton />
        </div>

        <article className="movement-card report-table-card">
          <div className="section-title">
            <div>
              <h2>Detalle del reporte</h2>
              <small>
                {normalizedFrom} al {normalizedTo}
              </small>
            </div>
            <span>{transactions?.length ?? 0} registros</span>
          </div>

          {transactions?.length ? (
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => {
                    const category = Array.isArray(transaction.categories)
                      ? transaction.categories[0]
                      : transaction.categories;
                    const isIncome = transaction.type === "income";
                    return (
                      <tr key={transaction.id}>
                        <td>{transaction.transaction_date}</td>
                        <td>
                          {transaction.description || "Sin descripción"}
                        </td>
                        <td>{category?.name || "Sin categoría"}</td>
                        <td>{isIncome ? "Ingreso" : "Gasto"}</td>
                        <td
                          className={
                            isIncome ? "income-amount" : "expense-amount"
                          }
                        >
                          {isIncome ? "+" : "−"}
                          {money.format(Number(transaction.amount))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="history-empty">
              <strong>No hay datos en estas fechas</strong>
              <p>Probá seleccionando un rango diferente.</p>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
