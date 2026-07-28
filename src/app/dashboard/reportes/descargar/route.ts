import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function validDate(value: string | null) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return new Response("No autorizado", { status: 401 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!validDate(from) || !validDate(to)) {
    return new Response("Fechas inválidas", { status: 400 });
  }

  const normalizedFrom = from! <= to! ? from! : to!;
  const normalizedTo = from! <= to! ? to! : from!;
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select(
      "type, amount, description, transaction_date, expense_kind, categories(name)",
    )
    .eq("user_id", userId)
    .gte("transaction_date", normalizedFrom)
    .lte("transaction_date", normalizedTo)
    .order("transaction_date");

  if (error) {
    return new Response("No se pudo generar el reporte", { status: 500 });
  }

  const header = [
    "Fecha",
    "Tipo",
    "Categoría",
    "Descripción",
    "Tipo de gasto",
    "Monto CRC",
  ];
  const rows = (transactions ?? []).map((transaction) => {
    const category = Array.isArray(transaction.categories)
      ? transaction.categories[0]
      : transaction.categories;
    return [
      transaction.transaction_date,
      transaction.type === "income" ? "Ingreso" : "Gasto",
      category?.name ?? "Sin categoría",
      transaction.description ?? "",
      transaction.expense_kind === "fixed"
        ? "Fijo"
        : transaction.expense_kind === "variable"
          ? "Variable"
          : "",
      Number(transaction.amount).toFixed(2),
    ];
  });
  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reporte-finanzas-${normalizedFrom}-${normalizedTo}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
