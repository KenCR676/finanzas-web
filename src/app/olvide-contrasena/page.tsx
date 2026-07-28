import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/app/auth/auth-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ForgotPasswordPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link className="brand" href="/">
          <span className="brand-mark">₡</span>
          <span>Finanzas claras</span>
        </Link>
        <div className="auth-card">
          <h1>Recuperá tu acceso.</h1>
          <p>
            Escribí el correo de tu cuenta y te enviaremos un enlace temporal
            para crear una contraseña nueva.
          </p>
          <ForgotPasswordForm />
        </div>
      </section>
      <aside className="auth-art" aria-hidden="true">
        <div className="auth-art-content">
          <blockquote>Tu información sigue siendo tuya.</blockquote>
          <p>
            El enlace de recuperación es temporal y solo permite cambiar la
            contraseña de la cuenta solicitada.
          </p>
        </div>
      </aside>
    </main>
  );
}
