import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/auth/auth-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ingresar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ password?: string }>;
}) {
  const { password } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims?.sub) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link className="brand" href="/">
          <span className="brand-mark">₡</span>
          <span>Finanzas claras</span>
        </Link>
        <div className="auth-card">
          <h1>Bienvenido de vuelta.</h1>
          <p>Ingresá para continuar con tu resumen financiero.</p>
          {password === "updated" ? (
            <p className="form-message form-message-success" aria-live="polite">
              Tu contraseña fue actualizada. Ya podés iniciar sesión.
            </p>
          ) : null}
          <LoginForm />
        </div>
      </section>
      <aside className="auth-art" aria-hidden="true">
        <div className="auth-art-content">
          <blockquote>Más claridad. Menos estrés financiero.</blockquote>
          <p>
            Tus gastos, ingresos y ahorros reunidos en un solo lugar, siempre
            disponibles.
          </p>
        </div>
      </aside>
    </main>
  );
}
