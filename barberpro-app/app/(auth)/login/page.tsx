"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { z } from "zod";

import { Button } from "@/app/ui/button";
import { Checkbox } from "@/app/ui/checkbox";
import { Input } from "@/app/ui/input";
import { Label } from "@/app/ui/label";
import { signInWithPasswordAction } from "@/lib/supabase/server";

const GENERIC_AUTH_ERROR = "Nao foi possivel autenticar com as credenciais informadas.";

const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Informe um e-mail valido.")
    .max(254, "E-mail invalido."),
  password: z
    .string()
    .min(8, "A senha precisa ter no minimo 8 caracteres.")
    .max(72, "Senha invalida."),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Voce precisa aceitar o consentimento LGPD." }),
  }),
});

type LoginFieldErrors = {
  email?: string;
  password?: string;
  consent?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [authError, setAuthError] = useState<string>("");
  const [consentChecked, setConsentChecked] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");

    const formData = new FormData(event.currentTarget);
    const formInput = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      consent: consentChecked,
    };

    const parsed = loginFormSchema.safeParse(formInput);

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: flattened.email?.[0],
        password: flattened.password?.[0],
        consent: flattened.consent?.[0],
      });
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      const result = await signInWithPasswordAction(parsed.data);

      if (!result.success) {
        setAuthError(result.message ?? GENERIC_AUTH_ERROR);

        if (result.fieldErrors) {
          setFieldErrors({
            email: result.fieldErrors.email?.[0],
            password: result.fieldErrors.password?.[0],
            consent: result.fieldErrors.consent?.[0],
          });
        }

        return;
      }

      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-primary">BarberPro</h1>
        <p className="text-sm text-neutral-400">Acesse sua conta para entrar no painel.</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.com"
            aria-invalid={Boolean(fieldErrors.email)}
            required
          />
          {fieldErrors.email ? (
            <p className="text-xs text-red-400">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="********"
            aria-invalid={Boolean(fieldErrors.password)}
            required
          />
          {fieldErrors.password ? (
            <p className="text-xs text-red-400">{fieldErrors.password}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="consent" className="flex cursor-pointer items-start gap-2 text-sm text-neutral-300">
            <Checkbox
              id="consent"
              checked={consentChecked}
              onCheckedChange={(value) => setConsentChecked(value === true)}
              className="mt-0.5"
            />
            <span>
              Concordo com o tratamento dos meus dados pessoais para autenticacao e seguranca,
              conforme a LGPD.
              {" "}
              <a href="/politica-de-privacidade" className="text-primary underline underline-offset-2">
                Ler politica de privacidade
              </a>
            </span>
          </label>
          {fieldErrors.consent ? (
            <p className="text-xs text-red-400">{fieldErrors.consent}</p>
          ) : null}
        </div>

        {authError ? <p className="text-sm text-red-400">{authError}</p> : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
