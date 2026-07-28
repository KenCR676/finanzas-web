import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mis movimientos" };
export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

export default async function MovementsPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      "id, type, amount, description, transaction_date, expense_kind, categories(name, color)",
    )
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .limit(100);

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

      <section className="history-page">
        <header className="history-heading">
          <div>
            <span className="eyebrow">Historial</span>
            <h1>Ingresos y gastos</h1>
            <p>
              Revisá tus últimos registros y corregí cualquier dato cuando lo
              necesités.
            </p>
          </div>
          <Link className="button button-primary" href="/dashboard/nuevo">
            + Nuevo movimiento
          </Link>
        </header>

        <article className="movement-card">
          <div className="section-title">
            <h2>Todos los movimientos</h2>
            <span>{transactions?.length ?? 0} registros</span>
          </div>

          {transactions?.length ? (
            <div className="history-list">
              {transactions.map((transaction) => {
                const category = Array.isArray(transaction.categories)
                  ? transaction.categories[0]
                  : transaction.categories;
                const isIncome = transaction.type === "income";
                return (
                  <div className="history-row" key={transaction.id}>
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
                          month: "long",
                          year: "numeric",
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
                      className={`transaction-amount ${
                        isIncome ? "income-amount" : "expense-amount"
                      }`}
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
            <div className="history-empty">
              <strong>No hay movimientos registrados</strong>
              <p>Agregá tu primer ingreso o gasto para comenzar.</p>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
