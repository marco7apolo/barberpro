import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/Card";
import { Input } from "@/app/ui/input";
import { Label } from "@/app/ui/label";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { DeleteButton, FormWithReload } from "../components/FormWithReload";
import { createAgendamento, deleteAgendamento, updateAgendamento } from "./actions";

export const dynamic = "force-dynamic";

function toCurrencyBRL(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export default async function AgendamentosPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: clientes }, { data: barbeiros }, { data: servicos }] = await Promise.all([
    supabase.from("clientes").select("id, nome").eq("ativo", true).order("nome", { ascending: true }),
    supabase
      .from("barbeiros")
      .select("id, nome_exibicao")
      .eq("ativo", true)
      .order("nome_exibicao", { ascending: true }),
    supabase
      .from("servicos")
      .select("id, nome, preco")
      .eq("ativo", true)
      .order("nome", { ascending: true }),
  ]);

  const { data: agendamentos, error } = await supabase
    .from("agendamentos")
    .select(
      "id, cliente_id, barbeiro_id, servico_id, data_inicio, data_fim, status, observacoes, valor_total, gorjeta, forma_pagamento, pago",
    )
    .order("data_inicio", { ascending: false })
    .limit(50);

  const clientesMap = new Map((clientes ?? []).map((cliente) => [cliente.id, cliente.nome]));
  const barbeirosMap = new Map((barbeiros ?? []).map((barbeiro) => [barbeiro.id, barbeiro.nome_exibicao]));
  const servicosMap = new Map((servicos ?? []).map((servico) => [servico.id, servico.nome]));

  const defaultClienteId = clientes?.[0]?.id ?? "";
  const defaultBarbeiroId = barbeiros?.[0]?.id ?? "";
  const defaultServicoId = servicos?.[0]?.id ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-primary">Agendamentos</h1>
        <p className="text-muted-foreground">CRUD completo integrado com transacoes financeiras.</p>
      </div>

      {error ? (
        <Card>
          <CardContent>
            <p className="text-sm text-red-400">Erro ao carregar agendamentos: {error.message}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Novo agendamento</CardTitle>
        </CardHeader>
        <CardContent>
          <FormWithReload action={createAgendamento} className="grid grid-cols-1 gap-4 lg:grid-cols-5" submitLabel="Criar agendamento" fullSpan>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <select
                name="cliente_id"
                defaultValue={defaultClienteId}
                required
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              >
                {(clientes ?? []).map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Barbeiro</Label>
              <select
                name="barbeiro_id"
                defaultValue={defaultBarbeiroId}
                required
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              >
                {(barbeiros ?? []).map((barbeiro) => (
                  <option key={barbeiro.id} value={barbeiro.id}>
                    {barbeiro.nome_exibicao}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Servico</Label>
              <select
                name="servico_id"
                defaultValue={defaultServicoId}
                required
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              >
                {(servicos ?? []).map((servico) => (
                  <option key={servico.id} value={servico.id}>
                    {servico.nome} - {toCurrencyBRL(Number(servico.preco))}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Inicio</Label>
              <Input id="data_inicio" name="data_inicio" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_fim">Fim</Label>
              <Input id="data_fim" name="data_fim" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                name="status"
                defaultValue="pendente"
                required
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              >
                <option value="pendente">Pendente</option>
                <option value="confirmado">Confirmado</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluido</option>
                <option value="cancelado">Cancelado</option>
                <option value="no_show">No show</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_total">Valor total (R$)</Label>
              <Input id="valor_total" name="valor_total" type="number" min={0} step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gorjeta">Gorjeta (R$)</Label>
              <Input id="gorjeta" name="gorjeta" type="number" min={0} step="0.01" defaultValue="0" required />
            </div>
            <div className="space-y-2">
              <Label>Pagamento</Label>
              <select
                name="forma_pagamento"
                defaultValue=""
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              >
                <option value="">Nao informado</option>
                <option value="pix">PIX</option>
                <option value="cartao_credito">Cartao credito</option>
                <option value="cartao_debito">Cartao debito</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="fiado">Fiado</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Pago</Label>
              <select
                name="pago"
                defaultValue="false"
                required
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              >
                <option value="false">Nao</option>
                <option value="true">Sim</option>
              </select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="observacoes">Observacoes</Label>
              <Input id="observacoes" name="observacoes" />
            </div>
          </FormWithReload>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {(agendamentos ?? []).map((agendamento) => (
          <Card key={agendamento.id}>
            <CardContent>
              <FormWithReload action={updateAgendamento} className="grid grid-cols-1 gap-4 lg:grid-cols-5" submitLabel="Salvar">
                <input type="hidden" name="id" value={agendamento.id} />
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <select
                    name="cliente_id"
                    defaultValue={agendamento.cliente_id}
                    required
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                  >
                    {(clientes ?? []).map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Barbeiro</Label>
                  <select
                    name="barbeiro_id"
                    defaultValue={agendamento.barbeiro_id}
                    required
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                  >
                    {(barbeiros ?? []).map((barbeiro) => (
                      <option key={barbeiro.id} value={barbeiro.id}>
                        {barbeiro.nome_exibicao}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Servico</Label>
                  <select
                    name="servico_id"
                    defaultValue={agendamento.servico_id}
                    required
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                  >
                    {(servicos ?? []).map((servico) => (
                      <option key={servico.id} value={servico.id}>
                        {servico.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Inicio</Label>
                  <Input name="data_inicio" type="datetime-local" defaultValue={toLocalDateTimeInput(agendamento.data_inicio)} required />
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input name="data_fim" type="datetime-local" defaultValue={toLocalDateTimeInput(agendamento.data_fim)} required />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    name="status"
                    defaultValue={agendamento.status}
                    required
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="concluido">Concluido</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="no_show">No show</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Valor total (R$)</Label>
                  <Input name="valor_total" type="number" min={0} step="0.01" defaultValue={String(agendamento.valor_total)} required />
                </div>
                <div className="space-y-2">
                  <Label>Gorjeta (R$)</Label>
                  <Input name="gorjeta" type="number" min={0} step="0.01" defaultValue={String(agendamento.gorjeta)} required />
                </div>
                <div className="space-y-2">
                  <Label>Pagamento</Label>
                  <select
                    name="forma_pagamento"
                    defaultValue={agendamento.forma_pagamento ?? ""}
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                  >
                    <option value="">Nao informado</option>
                    <option value="pix">PIX</option>
                    <option value="cartao_credito">Cartao credito</option>
                    <option value="cartao_debito">Cartao debito</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="fiado">Fiado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Pago</Label>
                  <select
                    name="pago"
                    defaultValue={agendamento.pago ? "true" : "false"}
                    required
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                  >
                    <option value="false">Nao</option>
                    <option value="true">Sim</option>
                  </select>
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Observacoes</Label>
                  <Input name="observacoes" defaultValue={agendamento.observacoes ?? ""} />
                </div>
              </FormWithReload>

              <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Cliente: {clientesMap.get(agendamento.cliente_id) ?? "N/A"} | Barbeiro: {barbeirosMap.get(agendamento.barbeiro_id) ?? "N/A"} | Servico: {servicosMap.get(agendamento.servico_id) ?? "N/A"}
                </span>
                <DeleteButton action={deleteAgendamento} recordId={agendamento.id} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
