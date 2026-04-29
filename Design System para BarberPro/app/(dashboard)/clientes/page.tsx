import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/Card";
import { Button } from "@/app/ui/button";
import { Input } from "@/app/ui/input";
import { Label } from "@/app/ui/label";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createCliente, deleteCliente, updateCliente } from "./actions";

export const dynamic = "force-dynamic";

function preferenciasToString(preferencias: unknown) {
  if (!preferencias || typeof preferencias !== "object") {
    return "";
  }

  const tagsValue = (preferencias as { tags?: unknown }).tags;
  if (!Array.isArray(tagsValue)) {
    return "";
  }

  return tagsValue.filter((item) => typeof item === "string").join(", ");
}

export default async function ClientesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: barbeiros } = await supabase
    .from("barbeiros")
    .select("id, nome_exibicao")
    .eq("ativo", true)
    .order("nome_exibicao", { ascending: true });

  const { data: clientes, error } = await supabase
    .from("clientes")
    .select(
      "id, nome, telefone, email, cpf, data_nascimento, observacoes, preferencias, consentimento_lgpd, criado_por, ativo",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-primary">Clientes</h1>
        <p className="text-muted-foreground">CRUD completo com schema real e consentimento LGPD.</p>
      </div>

      {error ? (
        <Card>
          <CardContent>
            <p className="text-sm text-red-400">Erro ao carregar clientes: {error.message}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Novo cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCliente} className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" name="cpf" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data nascimento</Label>
              <Input id="data_nascimento" name="data_nascimento" type="date" />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="observacoes">Observacoes</Label>
              <Input id="observacoes" name="observacoes" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferencias">Preferencias (virgula)</Label>
              <Input id="preferencias" name="preferencias" />
            </div>
            <div className="space-y-2">
              <Label>Criado por (barbeiro)</Label>
              <select
                name="criado_por"
                defaultValue=""
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              >
                <option value="">Nao definido</option>
                {(barbeiros ?? []).map((barbeiro) => (
                  <option key={barbeiro.id} value={barbeiro.id}>
                    {barbeiro.nome_exibicao}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Promo WhatsApp</Label>
              <select
                name="promocoes_whatsapp"
                defaultValue="false"
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              >
                <option value="false">Nao</option>
                <option value="true">Sim</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Historico servicos</Label>
              <select
                name="historico_servicos"
                defaultValue="true"
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              >
                <option value="true">Sim</option>
                <option value="false">Nao</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Ativo</Label>
              <select
                name="ativo"
                defaultValue="true"
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">Criar cliente</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {(clientes ?? []).map((cliente) => {
          const consentimento = cliente.consentimento_lgpd as {
            promocoes_whatsapp?: boolean;
            historico_servicos?: boolean;
          } | null;

          return (
            <Card key={cliente.id}>
              <CardContent>
                <form action={updateCliente} className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                  <input type="hidden" name="id" value={cliente.id} />
                  <div className="space-y-2 lg:col-span-2">
                    <Label>Nome</Label>
                    <Input name="nome" defaultValue={cliente.nome} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input name="telefone" defaultValue={cliente.telefone} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input name="email" type="email" defaultValue={cliente.email ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input name="cpf" defaultValue={cliente.cpf ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data nascimento</Label>
                    <Input name="data_nascimento" type="date" defaultValue={cliente.data_nascimento ?? ""} />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <Label>Observacoes</Label>
                    <Input name="observacoes" defaultValue={cliente.observacoes ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferencias (virgula)</Label>
                    <Input name="preferencias" defaultValue={preferenciasToString(cliente.preferencias)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Criado por</Label>
                    <select
                      name="criado_por"
                      defaultValue={cliente.criado_por ?? ""}
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                    >
                      <option value="">Nao definido</option>
                      {(barbeiros ?? []).map((barbeiro) => (
                        <option key={barbeiro.id} value={barbeiro.id}>
                          {barbeiro.nome_exibicao}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Promo WhatsApp</Label>
                    <select
                      name="promocoes_whatsapp"
                      defaultValue={consentimento?.promocoes_whatsapp ? "true" : "false"}
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                    >
                      <option value="false">Nao</option>
                      <option value="true">Sim</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Historico servicos</Label>
                    <select
                      name="historico_servicos"
                      defaultValue={consentimento?.historico_servicos === false ? "false" : "true"}
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                    >
                      <option value="true">Sim</option>
                      <option value="false">Nao</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ativo</Label>
                    <select
                      name="ativo"
                      defaultValue={cliente.ativo ? "true" : "false"}
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                    >
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full">Salvar</Button>
                  </div>
                </form>

                <form action={deleteCliente} className="mt-3">
                  <input type="hidden" name="id" value={cliente.id} />
                  <Button type="submit" variant="outline" className="text-red-400">Excluir</Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
