"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizePeriodMode } from "@/lib/periods";

export type MovementState = {
  error?: string;
};

export async function updatePeriodModeAction(formData: FormData) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const periodMode = normalizePeriodMode(formData.get("periodMode"));
  await supabase
    .from("profiles")
    .update({ period_mode: periodMode })
    .eq("id", userId);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/movimientos");
  revalidatePath("/dashboard/ahorros");
  revalidatePath("/dashboard/reportes");
  redirect("/dashboard");
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createMovementAction(
  _previousState: MovementState,
  formData: FormData,
): Promise<MovementState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const type = readString(formData, "type");
  const amountText = readString(formData, "amount").replace(",", ".");
  const amount = Number(amountText);
  const categoryId = readString(formData, "categoryId");
  const description = readString(formData, "description");
  const transactionDate = readString(formData, "transactionDate");
  const expenseKind = readString(formData, "expenseKind");

  if (type !== "income" && type !== "expense") {
    return { error: "Seleccioná si es un ingreso o un gasto." };
  }

  if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999999.99) {
    return { error: "Ingresá un monto mayor que cero." };
  }

  if (!categoryId) {
    return { error: "Seleccioná una categoría." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
    return { error: "Seleccioná una fecha válida." };
  }

  if (description.length > 240) {
    return { error: "La descripción no puede superar 240 caracteres." };
  }

  const { data: category } = await supabase
    .from("categories")
    .select("id, type")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!category || category.type !== type) {
    return { error: "La categoría seleccionada no es válida." };
  }

  const normalizedExpenseKind =
    type === "expense" &&
    (expenseKind === "fixed" || expenseKind === "variable")
      ? expenseKind
      : null;

  if (type === "expense" && !normalizedExpenseKind) {
    return { error: "Indicá si el gasto es fijo o variable." };
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    category_id: categoryId,
    type,
    amount,
    description: description || null,
    transaction_date: transactionDate,
    expense_kind: normalizedExpenseKind,
  });

  if (error) {
    return {
      error: "No pudimos guardar el movimiento. Intentá nuevamente.",
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?guardado=1");
}

export async function updateMovementAction(
  _previousState: MovementState,
  formData: FormData,
): Promise<MovementState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const movementId = readString(formData, "movementId");
  const type = readString(formData, "type");
  const amount = Number(readString(formData, "amount").replace(",", "."));
  const categoryId = readString(formData, "categoryId");
  const description = readString(formData, "description");
  const transactionDate = readString(formData, "transactionDate");
  const expenseKind = readString(formData, "expenseKind");

  if (!movementId) {
    return { error: "No encontramos el movimiento que querés editar." };
  }

  if (type !== "income" && type !== "expense") {
    return { error: "Seleccioná si es un ingreso o un gasto." };
  }

  if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999999.99) {
    return { error: "Ingresá un monto mayor que cero." };
  }

  if (!categoryId) {
    return { error: "Seleccioná una categoría." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
    return { error: "Seleccioná una fecha válida." };
  }

  if (description.length > 240) {
    return { error: "La descripción no puede superar 240 caracteres." };
  }

  const { data: category } = await supabase
    .from("categories")
    .select("id, type")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!category || category.type !== type) {
    return { error: "La categoría seleccionada no es válida." };
  }

  const normalizedExpenseKind =
    type === "expense" &&
    (expenseKind === "fixed" || expenseKind === "variable")
      ? expenseKind
      : null;

  if (type === "expense" && !normalizedExpenseKind) {
    return { error: "Indicá si el gasto es fijo o variable." };
  }

  const { data: existingMovement } = await supabase
    .from("transactions")
    .select("id")
    .eq("id", movementId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingMovement) {
    return { error: "No encontramos el movimiento que querés editar." };
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      category_id: categoryId,
      type,
      amount,
      description: description || null,
      transaction_date: transactionDate,
      expense_kind: normalizedExpenseKind,
    })
    .eq("id", movementId)
    .eq("user_id", userId);

  if (error) {
    return { error: "No pudimos actualizar el movimiento." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/movimientos");
  revalidatePath(`/dashboard/movimientos/${movementId}/editar`);
  redirect("/dashboard/movimientos?actualizado=1");
}
