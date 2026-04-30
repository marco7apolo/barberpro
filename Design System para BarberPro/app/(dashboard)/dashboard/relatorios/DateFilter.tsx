"use client";

import { Input } from "@/app/ui/input";
import { Label } from "@/app/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDate = searchParams.get("data") ?? new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(currentDate);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/dashboard/relatorios?data=${date}`);
  }

  return (
    <form onSubmit={handleFilter} className="flex items-end gap-4">
      <div className="space-y-2">
        <Label htmlFor="data">Data do relatorio</Label>
        <Input id="data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <button
        type="submit"
        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-9 items-center justify-center rounded-md border bg-input-background px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] hover:bg-muted"
      >
        Filtrar
      </button>
    </form>
  );
}
