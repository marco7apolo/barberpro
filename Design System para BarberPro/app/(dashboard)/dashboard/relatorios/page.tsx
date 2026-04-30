import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/Card";
import { Badge } from "@/app/ui/badge";
import { Input } from "@/app/ui/input";
import { Label } from "@/app/ui/label";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CalendarDays, DollarSign, Users, Scissors } from "lucide-react";

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

function getStartOfDay(dateStr: string) {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function getEndOfDay(dateStr: string) {
  const date = new Date(dateStr);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

export default async function RelatorioDiarioPage({ searchParams }: { searchParams: { data?: string } }) {
  const dateParam = searchParams.data ?? new Date().toISOString().split("T")[0];
  const startOfDay = getStartOfDay(dateParam);
  const endOfDay = getEndOfDay(dateParam);

  const supabase = await createSupabaseServerClient();

  // Fetch all barbers (including inactive for historical data)
  const { data: barbeiros } = await supabase
    .from("barbeiros")
    .select("id, nome_exibicao, comissao_percent, ativo")
    .order("nome_exibicao", { ascending: true });

  // Fetch all transactions for the day
  const { data: transacoes } = await supabase
    .from("transacoes")
    .select("id, agendamento_id, valor, forma_pagamento, status, created_at")
    .eq("tipo", "receita")
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay);

  // Fetch agendamentos linked to those transactions
  const agendamentoIds = (transacoes ?? []).map((t) => t.agendamento_id).filter(Boolean);
  const { data: agendamentos } = agendamentoIds.length > 0
    ? await supabase
        .from("agendamentos")
        .select("id, barbeiro_id, cliente_id, servico_id, data_inicio, status, valor_total, forma_pagamento, pago")
        .in("id", agendamentoIds)
    : { data: [] };

  const agendamentoMap = new Map((agendamentos ?? []).map((a) => [a.id, a]));

  // Fetch client and service names
  const clienteIds = Array.from(new Set((agendamentos ?? []).map((a) => a.cliente_id).filter(Boolean)));
  const servicoIds = Array.from(new Set((agendamentos ?? []).map((a) => a.servico_id).filter(Boolean)));

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

  // Revenue by barber
  interface BarberRevenue {
    id: string;
    nome: string;
    ativo: boolean;
    receitaPago: number;
    receitaPendente: number;
    countPago: number;
    countPendente: number;
  }

  const revenueByBarber = new Map<string, BarberRevenue>();

  for (const barbeiro of barbeiros ?? []) {
    revenueByBarber.set(barbeiro.id, {
      id: barbeiro.id,
      nome: barbeiro.nome_exibicao,
      ativo: barbeiro.ativo,
      receitaPago: 0,
      receitaPendente: 0,
      countPago: 0,
      countPendente: 0,
    });
  }

  let receitaTotalGeral = 0;
  let receitaPendenteGeral = 0;
  let totalTransacoes = 0;

  for (const t of transacoes ?? []) {
    const ag = agendamentoMap.get(t.agendamento_id);
    if (!ag?.barbeiro_id) continue;

    const barberRev = revenueByBarber.get(ag.barbeiro_id);
    if (!barberRev) continue;

    totalTransacoes++;
    const valor = Number(t.valor ?? 0);

    if (t.status === "pago") {
      barberRev.receitaPago += valor;
      barberRev.countPago++;
      receitaTotalGeral += valor;
    } else if (t.status === "pendente") {
      barberRev.receitaPendente += valor;
      barberRev.countPendente++;
      receitaPendenteGeral += valor;
    }
  }

  // Count clients added/deleted today
  const { data: clientesAdicionados } = await supabase
    .from("clientes")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay);

  const { data: clientesExcluidos } = await supabase
    .from("clientes")
    .select("id", { count: "exact", head: true })
    .eq("ativo", false)
    .gte("deleted_at", startOfDay)
    .lte("deleted_at", endOfDay);

  // Count barbers added/deleted today
  const { data: barbeirosAdicionados } = await supabase
    .from("barbeiros")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay);

  const { data: barbeirosExcluidos } = await supabase
    .from("barbeiros")
    .select("id", { count: "exact", head: true })
    .eq("ativo", false)
    .gte("deleted_at", startOfDay)
    .lte("deleted_at", endOfDay);

  // Fetch all appointments for the selected day
  const { data: agendamentosDoDia } = await supabase
    .from("agendamentos")
    .select("id, barbeiro_id, cliente_id, servico_id, data_inicio, data_fim, status, valor_total, gorjeta, forma_pagamento, pago, observacoes")
    .gte("data_inicio", startOfDay)
    .lte("data_inicio", endOfDay)
    .order("data_inicio", { ascending: true });

  // Fetch all appointments (including those without transactions) for revenue completeness
  const agendamentoIdsAll = (agendamentosDoDia ?? []).map((a) => a.id);
  const existingTransacaoIds = new Set((transacoes ?? []).map((t) => t.agendamento_id).filter(Boolean));
  const agendamentoIdsWithoutTransacao = agendamentoIdsAll.filter((id) => !existingTransacaoIds.has(id));

  // Fetch additional data for appointments without transactions
  if (agendamentoIdsWithoutTransacao.length > 0) {
    for (const ag of agendamentosDoDia ?? []) {
      if (agendamentoIdsWithoutTransacao.includes(ag.id) && ag.barbeiro_id) {
        const barberRev = revenueByBarber.get(ag.barbeiro_id);
        if (barberRev) {
          const valor = Number(ag.valor_total ?? 0);
          if (ag.pago) {
            barberRev.receitaPago += valor;
            barberRev.countPago++;
            receitaTotalGeral += valor;
          } else {
            barberRev.receitaPendente += valor;
            barberRev.countPendente++;
            receitaPendenteGeral += valor;
          }
          totalTransacoes++;
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-primary">Relatorio Diario</h1>
        <p className="text-muted-foreground">Visao completa de receitas, agendamentos e movimentacoes do dia.</p>
      </div>

      {/* Date selector */}
      <Card>
        <CardContent>
          <form className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data do relatorio</Label>
              <Input id="data" name="data" type="date" defaultValue={dateParam} />
            </div>
            <button
              type="submit"
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-9 items-center justify-center rounded-md border bg-input-background px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] hover:bg-muted"
            >
              Filtrar
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total (pago)</p>
                <p className="text-2xl font-semibold text-green-500">{toCurrencyBRL(receitaTotalGeral)}</p>
                <p className="text-xs text-muted-foreground">{totalTransacoes} transacoes</p>
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
                <p className="text-sm text-muted-foreground">Clientes</p>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-semibold text-green-500">+{(clientesAdicionados as unknown as { count: number })?.count ?? 0}</p>
                  <p className="text-lg font-semibold text-red-400">-{(clientesExcluidos as unknown as { count: number })?.count ?? 0}</p>
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
                <p className="text-sm text-muted-foreground">Barbeiros</p>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-semibold text-green-500">+{(barbeirosAdicionados as unknown as { count: number })?.count ?? 0}</p>
                  <p className="text-lg font-semibold text-red-400">-{(barbeirosExcluidos as unknown as { count: number })?.count ?? 0}</p>
                </div>
                <p className="text-xs text-muted-foreground">Adicionados / Excluidos</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-purple-400">
                <Scissors size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Revenue by barber */}
      <Card>
        <CardHeader>
          <CardTitle>Receitas por Barbeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from(revenueByBarber.values())
              .filter((b) => b.receitaPago > 0 || b.receitaPendente > 0)
              .sort((a, b) => b.receitaPago - a.receitaPago)
              .map((barber) => (
                <div
                  key={barber.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {barber.nome}
                      {!barber.ativo && (
                        <span className="ml-2 text-xs text-muted-foreground">(excluido)</span>
                      )}
                    </p>
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

      {/* All appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(agendamentosDoDia ?? []).map((ag) => {
              const barbeiroNome = (barbeiros ?? []).find((b) => b.id === ag.barbeiro_id)?.nome_exibicao ?? "N/A";
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
              <p className="text-sm text-muted-foreground">Nenhum agendamento neste dia.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
