import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  const error = new Error("Sentry test error from /api/sentry-test");
  const eventId = Sentry.captureException(error);
  await Sentry.flush(2000);

  return NextResponse.json(
    {
      ok: true,
      eventId,
      message: "Evento enviado para o Sentry. Verifique a aba Issues.",
    },
    { status: 200 }
  );
}
