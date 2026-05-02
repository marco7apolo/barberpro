import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

const pixWebhookSchema = z.object({
  event: z.string().min(1),
  transaction_id: z.string().min(1),
  amount: z.number().positive(),
  status: z.string().min(1),
  paid_at: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

function verifySignature(rawBody: string, signatureHeader: string | null) {
  const webhookSecret = process.env.PIX_WEBHOOK_SECRET;

  if (!webhookSecret || !signatureHeader) {
    return false;
  }

  const computedSignature = createHash("sha256")
    .update(`${rawBody}.${webhookSecret}`)
    .digest("hex");

  const expected = Buffer.from(computedSignature);
  const received = Buffer.from(signatureHeader);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-pix-signature");

  if (!verifySignature(rawBody, signatureHeader)) {
    return NextResponse.json({ ok: false, message: "assinatura invalida" }, { status: 401 });
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ ok: false, message: "payload invalido" }, { status: 400 });
  }

  const validatedPayload = pixWebhookSchema.safeParse(parsedJson);

  if (!validatedPayload.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "estrutura de payload invalida",
      },
      { status: 400 },
    );
  }

  // TODO: Persistir evento em tabela de webhooks para idempotencia.
  // TODO: Atualizar status financeiro no banco apos reconciliacao.

  return NextResponse.json({ ok: true }, { status: 200 });
}