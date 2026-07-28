"use server";

import { redirect } from "next/navigation";
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

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
