import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/Card";
import { Button } from "@/app/ui/button";
import { Input } from "@/app/ui/input";
import { Label } from "@/app/ui/label";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  categoria_id: z.string().uuid(),
  nome: z.string().trim().min(2).max(120),
  descricao: z.string().trim().max(500).optional().or(z.literal("")),
  duracao_minutos: z.coerce.number().int().min(5).max(240),
  preco: z.coerce.number().min(0),
  preco_promocional: z.coerce.number().min(0).optional(),
  buffer_minutos: z.coerce.number().int().min(0).max(60),
  ativo: z.enum(["true", "false"]),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

const categoriaSchema = z.object({
  nome: z.string().trim().min(2).max(80),
  descricao: z.string().trim().max(200).optional().or(z.literal("")),
  cor_badge: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/),
  ordem_exibicao: z.coerce.number().int().min(0).max(999),
});

function toCurrencyBRL(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function ServicosPage() {
  const supabase = await createSupabaseServerClient();

  const { data: categorias, error: categoriasError } = await supabase
    .from("categorias_servicos")
    .select("id, nome")
    .eq("ativo", true)
    .order("ordem_exibicao", { ascending: true });

  const { data: servicos, error } = await supabase
    .from("servicos")
    .select("id, categoria_id, nome, descricao, duracao_minutos, preco, preco_promocional, buffer_minutos, ativo")
    .order("created_at", { ascending: false });

  const categoriasMap = new Map((categorias ?? []).map((c) => [c.id, c.nome]));

  async function createServico(formData: FormData) {
    "use server";

    const parsed = serviceSchema.safeParse({
      categoria_id: formData.get("categoria_id"),
      nome: formData.get("nome"),
      descricao: formData.get("descricao"),
      duracao_minutos: formData.get("duracao_minutos"),
      preco: formData.get("preco"),
      preco_promocional: formData.get("preco_promocional") || undefined,
      buffer_minutos: formData.get("buffer_minutos"),
      ativo: formData.get("ativo"),
    });

    if (!parsed.success) {
      throw new Error("Dados invalidos para cadastro de servico.");
    }

    const actionSupabase = await createSupabaseServerClient();
    const { error: insertError } = await actionSupabase.from("servicos").insert({
      categoria_id: parsed.data.categoria_id,
      nome: parsed.data.nome,
      descricao: parsed.data.descricao ? parsed.data.descricao : null,
      duracao_minutos: parsed.data.duracao_minutos,
      preco: parsed.data.preco,
      preco_promocional: parsed.data.preco_promocional ?? null,
      buffer_minutos: parsed.data.buffer_minutos,
      ativo: parsed.data.ativo === "true",
    });

    if (insertError) {
      throw new Error("Nao foi possivel salvar o servico.");
    }

    revalidatePath("/dashboard/servicos");
    redirect("/dashboard/servicos");
  }

  async function updateServico(formData: FormData) {
    "use server";

    const parsed = serviceSchema.safeParse({
      id: formData.get("id"),
      categoria_id: formData.get("categoria_id"),
      nome: formData.get("nome"),
      descricao: formData.get("descricao"),
      duracao_minutos: formData.get("duracao_minutos"),
      preco: formData.get("preco"),
      preco_promocional: formData.get("preco_promocional") || undefined,
      buffer_minutos: formData.get("buffer_minutos"),
      ativo: formData.get("ativo"),
    });

    if (!parsed.success || !parsed.data.id) {
      throw new Error("Dados invalidos para atualizar servico.");
    }

    const actionSupabase = await createSupabaseServerClient();
    const { error: updateError } = await actionSupabase
      .from("servicos")
      .update({
        categoria_id: parsed.data.categoria_id,
        nome: parsed.data.nome,
        descricao: parsed.data.descricao ? parsed.data.descricao : null,
        duracao_minutos: parsed.data.duracao_minutos,
        preco: parsed.data.preco,
        preco_promocional: parsed.data.preco_promocional ?? null,
        buffer_minutos: parsed.data.buffer_minutos,
        ativo: parsed.data.ativo === "true",
      })
      .eq("id", parsed.data.id);

    if (updateError) {
      throw new Error("Nao foi possivel atualizar o servico.");
    }

    revalidatePath("/dashboard/servicos");
    redirect("/dashboard/servicos");
  }

  async function deleteServico(formData: FormData) {
    "use server";

    const parsed = deleteSchema.safeParse({
      id: formData.get("id"),
    });

    if (!parsed.success) {
      throw new Error("Identificador invalido para exclusao.");
    }

    const actionSupabase = await createSupabaseServerClient();
    const { error: deleteError } = await actionSupabase
      .from("servicos")
      .delete()
      .eq("id", parsed.data.id);

    if (deleteError) {
      throw new Error("Nao foi possivel excluir o servico.");
    }

    revalidatePath("/dashboard/servicos");
    redirect("/dashboard/servicos");
  }

  async function createCategoria(formData: FormData) {
    "use server";

    const parsed = categoriaSchema.safeParse({
      nome: formData.get("nome"),
      descricao: formData.get("descricao"),
      cor_badge: formData.get("cor_badge"),
      ordem_exibicao: formData.get("ordem_exibicao"),
    });

    if (!parsed.success) {
      throw new Error("Dados invalidos para cadastro de categoria.");
    }

    const actionSupabase = await createSupabaseServerClient();
    const { error: insertError } = await actionSupabase.from("categorias_servicos").upsert(
      {
        nome: parsed.data.nome,
        descricao: parsed.data.descricao ? parsed.data.descricao : null,
        cor_badge: parsed.data.cor_badge,
        ordem_exibicao: parsed.data.ordem_exibicao,
        ativo: true,
      },
      { onConflict: "nome" },
    );

    if (insertError) {
      throw new Error("Nao foi possivel salvar a categoria.");
    }

    revalidatePath("/dashboard/servicos");
    redirect("/dashboard/servicos");
  }

  const defaultCategoriaId = categorias?.[0]?.id ?? "";
  const hasCategorias = (categorias ?? []).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-primary">Servicos</h1>
        <p className="text-muted-foreground">CRUD com schema real do Supabase e validacao Zod.</p>
      </div>

      {categoriasError ? (
        <Card>
          <CardContent>
            <p className="text-sm text-red-400">
              Erro ao carregar categorias: {categoriasError.message}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <CardContent>
            <p className="text-sm text-red-400">Erro ao carregar servicos: {error.message}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Nova categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCategoria} className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="categoria_nome">Nome</Label>
              <Input id="categoria_nome" name="nome" required />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="categoria_descricao">Descricao</Label>
              <Input id="categoria_descricao" name="descricao" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria_cor">Cor (hex)</Label>
              <Input id="categoria_cor" name="cor_badge" defaultValue="#3b82f6" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria_ordem">Ordem</Label>
              <Input id="categoria_ordem" name="ordem_exibicao" type="number" min={0} max={999} defaultValue="1" required />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">Criar categoria</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Novo servico</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasCategorias ? (
            <p className="mb-4 text-sm text-amber-400">
              Nenhuma categoria ativa encontrada. Crie ao menos uma categoria acima para cadastrar servicos.
            </p>
          ) : null}
          <form action={createServico} className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" required />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <select
                name="categoria_id"
                required
                defaultValue={defaultCategoriaId}
                disabled={!hasCategorias}
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              >
                {categorias?.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duracao_minutos">Duracao (min)</Label>
              <Input id="duracao_minutos" name="duracao_minutos" type="number" min={5} max={240} defaultValue="30" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preco">Preco (R$)</Label>
              <Input id="preco" name="preco" type="number" min={0} step="0.01" defaultValue="40.00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preco_promocional">Preco promocional (R$)</Label>
              <Input id="preco_promocional" name="preco_promocional" type="number" min={0} step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buffer_minutos">Buffer (min)</Label>
              <Input id="buffer_minutos" name="buffer_minutos" type="number" min={0} max={60} defaultValue="5" required />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="descricao">Descricao</Label>
              <Input id="descricao" name="descricao" />
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
              <Button type="submit" className="w-full" disabled={!hasCategorias}>Criar servico</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {(servicos ?? []).map((servico) => (
          <Card key={servico.id}>
            <CardContent>
              <form action={updateServico} className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <input type="hidden" name="id" value={servico.id} />
                <div className="space-y-2 lg:col-span-2">
                  <Label>Nome</Label>
                  <Input name="nome" defaultValue={servico.nome} required />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <select
                    name="categoria_id"
                    required
                    defaultValue={servico.categoria_id}
                    disabled={!hasCategorias}
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                  >
                    {categorias?.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Duracao (min)</Label>
                  <Input name="duracao_minutos" type="number" min={5} max={240} defaultValue={servico.duracao_minutos} required />
                </div>
                <div className="space-y-2">
                  <Label>Preco (R$)</Label>
                  <Input name="preco" type="number" min={0} step="0.01" defaultValue={String(servico.preco)} required />
                </div>
                <div className="space-y-2">
                  <Label>Preco promocional (R$)</Label>
                  <Input name="preco_promocional" type="number" min={0} step="0.01" defaultValue={servico.preco_promocional ? String(servico.preco_promocional) : ""} />
                </div>
                <div className="space-y-2">
                  <Label>Buffer (min)</Label>
                  <Input name="buffer_minutos" type="number" min={0} max={60} defaultValue={servico.buffer_minutos} required />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Descricao</Label>
                  <Input name="descricao" defaultValue={servico.descricao ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label>Ativo</Label>
                  <select
                    name="ativo"
                    required
                    defaultValue={servico.ativo ? "true" : "false"}
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full" disabled={!hasCategorias}>Salvar</Button>
                </div>
              </form>

              <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Categoria: {categoriasMap.get(servico.categoria_id) ?? "Sem categoria"} | Valor: {toCurrencyBRL(Number(servico.preco))}
                </span>
                <form action={deleteServico}>
                  <input type="hidden" name="id" value={servico.id} />
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
