import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims?.sub) {
    redirect("/dashboard");
  }

  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link className="brand" href="/">
          <span className="brand-mark">₡</span>
          <span>Finanzas claras</span>
        </Link>
        <div className="nav-actions">
          <Link className="button button-ghost" href="/login">
            Ingresar
          </Link>
          <Link className="button button-primary button-small" href="/registro">
            Crear cuenta
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Tu dinero, sin complicaciones</span>
          <h1>Entendé hoy lo que pasa con tu dinero.</h1>
          <p>
            Registrá ingresos, gastos y sobres de ahorro. Obtené un resumen
            mensual sencillo para tomar mejores decisiones.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/registro">
              Empezar gratis
            </Link>
            <Link className="button button-secondary" href="/login">
              Ya tengo una cuenta
            </Link>
          </div>
          <div className="trust-row">
            <span>✓ Datos privados por usuario</span>
            <span>✓ Sin tarjeta</span>
          </div>
        </div>

        <div className="preview-card" aria-label="Vista previa del resumen mensual">
          <div className="preview-header">
            <div>
              <span className="preview-label">Resumen mensual</span>
              <strong>Julio 2026</strong>
            </div>
            <span className="status-pill">Al día</span>
          </div>
          <div className="preview-balance">
            <span>Balance disponible</span>
            <strong>₡375.000</strong>
            <small>+12% frente al mes anterior</small>
          </div>
          <div className="preview-stats">
            <div>
              <span className="stat-dot income-dot" />
              <span>Ingresos</span>
              <strong>₡850.000</strong>
            </div>
            <div>
              <span className="stat-dot expense-dot" />
              <span>Gastos</span>
              <strong>₡475.000</strong>
            </div>
          </div>
          <div className="savings-preview">
            <div>
              <span>Sobre: Fondo de emergencia</span>
              <strong>₡425.000</strong>
            </div>
            <small>Dinero disponible cuando lo necesités</small>
          </div>
        </div>
      </section>

      <section className="feature-strip">
        <article>
          <span className="feature-number">01</span>
          <h2>Registrá</h2>
          <p>Ingresos y gastos fijos o variables en pocos segundos.</p>
        </article>
        <article>
          <span className="feature-number">02</span>
          <h2>Entendé</h2>
          <p>Un resumen mensual claro, sin hojas de cálculo complicadas.</p>
        </article>
        <article>
          <span className="feature-number">03</span>
          <h2>Separá</h2>
          <p>Organizá tus ahorros en sobres y controlá cada aporte o retiro.</p>
        </article>
      </section>
    </main>
  );
}
