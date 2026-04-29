import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/Card";
import { Button } from "@/app/ui/button";
import { Input } from "@/app/ui/input";
import { Label } from "@/app/ui/label";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

export default async function BarbeirosPage() {
  const supabase = await createSupabaseServerClient();

  const { data: barbeiros, error } = await supabase
    .from("barbeiros")
    .select("id, nome_exibicao, cpf, telefone, email, especialidades, comissao_percent, valor_minimo_servico, ativo")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Falha ao carregar barbeiros.");
  }

  async function createBarbeiro(formData: FormData) {
    "use server";

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

    const actionSupabase = await createSupabaseServerClient();
    const especialidadesArray = parsed.data.especialidades
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const { error: insertError } = await actionSupabase.from("barbeiros").insert({
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
      throw new Error("Nao foi possivel salvar o barbeiro.");
    }

    revalidatePath("/dashboard/barbeiros");
  }

  async function updateBarbeiro(formData: FormData) {
    "use server";

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

    const actionSupabase = await createSupabaseServerClient();
    const especialidadesArray = parsed.data.especialidades
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const { error: updateError } = await actionSupabase
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

    revalidatePath("/dashboard/barbeiros");
  }

  async function deleteBarbeiro(formData: FormData) {
    "use server";

    const parsed = deleteSchema.safeParse({
      id: formData.get("id"),
    });

    if (!parsed.success) {
      throw new Error("Identificador invalido para exclusao.");
    }

    const actionSupabase = await createSupabaseServerClient();
    const { error: deleteError } = await actionSupabase
      .from("barbeiros")
      .delete()
      .eq("id", parsed.data.id);

    if (deleteError) {
      throw new Error("Nao foi possivel excluir o barbeiro.");
    }

    revalidatePath("/dashboard/barbeiros");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-primary">Barbeiros</h1>
        <p className="text-muted-foreground">CRUD com schema real do Supabase e validacao Zod.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo barbeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBarbeiro} className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="nome_exibicao">Nome de exibicao</Label>
              <Input id="nome_exibicao" name="nome_exibicao" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" name="cpf" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="especialidades">Especialidades (separadas por virgula)</Label>
              <Input id="especialidades" name="especialidades" defaultValue="corte, barba" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comissao_percent">Comissao (%)</Label>
              <Input id="comissao_percent" name="comissao_percent" type="number" min={0} max={100} step="0.01" defaultValue="10" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_minimo_servico">Valor minimo servico (R$)</Label>
              <Input id="valor_minimo_servico" name="valor_minimo_servico" type="number" min={0} step="0.01" defaultValue="0" required />
            </div>
            <div className="space-y-2">
              <Label>Ativo</Label>
              <select
                name="ativo"
                required
                defaultValue="true"
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">Criar barbeiro</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {barbeiros?.map((barbeiro) => (
          <Card key={barbeiro.id}>
            <CardContent>
              <form action={updateBarbeiro} className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <input type="hidden" name="id" value={barbeiro.id} />
                <div className="space-y-2">
                  <Label>Nome de exibicao</Label>
                  <Input name="nome_exibicao" defaultValue={barbeiro.nome_exibicao} required />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input name="cpf" defaultValue={barbeiro.cpf} required />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input name="telefone" defaultValue={barbeiro.telefone} required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" defaultValue={barbeiro.email ?? ""} />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Especialidades</Label>
                  <Input
                    name="especialidades"
                    defaultValue={(barbeiro.especialidades ?? []).join(", ")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comissao (%)</Label>
                  <Input name="comissao_percent" type="number" min={0} max={100} step="0.01" defaultValue={String(barbeiro.comissao_percent ?? 0)} required />
                </div>
                <div className="space-y-2">
                  <Label>Valor minimo (R$)</Label>
                  <Input name="valor_minimo_servico" type="number" min={0} step="0.01" defaultValue={String(barbeiro.valor_minimo_servico ?? 0)} required />
                </div>
                <div className="space-y-2">
                  <Label>Ativo</Label>
                  <select
                    name="ativo"
                    required
                    defaultValue={barbeiro.ativo ? "true" : "false"}
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit" className="flex-1">Salvar</Button>
                </div>
              </form>

              <form action={deleteBarbeiro} className="mt-3">
                <input type="hidden" name="id" value={barbeiro.id} />
                <Button type="submit" variant="outline" className="text-red-400">Excluir</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}