import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/app/auth/auth-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegisterPage() {
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
          <h1>Empezá a ordenar tus finanzas.</h1>
          <p>Creá tu cuenta gratuita. Te tomará menos de un minuto.</p>
          <RegisterForm />
        </div>
      </section>
      <aside className="auth-art" aria-hidden="true">
        <div className="auth-art-content">
          <blockquote>Un plan sencillo para cada colón.</blockquote>
          <p>
            Convertí cada registro en una decisión más consciente para vos y
            tus sobres de ahorro.
          </p>
        </div>
      </aside>
    </main>
  );
}
