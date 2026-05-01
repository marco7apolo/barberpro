import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/Card";
import { Badge } from "@/app/ui/badge";
import { Label } from "@/app/ui/label";
import { DateFilter } from "./DateFilter";
import { Button } from "@/app/ui/button";
import { FileDown, CalendarDays, DollarSign, Users, Scissors } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function toCurrencyBRL(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
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
    concluido: "bg-green-500/20 text-green-400 border-green-500/30",
    em_andamento: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    confirmado: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    no_show: "bg-red-500/20 text-red-400 border-red-500/30",
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

interface BarberRevenue {
  nome: string;
  ativo: boolean;
  receitaPago: number;
  receitaPendente: number;
  countPago: number;
  countPendente: number;
}

export default async function RelatorioDiarioPage({ searchParams }: { searchParams: { data?: string } }) {
  const dateParam = searchParams.data ?? new Date().toISOString().split("T")[0];
  const supabase = await createSupabaseServerClient();

  const { data: agendamentosDoDia } = await supabase
    .from("agendamentos")
    .select("id, barbeiro_id, cliente_id, servico_id, data_inicio, data_fim, status, valor_total, gorjeta, forma_pagamento, pago, observacoes")
    .gte("data_inicio", dateParam)
    .lt("data_inicio", new Date(new Date(dateParam).getTime() + 86400000).toISOString())
    .order("data_inicio", { ascending: true });

  const { data: barbeiros } = await supabase
    .from("barbeiros")
    .select("id, nome_exibicao, comissao_percent, ativo")
    .order("nome_exibicao", { ascending: true });

  const agendamentoIds = (agendamentosDoDia ?? []).map((a) => a.id).filter(Boolean);
  const clienteIds = Array.from(new Set((agendamentosDoDia ?? []).map((a) => a.cliente_id).filter(Boolean)));
  const servicoIds = Array.from(new Set((agendamentosDoDia ?? []).map((a) => a.servico_id).filter(Boolean)));

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
  const barbeirosMap = new Map<string, string>();
  for (const b of barbeiros ?? []) {
    barbeirosMap.set(b.id, b.nome_exibicao);
  }

  const revenueByBarber = new Map<string, BarberRevenue>();

  let receitaTotalGeral = 0;
  let receitaPendenteGeral = 0;
  let countPago = 0;
  let countPendente = 0;

  for (const ag of agendamentosDoDia ?? []) {
    const barbeiroId = ag.barbeiro_id;
    const nome = barbeiroId ? (barbeirosMap.get(barbeiroId) ?? "(Barbeiro excluido)") : "(Barbeiro excluido)";

    if (!revenueByBarber.has(barbeiroId ?? "deleted")) {
      revenueByBarber.set(barbeiroId ?? "deleted", {
        nome,
        ativo: !!barbeiroId && (barbeiros ?? []).some((b) => b.id === barbeiroId && b.ativo),
        receitaPago: 0,
        receitaPendente: 0,
        countPago: 0,
        countPendente: 0,
      });
    }

    const barberRev = revenueByBarber.get(barbeiroId ?? "deleted")!;
    const valor = Number(ag.valor_total ?? 0);
    const gorjeta = Number(ag.gorjeta ?? 0);

    if (ag.pago) {
      barberRev.receitaPago += valor + gorjeta;
      barberRev.countPago++;
      countPago++;
      receitaTotalGeral += valor + gorjeta;
    } else {
      barberRev.receitaPendente += valor + gorjeta;
      barberRev.countPendente++;
      countPendente++;
      receitaPendenteGeral += valor + gorjeta;
    }
  }

  const { count: barbeirosAdicionadosCount } = await supabase
    .from("barbeiros")
    .select("*", { count: "exact", head: true })
    .gte("created_at", dateParam)
    .lt("created_at", new Date(new Date(dateParam).getTime() + 86400000).toISOString());

  const { count: barbeirosExcluidosCount } = await supabase
    .from("barbeiros")
    .select("*", { count: "exact", head: true })
    .is("barbeiro_id", null)
    .gte("updated_at", dateParam)
    .lt("updated_at", new Date(new Date(dateParam).getTime() + 86400000).toISOString());

  const { count: clientesAdicionadosCount } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true })
    .gte("created_at", dateParam)
    .lt("created_at", new Date(new Date(dateParam).getTime() + 86400000).toISOString());

  const { count: clientesExcluidosCount } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true })
    .is("cliente_id", null)
    .gte("updated_at", dateParam)
    .lt("updated_at", new Date(new Date(dateParam).getTime() + 86400000).toISOString());

  const totalAdicionados = (barbeirosAdicionadosCount ?? 0) + (clientesAdicionadosCount ?? 0);
  const totalExcluidos = (barbeirosExcluidosCount ?? 0) + (clientesExcluidosCount ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Relatorio Diario</h1>
          <p className="text-muted-foreground">Visao completa de receitas, agendamentos e movimentacoes do dia.</p>
        </div>
        <Button variant="outline" className="gap-2 print:hidden" onClick={() => window.print()}>
          <FileDown className="h-4 w-4" /> Exportar PDF
        </Button>
      </div>

      <Card className="print:hidden">
        <CardContent>
          <DateFilter />
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total (pago)</p>
                <p className="text-2xl font-semibold text-green-500">{toCurrencyBRL(receitaTotalGeral)}</p>
                <p className="text-xs text-muted-foreground">{countPago} transacoes pagas</p>
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
                <p className="text-2xl font-semibold text-yellow-400">{toCurrencyBRL(receitaPendenteGeral)}</p>
                <p className="text-xs text-muted-foreground">{countPendente} transacoes pendentes</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-yellow-400">
                <CalendarDays size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registros</p>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-semibold text-green-500">+{totalAdicionados}</p>
                  <p className="text-lg font-semibold text-red-400">-{totalExcluidos}</p>
                </div>
                <p className="text-xs text-muted-foreground">Adicionados / Excluidos</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-blue-400">
                <Users size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Barbeiros Novos</p>
                <p className="text-2xl font-semibold text-purple-400">+{barbeirosAdicionadosCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">Cadastrados no dia</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-purple-400">
                <Scissors size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Receitas por Barbeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from(revenueByBarber.values())
              .filter((b) => b.receitaPago > 0 || b.receitaPendente > 0)
              .sort((a, b) => b.receitaPago - a.receitaPago)
              .map((barber, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{barber.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {barber.countPago} pago(s) | {barber.countPendente} pendente(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-500">{toCurrencyBRL(barber.receitaPago)}</p>
                    {barber.receitaPendente > 0 && (
                      <p className="text-xs text-yellow-400">{toCurrencyBRL(barber.receitaPendente)} pendente</p>
                    )}
                  </div>
                </div>
              ))}
            {Array.from(revenueByBarber.values()).every((b) => b.receitaPago === 0 && b.receitaPendente === 0) && (
              <p className="text-sm text-muted-foreground">Nenhuma receita registrada neste dia.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(agendamentosDoDia ?? []).map((ag) => {
              const barbeiroNome = ag.barbeiro_id ? (barbeirosMap.get(ag.barbeiro_id) ?? "(Barbeiro excluido)") : "(Barbeiro excluido)";
              const clienteNome = clienteMap.get(ag.cliente_id ?? "") ?? "N/A";
              const servicoNome = servicoMap.get(ag.servico_id ?? "") ?? "N/A";

              return (
                <div
                  key={ag.id}
                  className="rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {clienteNome} - {servicoNome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Barbeiro: {barbeiroNome} | {formatTimeBR(ag.data_inicio)}
                      </p>
                      {ag.observacoes && (
                        <p className="text-xs text-muted-foreground">{ag.observacoes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{toCurrencyBRL(Number(ag.valor_total ?? 0))}</p>
                      <Badge
                        variant="outline"
                        className={`mt-1 text-xs ${getStatusBadge(ag.status)}`}
                      >
                        {ag.status}
                      </Badge>
                      {ag.forma_pagamento && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {getPagamentoLabel(ag.forma_pagamento)}
                          {ag.pago ? " (pago)" : ""}
                        </p>
                      )}
                      {Number(ag.gorjeta ?? 0) > 0 && (
                        <p className="text-xs text-green-400">Gorjeta: {toCurrencyBRL(Number(ag.gorjeta))}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {(agendamentosDoDia ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum agendamento encontrado para esta data.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
