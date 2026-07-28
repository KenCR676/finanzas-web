"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  {
    number: "01",
    title: "Revisá tu resumen",
    description:
      "Al entrar verás tus ingresos, gastos, balance y total en sobres en una sola pantalla.",
    action: "El balance se calcula automáticamente.",
    visual: "summary",
  },
  {
    number: "02",
    title: "Registrá cada movimiento",
    description:
      "Usá “Nuevo movimiento” para guardar el monto, la fecha, la categoría y si el gasto es fijo o variable.",
    action: "Registrá los datos cuando ocurren para mantenerlos al día.",
    visual: "movement",
  },
  {
    number: "03",
    title: "Corregí cualquier error",
    description:
      "Entrá en “Ver todos”, buscá el registro y pulsá “Editar” para cambiar cualquier dato.",
    action: "Los totales y gráficos se recalculan al guardar.",
    visual: "edit",
  },
  {
    number: "04",
    title: "Creá sobres de ahorro",
    description:
      "Separá dinero por propósito y registrá aportes o retiros sin establecer un monto ni una fecha límite.",
    action: "Cada sobre muestra su saldo y el historial completo.",
    visual: "savings",
  },
  {
    number: "05",
    title: "Entendé tu comportamiento",
    description:
      "Compará ingresos y gastos de los últimos seis meses y descubrí en qué categorías gastás más.",
    action: "Usá los gráficos para tomar mejores decisiones.",
    visual: "charts",
  },
] as const;

function SlideVisual({ type }: { type: (typeof slides)[number]["visual"] }) {
  return (
    <div className={`guide-visual guide-visual-${type}`} aria-hidden="true">
      {type === "summary" ? (
        <>
          <span className="guide-mini-card" />
          <span className="guide-mini-card" />
          <span className="guide-mini-card guide-mini-highlight" />
          <span className="guide-mini-card" />
        </>
      ) : null}
      {type === "movement" ? (
        <>
          <strong>₡</strong>
          <span className="guide-form-line" />
          <span className="guide-form-line guide-form-line-short" />
          <i>Guardar</i>
        </>
      ) : null}
      {type === "edit" ? (
        <>
          <span className="guide-list-line"><i /> <b /></span>
          <span className="guide-list-line"><i /> <b /></span>
          <span className="guide-list-line guide-list-selected"><i /> <b /></span>
        </>
      ) : null}
      {type === "savings" ? (
        <>
          <span className="guide-goal-circle">₡</span>
          <div>
            <strong>Fondo de emergencia</strong>
            <i><b /></i>
          </div>
        </>
      ) : null}
      {type === "charts" ? (
        <div className="guide-bars">
          {[38, 62, 48, 78, 57, 88].map((height, index) => (
            <span key={height}>
              <i style={{ height: `${height}%` }} />
              <b style={{ height: `${Math.max(20, height - 18)}%` }} />
              <small>{index + 1}</small>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function HowToSlides({
  onFinish,
  modal = false,
}: {
  onFinish?: () => void;
  modal?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const slide = slides[current];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrent((value) => (value + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, []);

  function next() {
    if (current === slides.length - 1) {
      onFinish?.();
      return;
    }
    setCurrent((value) => value + 1);
  }

  return (
    <div className={`guide-slider ${modal ? "guide-slider-modal" : ""}`}>
      <div className="guide-progress" aria-label={`Paso ${current + 1} de ${slides.length}`}>
        {slides.map((item, index) => (
          <button
            aria-label={`Ir al paso ${index + 1}: ${item.title}`}
            className={index === current ? "active" : ""}
            key={item.number}
            onClick={() => setCurrent(index)}
            type="button"
          />
        ))}
      </div>

      <div className="guide-slide">
        <div className="guide-slide-copy">
          <span className="guide-step">Paso {slide.number}</span>
          <h2>{slide.title}</h2>
          <p>{slide.description}</p>
          <small>{slide.action}</small>
        </div>
        <SlideVisual type={slide.visual} />
      </div>

      <div className="guide-controls">
        <button
          className="button button-secondary"
          disabled={current === 0}
          onClick={() => setCurrent((value) => Math.max(0, value - 1))}
          type="button"
        >
          Anterior
        </button>
        <span>{current + 1} / {slides.length}</span>
        {current === slides.length - 1 && !onFinish ? (
          <Link className="button button-primary" href="/dashboard">
            Ir al resumen
          </Link>
        ) : (
          <button className="button button-primary" onClick={next} type="button">
            {current === slides.length - 1 ? "Empezar" : "Siguiente"}
          </button>
        )}
      </div>
    </div>
  );
}

export function DashboardOnboarding() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setOpen(window.localStorage.getItem("finanzas-guide-v1") !== "done");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  function finish() {
    window.localStorage.setItem("finanzas-guide-v1", "done");
    setOpen(false);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="guide-overlay" role="dialog" aria-modal="true" aria-label="Cómo usar Finanzas claras">
      <div className="guide-dialog">
        <div className="guide-dialog-top">
          <div>
            <span className="eyebrow">Guía rápida</span>
            <h1>Empezá en menos de un minuto</h1>
          </div>
          <button className="guide-skip" onClick={finish} type="button">
            Omitir guía
          </button>
        </div>
        <HowToSlides modal onFinish={finish} />
      </div>
    </div>
  );
}
