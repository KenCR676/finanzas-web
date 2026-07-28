"use client";

import { useActionState } from "react";
import {
  createSavingsGoalAction,
  type SavingsState,
  updateSavingsGoalAction,
} from "@/app/dashboard/ahorros/actions";

const initialState: SavingsState = {};

export function GoalForm({
  goal,
}: {
  goal?: {
    id: string;
    name: string;
    description: string;
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
        <label htmlFor="name">Nombre del sobre</label>
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

      <div className="field savings-wide-field">
        <label htmlFor="description">Descripción</label>
        <textarea
          className="auth-input"
          id="description"
          defaultValue={goal?.description}
          maxLength={240}
          name="description"
          placeholder="Opcional: ¿para qué querés separar este dinero?"
          rows={3}
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
          {pending ? "Creando..." : "Crear sobre de ahorro"}
        </button>
      )}
    </form>
  );
}
