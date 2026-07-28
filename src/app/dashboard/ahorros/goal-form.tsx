"use client";

import { useActionState } from "react";
import {
  createSavingsGoalAction,
  type SavingsState,
  updateSavingsGoalAction,
} from "@/app/dashboard/ahorros/actions";

const initialState: SavingsState = {};

export function GoalForm({
  defaultFrequency,
  goal,
}: {
  defaultFrequency: "monthly" | "fortnightly";
  goal?: {
    id: string;
    name: string;
    targetAmount: number;
    monthlyTarget: number | null;
    targetDate: string | null;
    contributionFrequency: "monthly" | "fortnightly";
    color: string;
  };
}) {
  const [state, action, pending] = useActionState(
    goal ? updateSavingsGoalAction : createSavingsGoalAction,
    initialState,
  );

  return (
    <form className="savings-form" action={action}>
      {goal ? <input name="goalId" type="hidden" value={goal.id} /> : null}
      <div className="field savings-wide-field">
        <label htmlFor="name">Nombre de la meta</label>
        <input
          className="auth-input"
          id="name"
          defaultValue={goal?.name}
          maxLength={100}
          minLength={2}
          name="name"
          placeholder="Ejemplo: Fondo de emergencia"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="targetAmount">Monto objetivo</label>
        <input
          className="auth-input"
          id="targetAmount"
          defaultValue={goal?.targetAmount}
          min="0.01"
          name="targetAmount"
          placeholder="₡ 500 000"
          required
          step="0.01"
          type="number"
        />
      </div>

      <div className="field">
        <label htmlFor="monthlyTarget">Aporte periódico</label>
        <input
          className="auth-input"
          id="monthlyTarget"
          defaultValue={goal?.monthlyTarget ?? ""}
          min="0.01"
          name="monthlyTarget"
          placeholder="Opcional"
          step="0.01"
          type="number"
        />
      </div>

      <div className="field">
        <label htmlFor="contributionFrequency">Frecuencia del aporte</label>
        <select
          className="auth-input"
          defaultValue={goal?.contributionFrequency ?? defaultFrequency}
          id="contributionFrequency"
          name="contributionFrequency"
        >
          <option value="monthly">Mensual</option>
          <option value="fortnightly">Quincenal</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="targetDate">Fecha objetivo</label>
        <input
          className="auth-input"
          id="targetDate"
          defaultValue={goal?.targetDate ?? ""}
          name="targetDate"
          type="date"
        />
      </div>

      <div className="field">
        <label htmlFor="color">Color</label>
        <select
          className="auth-input"
          defaultValue={goal?.color ?? "#176b4d"}
          id="color"
          name="color"
        >
          <option value="#176b4d">Verde</option>
          <option value="#dd713d">Naranja</option>
          <option value="#2563eb">Azul</option>
          <option value="#7c3aed">Morado</option>
        </select>
      </div>

      {state.error ? (
        <p
          className="form-message form-message-error savings-wide-field"
          aria-live="polite"
        >
          {state.error}
        </p>
      ) : null}

      {goal ? (
        <div className="movement-actions savings-wide-field">
          <a
            className="button button-secondary"
            href={`/dashboard/ahorros/${goal.id}`}
          >
            Cancelar
          </a>
          <button
            className="button button-primary"
            disabled={pending}
            type="submit"
          >
            {pending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      ) : (
        <button
          className="button button-primary savings-wide-field"
          disabled={pending}
          type="submit"
        >
          {pending ? "Creando..." : "Crear meta de ahorro"}
        </button>
      )}
    </form>
  );
}
