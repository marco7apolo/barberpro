"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const agendamentoSchema = z.object({
  id: z.string().uuid().optional(),
  cliente_id: z.string().uuid(),
  barbeiro_id: z.string().uuid(),
  servico_id: z.string().uuid(),
  data_inicio: z.string().min(1),
  data_fim: z.string().min(1),
  status: z.enum(["pendente", "confirmado", "em_andamento", "concluido", "cancelado", "no_show"]),
  observacoes: z.string().trim().max(1000).optional().or(z.literal("")),
  valor_total: z.coerce.number().min(0),
  gorjeta: z.coerce.number().min(0),
  forma_pagamento: z.enum(["", "pix", "cartao_credito", "cartao_debito", "dinheiro", "fiado"]),
  pago: z.enum(["true", "false"]),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

function localDateTimeToIso(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Data/hora invalida.");
  }

  return date.toISOString();
}

async function syncTransacao(
  agendamentoId: string,
  valorTotal: number,
  formaPagamento: string,
  pago: boolean,
) {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("transacoes")
    .select("id")
    .eq("agendamento_id", agendamentoId)
    .limit(1)
    .maybeSingle();

  const payload = {
    agendamento_id: agendamentoId,
    tipo: "receita",
    valor: valorTotal,
    forma_pagamento: formaPagamento || null,
    descricao: "Pagamento vinculado ao agendamento",
    status: pago ? "pago" : "pendente",
    processado_em: pago ? new Date().toISOString() : null,
  };

  if (existing?.id) {
    await supabase.from("transacoes").update(payload).eq("id", existing.id);
    return;
  }

  await supabase.from("transacoes").insert(payload);
}

export async function createAgendamento(formData: FormData) {
  const parsed = agendamentoSchema.safeParse({
    cliente_id: formData.get("cliente_id"),
    barbeiro_id: formData.get("barbeiro_id"),
    servico_id: formData.get("servico_id"),
    data_inicio: formData.get("data_inicio"),
    data_fim: formData.get("data_fim"),
    status: formData.get("status"),
    observacoes: formData.get("observacoes"),
    valor_total: formData.get("valor_total"),
    gorjeta: formData.get("gorjeta"),
    forma_pagamento: formData.get("forma_pagamento"),
    pago: formData.get("pago"),
  });

  if (!parsed.success) {
    throw new Error("Dados invalidos para cadastro de agendamento.");
  }

  const dataInicioIso = localDateTimeToIso(parsed.data.data_inicio);
  const dataFimIso = localDateTimeToIso(parsed.data.data_fim);

  const supabase = await createSupabaseServerClient();
  const { data: created, error: insertError } = await supabase
    .from("agendamentos")
    .insert({
      cliente_id: parsed.data.cliente_id,
      barbeiro_id: parsed.data.barbeiro_id,
      servico_id: parsed.data.servico_id,
      data_inicio: dataInicioIso,
      data_fim: dataFimIso,
      status: parsed.data.status,
      observacoes: parsed.data.observacoes ? parsed.data.observacoes : null,
      valor_total: parsed.data.valor_total,
      gorjeta: parsed.data.gorjeta,
      forma_pagamento: parsed.data.forma_pagamento || null,
      pago: parsed.data.pago === "true",
    })
    .select("id")
    .single();

  if (insertError || !created?.id) {
    throw new Error("Nao foi possivel salvar o agendamento.");
  }

  await syncTransacao(
    created.id,
    parsed.data.valor_total,
    parsed.data.forma_pagamento,
    parsed.data.pago === "true",
  );

  revalidatePath("/agendamentos", "layout");
  revalidatePath("/dashboard", "layout");
  redirect("/agendamentos");
}

export async function updateAgendamento(formData: FormData) {
  const parsed = agendamentoSchema.safeParse({
    id: formData.get("id"),
    cliente_id: formData.get("cliente_id"),
    barbeiro_id: formData.get("barbeiro_id"),
    servico_id: formData.get("servico_id"),
    data_inicio: formData.get("data_inicio"),
    data_fim: formData.get("data_fim"),
    status: formData.get("status"),
    observacoes: formData.get("observacoes"),
    valor_total: formData.get("valor_total"),
    gorjeta: formData.get("gorjeta"),
    forma_pagamento: formData.get("forma_pagamento"),
    pago: formData.get("pago"),
  });

  if (!parsed.success || !parsed.data.id) {
    throw new Error("Dados invalidos para atualizar agendamento.");
  }

  const dataInicioIso = localDateTimeToIso(parsed.data.data_inicio);
  const dataFimIso = localDateTimeToIso(parsed.data.data_fim);

  const supabase = await createSupabaseServerClient();
  const { error: updateError } = await supabase
    .from("agendamentos")
    .update({
      cliente_id: parsed.data.cliente_id,
      barbeiro_id: parsed.data.barbeiro_id,
      servico_id: parsed.data.servico_id,
      data_inicio: dataInicioIso,
      data_fim: dataFimIso,
      status: parsed.data.status,
      observacoes: parsed.data.observacoes ? parsed.data.observacoes : null,
      valor_total: parsed.data.valor_total,
      gorjeta: parsed.data.gorjeta,
      forma_pagamento: parsed.data.forma_pagamento || null,
      pago: parsed.data.pago === "true",
    })
    .eq("id", parsed.data.id);

  if (updateError) {
    throw new Error("Nao foi possivel atualizar o agendamento.");
  }

  await syncTransacao(
    parsed.data.id,
    parsed.data.valor_total,
    parsed.data.forma_pagamento,
    parsed.data.pago === "true",
  );

  revalidatePath("/agendamentos", "layout");
  revalidatePath("/dashboard", "layout");
  redirect("/agendamentos");
}

export async function deleteAgendamento(formData: FormData) {
  const parsed = deleteSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    throw new Error("Identificador invalido para exclusao.");
  }

  const supabase = await createSupabaseServerClient();
  const { error: deleteError } = await supabase
    .from("agendamentos")
    .delete()
    .eq("id", parsed.data.id);

  if (deleteError) {
    throw new Error("Nao foi possivel excluir o agendamento.");
  }

  revalidatePath("/agendamentos", "layout");
  revalidatePath("/dashboard", "layout");
  redirect("/agendamentos");
}
