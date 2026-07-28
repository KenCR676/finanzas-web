"use client";

import {
  deleteSavingsGoalAction,
  deleteSavingsMovementAction,
} from "@/app/dashboard/ahorros/actions";

export function DeleteGoalButton({ goalId }: { goalId: string }) {
  return (
    <form
      action={deleteSavingsGoalAction}
      className="inline-delete-form"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "¿Eliminar esta meta y todo su historial de aportes y retiros? Esta acción no se puede deshacer.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input name="goalId" type="hidden" value={goalId} />
      <button className="button button-danger button-small" type="submit">
        Eliminar meta
      </button>
    </form>
  );
}

export function DeleteSavingsMovementButton({
  goalId,
  movementId,
}: {
  goalId: string;
  movementId: string;
}) {
  return (
    <form
      action={deleteSavingsMovementAction}
      className="inline-delete-form"
      onSubmit={(event) => {
        if (!window.confirm("¿Eliminar este movimiento de ahorro?")) {
          event.preventDefault();
        }
      }}
    >
      <input name="goalId" type="hidden" value={goalId} />
      <input name="movementId" type="hidden" value={movementId} />
      <button className="delete-text-button" type="submit">
        Borrar
      </button>
    </form>
  );
}
