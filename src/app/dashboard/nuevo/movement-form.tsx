"use client";

import { useActionState, useState } from "react";
import {
  createMovementAction,
  type MovementState,
} from "@/app/dashboard/actions";

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
};

const initialState: MovementState = {};

export function MovementForm({
  categories,
  today,
}: {
  categories: Category[];
  today: string;
}) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [state, action, pending] = useActionState(
    createMovementAction,
    initialState,
  );
  const filteredCategories = categories.filter(
    (category) => category.type === type,
  );

  return (
    <form className="movement-form" action={action}>
      <fieldset className="movement-kind">
        <legend>Tipo de movimiento</legend>
        <label className={type === "expense" ? "selected" : ""}>
          <input
            checked={type === "expense"}
            name="type"
            onChange={() => setType("expense")}
            type="radio"
            value="expense"
          />
          <span className="movement-kind-icon expense-kind-icon">−</span>
          <span>
            <strong>Gasto</strong>
            <small>Dinero que salió</small>
          </span>
        </label>
        <label className={type === "income" ? "selected" : ""}>
          <input
            checked={type === "income"}
            name="type"
            onChange={() => setType("income")}
            type="radio"
            value="income"
          />
          <span className="movement-kind-icon income-kind-icon">+</span>
          <span>
            <strong>Ingreso</strong>
            <small>Dinero que entró</small>
          </span>
        </label>
      </fieldset>

      <div className="movement-fields">
        <div className="field amount-field">
          <label htmlFor="amount">Monto</label>
          <div className="amount-input">
            <span>₡</span>
            <input
              autoFocus
              id="amount"
              inputMode="decimal"
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
          <label htmlFor="transactionDate">Fecha</label>
          <input
            className="auth-input"
            defaultValue={today}
            id="transactionDate"
            name="transactionDate"
            required
            type="date"
          />
        </div>

        <div className="field">
          <label htmlFor="categoryId">Categoría</label>
          <select
            className="auth-input"
            id="categoryId"
            key={type}
            name="categoryId"
            required
          >
            <option value="">Seleccioná una categoría</option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {type === "expense" ? (
          <div className="field">
            <label htmlFor="expenseKind">Tipo de gasto</label>
            <select
              className="auth-input"
              defaultValue="variable"
              id="expenseKind"
              name="expenseKind"
              required
            >
              <option value="variable">Variable</option>
              <option value="fixed">Fijo</option>
            </select>
          </div>
        ) : null}

        <div className="field movement-description">
          <label htmlFor="description">Descripción</label>
          <input
            className="auth-input"
            id="description"
            maxLength={240}
            name="description"
            placeholder={
              type === "expense"
                ? "Ejemplo: Compra del supermercado"
                : "Ejemplo: Salario de este mes"
            }
            type="text"
          />
          <span className="field-hint">Opcional, máximo 240 caracteres.</span>
        </div>
      </div>

      {state.error ? (
        <p className="form-message form-message-error" aria-live="polite">
          {state.error}
        </p>
      ) : null}

      <div className="movement-actions">
        <a className="button button-secondary" href="/dashboard">
          Cancelar
        </a>
        <button
          className="button button-primary"
          disabled={pending}
          type="submit"
        >
          {pending ? "Guardando..." : "Guardar movimiento"}
        </button>
      </div>
    </form>
  );
}
