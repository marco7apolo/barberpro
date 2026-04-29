import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/Card";
import { Button } from "@/app/ui/button";
import { Input } from "@/app/ui/input";
import { Label } from "@/app/ui/label";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

  async function createCliente(formData: FormData) {
    "use server";

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

    const actionSupabase = await createSupabaseServerClient();

    const { error: insertError } = await actionSupabase.from("clientes").insert({
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

    revalidatePath("/clientes");
  }

  async function updateCliente(formData: FormData) {
    "use server";

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

    const actionSupabase = await createSupabaseServerClient();

    const { error: updateError } = await actionSupabase
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

    revalidatePath("/clientes");
  }

  async function deleteCliente(formData: FormData) {
    "use server";

    const parsed = deleteSchema.safeParse({
      id: formData.get("id"),
    });

    if (!parsed.success) {
      throw new Error("Identificador invalido para exclusao.");
    }

    const actionSupabase = await createSupabaseServerClient();
    const { error: deleteError } = await actionSupabase
      .from("clientes")
      .delete()
      .eq("id", parsed.data.id);

    if (deleteError) {
      throw new Error("Nao foi possivel excluir o cliente.");
    }

    revalidatePath("/clientes");
  }

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
