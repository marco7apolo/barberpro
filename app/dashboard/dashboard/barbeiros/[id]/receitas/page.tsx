import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/Card";
import { Badge } from "@/app/ui/badge";
import { Button } from "@/app/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ArrowLeft, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function toCurrencyBRL(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateBR(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimeBR(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function getStatusBadge(status: string) {
  const variants: Record<string, string> = {
    pago: "bg-green-500/20 text-green-400 border-green-500/30",
    pendente: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    estornado: "bg-red-500/20 text-red-400 border-red-500/30",
    cancelado: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
  };
  return variants[status] ?? "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
}

function getPagamentoLabel(forma: string | null) {
  if (!forma) return "Nao informado";
  const labels: Record<string, string> = {
    pix: "PIX",
    cartao_credito: "Cartao credito",
    cartao_debito: "Cartao debito",
    dinheiro: "Dinheiro",
    fiado: "Fiado",
  };
  return labels[forma] ?? forma;
}

export default async function BarbeiroReceitasPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();

  const { data: barbeiro } = await supabase
    .from("barbeiros")
    .select("id, nome_exibicao, comissao_percent")
    .eq("id", params.id)
    .single();

  if (!barbeiro) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/barbeiros">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>
        <Card>
          <CardContent>
            <p className="text-red-400">Barbeiro nao encontrado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: transacoes } = await supabase
    .from("transacoes")
    .select(
      "id, agendamento_id, valor, forma_pagamento, status, descricao, created_at, processado_em",
    )
    .eq("tipo", "receita")
    .order("created_at", { ascending: false });

  const agendamentoIds = (transacoes ?? []).map((t) => t.agendamento_id).filter(Boolean);

  const { data: agendamentos } = agendamentoIds.length > 0
    ? await supabase
        .from("agendamentos")
        .select("id, barbeiro_id, cliente_id, servico_id, data_inicio, status, valor_total")
        .in("id", agendamentoIds)
    : { data: [] };

  const agendamentoMap = new Map((agendamentos ?? []).map((a) => [a.id, a]));

  const clienteIds = Array.from(
    new Set((agendamentos ?? []).map((a) => a.cliente_id).filter(Boolean)),
  );
  const servicoIds = Array.from(
    new Set((agendamentos ?? []).map((a) => a.servico_id).filter(Boolean)),
  );

  const [{ data: clientes }, { data: servicos }] = await Promise.all([
    clienteIds.length > 0
      ? supabase.from("clientes").select("id, nome").in("id", clienteIds)
      : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
    servicoIds.length > 0
      ? supabase.from("servicos").select("id, nome").in("id", servicoIds)
      : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
  ]);

  const clienteMap = new Map((clientes ?? []).map((c) => [c.id, c.nome]));
  const servicoMap = new Map((servicos ?? []).map((s) => [s.id, s.nome]));

  const transacoesDoBarbeiro = (transacoes ?? []).filter((t) => {
    const ag = agendamentoMap.get(t.agendamento_id);
    return ag?.barbeiro_id === params.id;
  });

  const diarioMap = new Map<string, typeof transacoesDoBarbeiro>();
  for (const t of transacoesDoBarbeiro) {
    const dateKey = formatDateBR(t.created_at);
    if (!diarioMap.has(dateKey)) {
      diarioMap.set(dateKey, []);
    }
    diarioMap.get(dateKey)!.push(t);
  }

  const receitaTotal = transacoesDoBarbeiro.reduce(
    (acc, t) => acc + (t.status === "pago" ? Number(t.valor ?? 0) : 0),
    0,
  );
  const receitaPendente = transacoesDoBarbeiro.reduce(
    (acc, t) => acc + (t.status === "pendente" ? Number(t.valor ?? 0) : 0),
    0,
  );
  const comissaoEstimada = receitaTotal * (Number(barbeiro.comissao_percent) / 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/barbeiros">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-primary">Receitas - {barbeiro.nome_exibicao}</h1>
          <p className="text-muted-foreground">
            Comissao: {barbeiro.comissao_percent}% | Receitas vinculadas aos agendamentos deste barbeiro
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total (pago)</p>
                <p className="text-2xl text-green-500">{toCurrencyBRL(receitaTotal)}</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-green-500">
                <DollarSign size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Pendente</p>
                <p className="text-2xl text-yellow-400">{toCurrencyBRL(receitaPendente)}</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-yellow-400">
                <Calendar size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comissao Estimada ({barbeiro.comissao_percent}%)</p>
                <p className="text-2xl text-primary">{toCurrencyBRL(comissaoEstimada)}</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-primary">
                <DollarSign size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {diarioMap.size === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Nenhuma receita encontrada para este barbeiro.</p>
          </CardContent>
        </Card>
      ) : (
        Array.from(diarioMap.entries()).map(([dateKey, itens]) => {
          const totalDia = itens.reduce(
            (acc, t) => acc + (t.status === "pago" ? Number(t.valor ?? 0) : 0),
            0,
          );

          return (
            <Card key={dateKey}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{dateKey}</CardTitle>
                  <span className="text-sm font-medium text-green-500">{toCurrencyBRL(totalDia)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {itens.map((t) => {
                    const ag = agendamentoMap.get(t.agendamento_id);
                    const clienteNome = ag ? clienteMap.get(ag.cliente_id) ?? "N/A" : "N/A";
                    const servicoNome = ag ? servicoMap.get(ag.servico_id) ?? "N/A" : "N/A";
                    const horario = ag ? formatTimeBR(ag.data_inicio) : "--:--";

                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3"
                      >
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">
                            {clienteNome} - {servicoNome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {horario} | {getPagamentoLabel(t.forma_pagamento)}
                          </p>
                          {t.descricao ? (
                            <p className="text-xs text-muted-foreground">{t.descricao}</p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{toCurrencyBRL(Number(t.valor ?? 0))}</p>
                          <Badge
                            variant="outline"
                            className={`mt-1 text-xs ${getStatusBadge(t.status)}`}
                          >
                            {t.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
