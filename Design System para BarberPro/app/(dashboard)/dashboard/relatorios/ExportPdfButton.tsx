"use client";

import { Button } from "@/app/ui/button";
import { FileDown } from "lucide-react";

export function ExportPdfButton() {
  return (
    <Button variant="outline" className="gap-2 print:hidden" onClick={() => window.print()}>
      <FileDown className="h-4 w-4" /> Exportar PDF
    </Button>
  );
}
