const RESEND_API_URL = "https://api.resend.com/emails";

type SendVerificationEmailInput = {
  to: string;
  code: string;
  name?: string;
};

type SendRsvpNotificationInput = {
  to: string;
  eventTitle: string;
  guestName: string;
  status: "CONFIRMED" | "DECLINED";
};

export async function sendVerificationCodeEmail(input: SendVerificationEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "LUMIÊ <onboarding@resend.dev>";

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #8E3D2C; margin-bottom: 8px;">Confirme seu cadastro na LUMIÊ</h1>
      <p style="color: #333; margin-top: 0;">${input.name ? `Ola, ${input.name}.` : "Ola."} Use o codigo abaixo para confirmar seu email:</p>
      <div style="font-size: 32px; letter-spacing: 6px; font-weight: 700; color: #C65A3A; margin: 24px 0;">
        ${input.code}
      </div>
      <p style="color: #666;">Este codigo expira em 15 minutos.</p>
    </div>
  `;

  if (!apiKey) {
    console.log(`[email-dev] Codigo para ${input.to}: ${input.code}`);
    return { sent: false, provider: "console" as const };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: "Codigo de confirmacao - LUMIÊ",
      html,
    }),
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    throw new Error(`Falha ao enviar email: ${response.status} ${payload}`);
  }

  return { sent: true, provider: "resend" as const };
}

export async function sendRsvpNotificationEmail(input: SendRsvpNotificationInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "LUMIÊ <onboarding@resend.dev>";
  const statusText = input.status === "CONFIRMED" ? "confirmou presença" : "não poderá comparecer";

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #8E3D2C; margin-bottom: 8px;">Atualização de RSVP</h1>
      <p style="color: #333; margin-top: 0;">
        O convidado <strong>${input.guestName}</strong> ${statusText} no evento <strong>${input.eventTitle}</strong>.
      </p>
      <p style="color: #666;">Acompanhe mais detalhes no painel RSVP da LUMIÊ.</p>
    </div>
  `;

  if (!apiKey) {
    console.log(`[email-dev] RSVP ${input.status} - ${input.guestName} -> ${input.to}`);
    return { sent: false, provider: "console" as const };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `RSVP atualizado - ${input.eventTitle}`,
      html,
    }),
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    throw new Error(`Falha ao enviar email de RSVP: ${response.status} ${payload}`);
  }

  return { sent: true, provider: "resend" as const };
}

