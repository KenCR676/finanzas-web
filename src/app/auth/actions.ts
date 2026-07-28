"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  success?: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function loginAction(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");

  if (!email || !email.includes("@") || !password) {
    return { error: "Ingresá un correo y una contraseña válidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "No pudimos iniciar sesión. Revisá tus datos." };
  }

  redirect("/dashboard");
}

export async function registerAction(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const displayName = readString(formData, "displayName");
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");

  if (displayName.length < 2) {
    return { error: "Ingresá un nombre de al menos 2 caracteres." };
  }

  if (!email || !email.includes("@")) {
    return { error: "Ingresá un correo electrónico válido." };
  }

  if (
    password.length < 8 ||
    !/[A-Za-z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    return {
      error:
        "La contraseña debe tener 8 caracteres, al menos una letra y un número.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) {
    return {
      error: "No pudimos crear la cuenta. Probá con otro correo o más tarde.",
    };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    error:
      "Ese correo ya podría estar registrado. Probá iniciar sesión con tus datos.",
  };
}

export async function requestPasswordResetAction(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = readString(formData, "email").toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Ingresá un correo electrónico válido." };
  }

  const requestHeaders = await headers();
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const forwardedHost =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProtocol =
    requestHeaders.get("x-forwarded-proto") ??
    (forwardedHost?.startsWith("localhost") ? "http" : "https");
  const origin =
    configuredSiteUrl ??
    (forwardedHost
      ? `${forwardedProtocol}://${forwardedHost}`
      : "http://localhost:3000");
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", "/actualizar-contrasena");

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl.toString(),
  });

  return {
    success:
      "Si existe una cuenta con ese correo, recibirás un enlace para cambiar la contraseña.",
  };
}

export async function updatePasswordAction(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = readString(formData, "password");
  const passwordConfirmation = readString(formData, "passwordConfirmation");

  if (
    password.length < 8 ||
    !/[A-Za-z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    return {
      error:
        "La contraseña debe tener 8 caracteres, al menos una letra y un número.",
    };
  }

  if (password !== passwordConfirmation) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims?.sub) {
    return {
      error:
        "El enlace venció o no es válido. Solicitá uno nuevo desde la pantalla de ingreso.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      error: "No pudimos cambiar la contraseña. Solicitá un enlace nuevo.",
    };
  }

  await supabase.auth.signOut();
  redirect("/login?password=updated");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
