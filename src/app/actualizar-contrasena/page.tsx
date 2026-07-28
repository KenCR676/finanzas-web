import type { Metadata } from "next";
import Link from "next/link";
import { UpdatePasswordForm } from "@/app/auth/auth-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nueva contraseña" };
export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const hasRecoverySession = Boolean(data?.claims?.sub);

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link className="brand" href="/">
          <span className="brand-mark">₡</span>
          <span>Finanzas claras</span>
        </Link>
        <div className="auth-card">
          <h1>Creá una contraseña nueva.</h1>
          <p>
            Elegí una contraseña diferente y difícil de adivinar para proteger
            tu información.
          </p>
          {hasRecoverySession ? (
            <UpdatePasswordForm />
          ) : (
            <>
              <p className="form-message form-message-error">
                El enlace venció o no es válido. Solicitá uno nuevo para
                continuar.
              </p>
              <Link
                className="button button-primary button-full"
                href="/olvide-contrasena"
              >
                Solicitar otro enlace
              </Link>
            </>
          )}
        </div>
      </section>
      <aside className="auth-art" aria-hidden="true">
        <div className="auth-art-content">
          <blockquote>Un acceso renovado y seguro.</blockquote>
          <p>
            Al guardar la contraseña nueva, cerraremos la sesión de recuperación
            y podrás volver a ingresar normalmente.
          </p>
        </div>
      </aside>
    </main>
  );
}
