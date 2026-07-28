"use client";

import { useActionState } from "react";
import {
  createSavingsGoalAction,
  type SavingsState,
} from "@/app/dashboard/ahorros/actions";

const initialState: SavingsState = {};

export function GoalForm() {
  const [state, action, pending] = useActionState(
    createSavingsGoalAction,
    initialState,
  );

  return (
    <form className="savings-form" action={action}>
      <div className="field savings-wide-field">
        <label htmlFor="name">Nombre de la meta</label>
        <input
          className="auth-input"
          id="name"
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
          min="0.01"
          name="targetAmount"
          placeholder="₡ 500 000"
          required
          step="0.01"
          type="number"
        />
      </div>

      <div className="field">
        <label htmlFor="monthlyTarget">Aporte mensual</label>
        <input
          className="auth-input"
          id="monthlyTarget"
          min="0.01"
          name="monthlyTarget"
          placeholder="Opcional"
          step="0.01"
          type="number"
        />
      </div>

      <div className="field">
        <label htmlFor="targetDate">Fecha objetivo</label>
        <input
          className="auth-input"
          id="targetDate"
          name="targetDate"
          type="date"
        />
      </div>

      <div className="field">
        <label htmlFor="color">Color</label>
        <select
          className="auth-input"
          defaultValue="#176b4d"
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

      <button
        className="button button-primary savings-wide-field"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creando..." : "Crear meta de ahorro"}
      </button>
    </form>
  );
}
