"use client";

export function PrintButton() {
  return (
    <button
      className="button button-secondary"
      onClick={() => window.print()}
      type="button"
    >
      Imprimir / guardar PDF
    </button>
  );
}
