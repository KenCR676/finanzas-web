"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  loginAction,
  registerAction,
  type AuthState,
} from "@/app/auth/actions";

const initialState: AuthState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form className="auth-form" action={action}>
      <div className="field">
        <label htmlFor="email">Correo electrónico</label>
        <input
          className="auth-input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nombre@correo.com"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <input
          className="auth-input"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          required
        />
      </div>
      {state.error ? (
        <p className="form-message form-message-error" aria-live="polite">
          {state.error}
        </p>
      ) : null}
      <button
        className="button button-primary button-full"
        disabled={pending}
        type="submit"
      >
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
      <p className="auth-switch">
        ¿Todavía no tenés cuenta? <Link href="/registro">Crear una</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);

  return (
    <form className="auth-form" action={action}>
      <div className="field">
        <label htmlFor="displayName">Nombre</label>
        <input
          className="auth-input"
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          placeholder="¿Cómo querés que te llamemos?"
          minLength={2}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="email">Correo electrónico</label>
        <input
          className="auth-input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nombre@correo.com"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <input
          className="auth-input"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          minLength={8}
          required
        />
        <span className="field-hint">
          Usá al menos 8 caracteres, una letra y un número.
        </span>
      </div>
      {state.error ? (
        <p className="form-message form-message-error" aria-live="polite">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="form-message form-message-success" aria-live="polite">
          {state.success}
        </p>
      ) : null}
      <button
        className="button button-primary button-full"
        disabled={pending || Boolean(state.success)}
        type="submit"
      >
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>
      <p className="auth-switch">
        ¿Ya tenés cuenta? <Link href="/login">Ingresar</Link>
      </p>
    </form>
  );
}
