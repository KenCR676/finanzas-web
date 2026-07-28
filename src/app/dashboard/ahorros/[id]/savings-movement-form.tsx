"use client";

import { useActionState, useState } from "react";
import {
  createSavingsMovementAction,
  type SavingsState,
  updateSavingsMovementAction,
} from "@/app/dashboard/ahorros/actions";

const initialState: SavingsState = {};

export function SavingsMovementForm({
  goalId,
  today,
  movement,
}: {
  goalId: string;
  today: string;
  movement?: {
    id: string;
    type: "deposit" | "withdrawal";
    amount: number;
    movementDate: string;
    description: string;
  };
}) {
  const [type, setType] = useState<"deposit" | "withdrawal">(
    movement?.type ?? "deposit",
  );
  const [state, action, pending] = useActionState(
    movement ? updateSavingsMovementAction : createSavingsMovementAction,
    initialState,
  );

  return (
    <form className="movement-form" action={action}>
      <input name="goalId" type="hidden" value={goalId} />
      {movement ? (
        <input name="movementId" type="hidden" value={movement.id} />
      ) : null}

      <fieldset className="movement-kind">
        <legend>Movimiento</legend>
        <label className={type === "deposit" ? "selected" : ""}>
          <input
            checked={type === "deposit"}
            name="type"
            onChange={() => setType("deposit")}
            type="radio"
            value="deposit"
          />
          <span className="movement-kind-icon income-kind-icon">+</span>
          <span>
            <strong>Aporte</strong>
            <small>Sumar al sobre</small>
          </span>
        </label>
        <label className={type === "withdrawal" ? "selected" : ""}>
          <input
            checked={type === "withdrawal"}
            name="type"
            onChange={() => setType("withdrawal")}
            type="radio"
            value="withdrawal"
          />
          <span className="movement-kind-icon expense-kind-icon">−</span>
          <span>
            <strong>Retiro</strong>
            <small>Usar parte del sobre</small>
          </span>
        </label>
      </fieldset>

      <div className="field">
        <label htmlFor="amount">Monto</label>
        <div className="amount-input compact-amount">
          <span>₡</span>
          <input
            id="amount"
            defaultValue={movement?.amount}
            min="0.01"
            name="amount"
            placeholder="0"
            required
            step="0.01"
            type="number"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="movementDate">Fecha</label>
        <input
          className="auth-input"
          defaultValue={movement?.movementDate ?? today}
          id="movementDate"
          name="movementDate"
          required
          type="date"
        />
      </div>

      <div className="field">
        <label htmlFor="description">Descripción</label>
        <input
          className="auth-input"
          id="description"
          defaultValue={movement?.description}
          maxLength={240}
          name="description"
          placeholder="Opcional"
          type="text"
        />
      </div>

      {state.error ? (
        <p className="form-message form-message-error" aria-live="polite">
          {state.error}
        </p>
      ) : null}

      {movement ? (
        <div className="movement-actions">
          <a
            className="button button-secondary"
            href={`/dashboard/ahorros/${goalId}`}
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
          className="button button-primary button-full"
          disabled={pending}
          type="submit"
        >
          {pending
            ? "Guardando..."
            : type === "deposit"
              ? "Guardar aporte"
              : "Guardar retiro"}
        </button>
      )}
    </form>
  );
}
