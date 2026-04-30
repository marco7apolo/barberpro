"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const clienteSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(2).max(120),
  telefone: z.string().trim().min(8).max(20),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  cpf: z.string().trim().min(11).max(14).optional().or(z.literal("")),
  data_nascimento: z.string().optional().or(z.literal("")),
  observacoes: z.string().trim().max(1000).optional().or(z.literal("")),
  preferencias: z.string().trim().max(500).optional().or(z.literal("")),
  promocoes_whatsapp: z.enum(["true", "false"]),
  historico_servicos: z.enum(["true", "false"]),
  ativo: z.enum(["true", "false"]),
  criado_por: z.string().uuid().optional().or(z.literal("")),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

function parsePreferencias(preferenciasRaw: string | undefined) {
  const list = (preferenciasRaw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return { tags: list };
}

export async function createCliente(formData: FormData) {
  const parsed = clienteSchema.safeParse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    cpf: formData.get("cpf"),
    data_nascimento: formData.get("data_nascimento"),
    observacoes: formData.get("observacoes"),
    preferencias: formData.get("preferencias"),
    promocoes_whatsapp: formData.get("promocoes_whatsapp"),
    historico_servicos: formData.get("historico_servicos"),
    ativo: formData.get("ativo"),
    criado_por: formData.get("criado_por"),
  });

  if (!parsed.success) {
    throw new Error("Dados invalidos para cadastro de cliente.");
  }

  const supabase = await createSupabaseServerClient();

  const { error: insertError } = await supabase.from("clientes").insert({
    nome: parsed.data.nome,
    telefone: parsed.data.telefone,
    email: parsed.data.email ? parsed.data.email : null,
    cpf: parsed.data.cpf ? parsed.data.cpf : null,
    data_nascimento: parsed.data.data_nascimento ? parsed.data.data_nascimento : null,
    observacoes: parsed.data.observacoes ? parsed.data.observacoes : null,
    preferencias: parsePreferencias(parsed.data.preferencias),
    consentimento_lgpd: {
      promocoes_whatsapp: parsed.data.promocoes_whatsapp === "true",
      historico_servicos: parsed.data.historico_servicos === "true",
    },
    criado_por: parsed.data.criado_por ? parsed.data.criado_por : null,
    ativo: parsed.data.ativo === "true",
  });

  if (insertError) {
    throw new Error("Nao foi possivel salvar o cliente.");
  }

  revalidatePath("/clientes", "layout");
  redirect("/clientes");
}

export async function updateCliente(formData: FormData) {
  const parsed = clienteSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    cpf: formData.get("cpf"),
    data_nascimento: formData.get("data_nascimento"),
    observacoes: formData.get("observacoes"),
    preferencias: formData.get("preferencias"),
    promocoes_whatsapp: formData.get("promocoes_whatsapp"),
    historico_servicos: formData.get("historico_servicos"),
    ativo: formData.get("ativo"),
    criado_por: formData.get("criado_por"),
  });

  if (!parsed.success || !parsed.data.id) {
    throw new Error("Dados invalidos para atualizar cliente.");
  }

  const supabase = await createSupabaseServerClient();

  const { error: updateError } = await supabase
    .from("clientes")
    .update({
      nome: parsed.data.nome,
      telefone: parsed.data.telefone,
      email: parsed.data.email ? parsed.data.email : null,
      cpf: parsed.data.cpf ? parsed.data.cpf : null,
      data_nascimento: parsed.data.data_nascimento ? parsed.data.data_nascimento : null,
      observacoes: parsed.data.observacoes ? parsed.data.observacoes : null,
      preferencias: parsePreferencias(parsed.data.preferencias),
      consentimento_lgpd: {
        promocoes_whatsapp: parsed.data.promocoes_whatsapp === "true",
        historico_servicos: parsed.data.historico_servicos === "true",
      },
      criado_por: parsed.data.criado_por ? parsed.data.criado_por : null,
      ativo: parsed.data.ativo === "true",
    })
    .eq("id", parsed.data.id);

  if (updateError) {
    throw new Error("Nao foi possivel atualizar o cliente.");
  }

  revalidatePath("/clientes", "layout");
  redirect("/clientes");
}

export async function deleteCliente(formData: FormData) {
  const parsed = deleteSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    throw new Error("Identificador invalido para exclusao.");
  }

  const supabase = await createSupabaseServerClient();
  // Soft delete: set ativo=false and record deletion timestamp
  // This preserves appointments and transactions for historical reports
  const { error: deleteError } = await supabase
    .from("clientes")
    .update({ ativo: false, deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  if (deleteError) {
    throw new Error("Nao foi possivel excluir o cliente.");
  }

  revalidatePath("/clientes", "layout");
  redirect("/clientes");
}
