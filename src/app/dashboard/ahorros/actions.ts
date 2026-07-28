"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizePeriodMode } from "@/lib/periods";

export type SavingsState = {
  error?: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readAmount(formData: FormData, key: string) {
  return Number(readString(formData, key).replace(",", "."));
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  return { supabase, userId };
}

export async function createSavingsGoalAction(
  _previousState: SavingsState,
  formData: FormData,
): Promise<SavingsState> {
  const { supabase, userId } = await getAuthenticatedUser();
  const name = readString(formData, "name");
  const targetAmount = readAmount(formData, "targetAmount");
  const monthlyTargetText = readString(formData, "monthlyTarget");
  const monthlyTarget = monthlyTargetText
    ? Number(monthlyTargetText.replace(",", "."))
    : null;
  const targetDate = readString(formData, "targetDate");
  const color = readString(formData, "color");
  const contributionFrequency = normalizePeriodMode(
    readString(formData, "contributionFrequency"),
  );

  if (name.length < 2 || name.length > 100) {
    return { error: "Ingresá un nombre de entre 2 y 100 caracteres." };
  }

  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    return { error: "Ingresá un monto objetivo mayor que cero." };
  }

  if (
    monthlyTarget !== null &&
    (!Number.isFinite(monthlyTarget) || monthlyTarget <= 0)
  ) {
    return { error: "El aporte mensual debe ser mayor que cero." };
  }

  if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return { error: "Seleccioná una fecha objetivo válida." };
  }

  const allowedColors = ["#176b4d", "#dd713d", "#2563eb", "#7c3aed"];
  const selectedColor = allowedColors.includes(color) ? color : allowedColors[0];

  const { error } = await supabase.from("savings_goals").insert({
    user_id: userId,
    name,
    target_amount: targetAmount,
    target_date: targetDate || null,
    monthly_target: monthlyTarget,
    contribution_frequency: contributionFrequency,
    color: selectedColor,
  });

  if (error) {
    return { error: "No pudimos crear la meta. Intentá nuevamente." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ahorros");
  redirect("/dashboard/ahorros");
}

export async function createSavingsMovementAction(
  _previousState: SavingsState,
  formData: FormData,
): Promise<SavingsState> {
  const { supabase, userId } = await getAuthenticatedUser();
  const goalId = readString(formData, "goalId");
  const type = readString(formData, "type");
  const amount = readAmount(formData, "amount");
  const movementDate = readString(formData, "movementDate");
  const description = readString(formData, "description");

  if (type !== "deposit" && type !== "withdrawal") {
    return { error: "Seleccioná si es un aporte o un retiro." };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Ingresá un monto mayor que cero." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(movementDate)) {
    return { error: "Seleccioná una fecha válida." };
  }

  if (description.length > 240) {
    return { error: "La descripción no puede superar 240 caracteres." };
  }

  const { data: goal } = await supabase
    .from("savings_goals")
    .select("id")
    .eq("id", goalId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!goal) {
    return { error: "No encontramos esta meta de ahorro." };
  }

  if (type === "withdrawal") {
    const { data: movements } = await supabase
      .from("savings_movements")
      .select("type, amount")
      .eq("savings_goal_id", goalId)
      .eq("user_id", userId);
    const balance =
      movements?.reduce(
        (sum, movement) =>
          sum +
          (movement.type === "deposit"
            ? Number(movement.amount)
            : -Number(movement.amount)),
        0,
      ) ?? 0;

    if (amount > balance) {
      return { error: "El retiro no puede superar el ahorro disponible." };
    }
  }

  const { error } = await supabase.from("savings_movements").insert({
    user_id: userId,
    savings_goal_id: goalId,
    type,
    amount,
    movement_date: movementDate,
    description: description || null,
  });

  if (error) {
    return { error: "No pudimos guardar el movimiento de ahorro." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ahorros");
  revalidatePath(`/dashboard/ahorros/${goalId}`);
  redirect(`/dashboard/ahorros/${goalId}`);
}
