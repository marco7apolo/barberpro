"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { z } from "zod";

const GENERIC_AUTH_ERROR = "Nao foi possivel autenticar com as credenciais informadas.";
const DEFAULT_BARBEARIA_ID = "00000000-0000-0000-0000-000000000001";

const authPayloadSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Informe um e-mail valido.")
    .max(254, "E-mail invalido."),
  password: z
    .string()
    .min(8, "Senha invalida.")
    .max(72, "Senha invalida."),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consentimento LGPD obrigatorio." }),
  }),
});

async function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "As variaveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY sao obrigatorias.",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

export async function createSupabaseServerClient() {
  const { supabaseUrl, supabaseAnonKey } = await getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Em Server Components, setAll pode disparar erro durante render.
        }
      },
    },
  });
}

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function ensureBootstrapProfile(user: User) {
  const supabase = await createSupabaseServerClient();

  const nomePadrao = user.email?.split("@")[0]?.trim() || "Administrador";

  const { error } = await supabase.from("perfis").upsert(
    {
      id: user.id,
      nome: nomePadrao,
      cargo: "admin",
      ativo: true,
      barbearia_id: DEFAULT_BARBEARIA_ID,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error("Nao foi possivel preparar o perfil administrativo do usuario.");
  }
}

export async function signInWithPasswordAction(payload: unknown) {
  const parsedPayload = authPayloadSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return {
      success: false,
      message: GENERIC_AUTH_ERROR,
      fieldErrors: parsedPayload.error.flatten().fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsedPayload.data.email,
    password: parsedPayload.data.password,
  });

  if (error) {
    return {
      success: false,
      message: GENERIC_AUTH_ERROR,
      fieldErrors: null,
    };
  }

  return {
    success: true,
    message: "Login realizado com sucesso.",
    fieldErrors: null,
  };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  return { success: true };
}
