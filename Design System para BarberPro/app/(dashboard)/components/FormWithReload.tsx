"use client";

import type { ReactNode } from "react";

import { Button } from "@/app/ui/button";

interface FormWithReloadProps {
  action: (formData: FormData) => Promise<void>;
  className?: string;
  children: ReactNode;
  submitLabel?: string;
  fullSpan?: boolean;
}

export function FormWithReload({
  action,
  className,
  children,
  submitLabel = "Enviar",
  fullSpan = false,
}: FormWithReloadProps) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await action(formData);
    window.location.reload();
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
      <div className={fullSpan ? "flex items-end" : ""}>
        <Button type="submit" className={fullSpan ? "w-full" : ""} disabled={false}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

interface DeleteButtonProps {
  action: (formData: FormData) => Promise<void>;
  recordId: string;
  label?: string;
}

export function DeleteButton({ action, recordId, label = "Excluir" }: DeleteButtonProps) {
  async function handleDelete() {
    const formData = new FormData();
    formData.set("id", recordId);
    await action(formData);
    window.location.reload();
  }

  return (
    <Button type="button" onClick={handleDelete} variant="outline" className="text-red-400">
      {label}
    </Button>
  );
}
