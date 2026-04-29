import { DollarSign } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/Card";
import { Button } from "@/app/ui/button";
import { Input } from "@/app/ui/input";
import { Label } from "@/app/ui/label";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createBarbeiro, deleteBarbeiro, updateBarbeiro } from "./actions";

export const dynamic = "force-dynamic";

export default async function BarbeirosPage() {
  const supabase = await createSupabaseServerClient();

  const { data: barbeiros, error } = await supabase
    .from("barbeiros")
    .select("id, nome_exibicao, cpf, telefone, email, especialidades, comissao_percent, valor_minimo_servico, ativo")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-primary">Barbeiros</h1>
        <p className="text-muted-foreground">CRUD com schema real do Supabase e validacao Zod.</p>
      </div>

      {error ? (
        <Card>
          <CardContent>
            <p className="text-sm text-red-400">Erro ao carregar barbeiros: {error.message}</p>
          </CardContent>
        </Card>
      ) : null}

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
        {(barbeiros ?? []).map((barbeiro) => (
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

              <div className="mt-3 flex items-center gap-2">
                <Link href={`/dashboard/barbeiros/${barbeiro.id}/receitas`}>
                  <Button variant="outline" className="text-green-400 gap-2">
                    <DollarSign className="h-4 w-4" /> Ver Receitas
                  </Button>
                </Link>
                <form action={deleteBarbeiro}>
                  <input type="hidden" name="id" value={barbeiro.id} />
                  <Button type="submit" variant="outline" className="text-red-400">Excluir</Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
