"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const barberSchema = z.object({
  id: z.string().uuid().optional(),
  nome_exibicao: z.string().trim().min(2).max(120),
  cpf: z.string().trim().min(11).max(14),
  telefone: z.string().trim().min(8).max(20),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  especialidades: z.string().trim().min(2).max(300),
  comissao_percent: z.coerce.number().min(0).max(100),
  valor_minimo_servico: z.coerce.number().min(0),
  ativo: z.enum(["true", "false"]),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function createBarbeiro(formData: FormData) {
  const parsed = barberSchema.safeParse({
    nome_exibicao: formData.get("nome_exibicao"),
    cpf: formData.get("cpf"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    especialidades: formData.get("especialidades"),
    comissao_percent: formData.get("comissao_percent"),
    valor_minimo_servico: formData.get("valor_minimo_servico"),
    ativo: formData.get("ativo"),
  });

  if (!parsed.success) {
    throw new Error("Dados invalidos para cadastro de barbeiro.");
  }

  const supabase = await createSupabaseServerClient();
  const especialidadesArray = parsed.data.especialidades
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const { error: insertError } = await supabase.from("barbeiros").insert({
    nome_exibicao: parsed.data.nome_exibicao,
    cpf: parsed.data.cpf,
    telefone: parsed.data.telefone,
    email: parsed.data.email ? parsed.data.email : null,
    especialidades: especialidadesArray,
    comissao_percent: parsed.data.comissao_percent,
    valor_minimo_servico: parsed.data.valor_minimo_servico,
    ativo: parsed.data.ativo === "true",
  });

  if (insertError) {
    throw new Error(`Nao foi possivel salvar o barbeiro. Erro: ${insertError.message}`);
  }

  revalidatePath("/dashboard/barbeiros", "layout");
  redirect("/dashboard/barbeiros");
}

export async function updateBarbeiro(formData: FormData) {
  const parsed = barberSchema.safeParse({
    id: formData.get("id"),
    nome_exibicao: formData.get("nome_exibicao"),
    cpf: formData.get("cpf"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    especialidades: formData.get("especialidades"),
    comissao_percent: formData.get("comissao_percent"),
    valor_minimo_servico: formData.get("valor_minimo_servico"),
    ativo: formData.get("ativo"),
  });

  if (!parsed.success || !parsed.data.id) {
    throw new Error("Dados invalidos para atualizar barbeiro.");
  }

  const supabase = await createSupabaseServerClient();
  const especialidadesArray = parsed.data.especialidades
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const { error: updateError } = await supabase
    .from("barbeiros")
    .update({
      nome_exibicao: parsed.data.nome_exibicao,
      cpf: parsed.data.cpf,
      telefone: parsed.data.telefone,
      email: parsed.data.email ? parsed.data.email : null,
      especialidades: especialidadesArray,
      comissao_percent: parsed.data.comissao_percent,
      valor_minimo_servico: parsed.data.valor_minimo_servico,
      ativo: parsed.data.ativo === "true",
    })
    .eq("id", parsed.data.id);

  if (updateError) {
    throw new Error("Nao foi possivel atualizar o barbeiro.");
  }

  revalidatePath("/dashboard/barbeiros", "layout");
  redirect("/dashboard/barbeiros");
}

export async function deleteBarbeiro(formData: FormData) {
  const parsed = deleteSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    throw new Error("Identificador invalido para exclusao.");
  }

  const supabase = await createSupabaseServerClient();
  const { error: deleteError } = await supabase
    .from("barbeiros")
    .delete()
    .eq("id", parsed.data.id);

  if (deleteError) {
    throw new Error(`Nao foi possivel excluir o barbeiro. Erro: ${deleteError.message}`);
  }

  revalidatePath("/dashboard/barbeiros", "layout");
  redirect("/dashboard/barbeiros");
}
