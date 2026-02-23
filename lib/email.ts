const RESEND_API_URL = "https://api.resend.com/emails";

type SendVerificationEmailInput = {
  to: string;
  code: string;
  name?: string;
};

type SendPasswordResetEmailInput = {
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

type BrandedEmailLayoutInput = {
  preheader: string;
  title: string;
  subtitle?: string;
  bodyHtml: string;
  footerNote?: string;
};

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://lumieeventos.com").replace(/\/+$/, "");
const LOGO_URL = `${APP_URL}/logo.png`;
const BRAND = {
  bg: "#f4efea",
  card: "#ffffff",
  border: "#ead8cf",
  title: "#2f231f",
  text: "#4f4540",
  muted: "#7e706a",
  terracotta: "#c65a3a",
  terracottaDark: "#8f3f2f",
  success: "#1aa866",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderCodeBlock(code: string) {
  const safeCode = escapeHtml(code);
  return `
    <div style="margin: 26px 0; text-align: center;">
      <span
        style="
          display: inline-block;
          font-size: 34px;
          line-height: 1;
          letter-spacing: 8px;
          font-weight: 800;
          color: ${BRAND.terracotta};
          background: #fff8f4;
          border: 1px solid #f1d5c8;
          border-radius: 14px;
          padding: 16px 22px;
        "
      >
        ${safeCode}
      </span>
    </div>
  `;
}

function renderBrandedLayout(input: BrandedEmailLayoutInput) {
  return `
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <title>${escapeHtml(input.title)} - LUMIÊ</title>
  </head>
  <body style="margin: 0; padding: 0; background: ${BRAND.bg};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(input.preheader)}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: ${BRAND.bg};">
      <tr>
        <td align="center" style="padding: 28px 14px;">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="max-width: 620px; background: ${BRAND.card}; border: 1px solid ${BRAND.border}; border-radius: 18px; overflow: hidden;"
          >
            <tr>
              <td style="padding: 24px 24px 18px; background: linear-gradient(135deg, #fff8f3 0%, #fdf4ee 100%); border-bottom: 1px solid #f0ddd2;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="left">
                      <img src="${LOGO_URL}" alt="LUMIÊ" width="132" style="display:block; height:auto; border:0;" />
                    </td>
                    <td align="right" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; letter-spacing: 1.6px; color: ${BRAND.terracotta}; font-weight: 700;">
                      LUMIÊ EVENTOS
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 26px 24px 8px; font-family: 'Segoe UI', Arial, sans-serif;">
                <h1 style="margin: 0; font-size: 30px; line-height: 1.2; color: ${BRAND.title}; font-weight: 800;">
                  ${escapeHtml(input.title)}
                </h1>
                ${
                  input.subtitle
                    ? `<p style="margin: 12px 0 0; font-size: 16px; line-height: 1.55; color: ${BRAND.text};">${escapeHtml(input.subtitle)}</p>`
                    : ""
                }
              </td>
            </tr>

            <tr>
              <td style="padding: 4px 24px 10px; font-family: 'Segoe UI', Arial, sans-serif; color: ${BRAND.text}; font-size: 15px; line-height: 1.65;">
                ${input.bodyHtml}
              </td>
            </tr>

            <tr>
              <td style="padding: 18px 24px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #f0ddd2;">
                  <tr>
                    <td style="padding-top: 16px; font-family: 'Segoe UI', Arial, sans-serif; color: ${BRAND.muted}; font-size: 13px; line-height: 1.5;">
                      ${escapeHtml(input.footerNote ?? "Mensagem automática da LUMIÊ. Em caso de dúvida, responda este email.")}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 0 24px 22px; font-family: 'Segoe UI', Arial, sans-serif; color: ${BRAND.muted}; font-size: 12px;">
                lumieeventos.com
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

async function sendEmail(params: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "LUMIÊ <onboarding@resend.dev>";
  const usingDefaultFrom = from.toLowerCase().includes("onboarding@resend.dev");

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Servico de email indisponivel: RESEND_API_KEY nao configurada.");
    }
    console.log(`[email-dev] ${params.subject} -> ${params.to}`);
    return { sent: false, provider: "console" as const };
  }

  if (process.env.NODE_ENV === "production" && usingDefaultFrom) {
    throw new Error("Servico de email indisponivel: EMAIL_FROM precisa ser um remetente verificado.");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    throw new Error(`Falha ao enviar email: ${response.status} ${payload}`);
  }

  return { sent: true, provider: "resend" as const };
}

export async function sendVerificationCodeEmail(input: SendVerificationEmailInput) {
  const safeName = input.name ? escapeHtml(input.name) : "você";
  const html = renderBrandedLayout({
    preheader: "Seu código de confirmação da LUMIÊ chegou.",
    title: "Confirme seu cadastro",
    subtitle: `Olá, ${safeName}. Use o código abaixo para concluir a verificação do seu email.`,
    bodyHtml: `
      ${renderCodeBlock(input.code)}
      <p style="margin: 0 0 8px;">Esse código expira em <strong>15 minutos</strong>.</p>
      <p style="margin: 0;">Se não foi você quem solicitou, desconsidere esta mensagem.</p>
    `,
  });

  return sendEmail({
    to: input.to,
    subject: "Código de confirmação - LUMIÊ",
    html,
  });
}

export async function sendPasswordResetCodeEmail(input: SendPasswordResetEmailInput) {
  const safeName = input.name ? escapeHtml(input.name) : "você";
  const html = renderBrandedLayout({
    preheader: "Use este código para redefinir sua senha da LUMIÊ.",
    title: "Recuperação de senha",
    subtitle: `Olá, ${safeName}. Recebemos uma solicitação para alterar sua senha.`,
    bodyHtml: `
      ${renderCodeBlock(input.code)}
      <p style="margin: 0 0 8px;">Digite este código na tela de recuperação para criar sua nova senha.</p>
      <p style="margin: 0 0 8px;">Esse código expira em <strong>15 minutos</strong>.</p>
      <p style="margin: 0;">Se você não fez esta solicitação, desconsidere este email.</p>
    `,
  });

  return sendEmail({
    to: input.to,
    subject: "Código de recuperação de senha - LUMIÊ",
    html,
  });
}

export async function sendRsvpNotificationEmail(input: SendRsvpNotificationInput) {
  const confirmed = input.status === "CONFIRMED";
  const statusText = confirmed ? "confirmou presença" : "não poderá comparecer";
  const statusColor = confirmed ? BRAND.success : BRAND.terracottaDark;

  const html = renderBrandedLayout({
    preheader: `Atualização de RSVP: ${input.guestName} ${statusText}.`,
    title: "Atualização de RSVP",
    subtitle: "Sua lista recebeu uma nova resposta de confirmação.",
    bodyHtml: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 10px 0 16px;">
        <tr>
          <td style="padding: 14px 16px; border: 1px solid #ecd9cf; border-radius: 12px; background: #fff9f5;">
            <p style="margin: 0 0 8px; font-size: 14px; color: ${BRAND.muted};">Evento</p>
            <p style="margin: 0 0 12px; font-size: 17px; color: ${BRAND.title}; font-weight: 700;">${escapeHtml(input.eventTitle)}</p>
            <p style="margin: 0 0 8px; font-size: 14px; color: ${BRAND.muted};">Convidado</p>
            <p style="margin: 0; font-size: 16px; color: ${BRAND.title}; font-weight: 600;">
              ${escapeHtml(input.guestName)}
              <span style="color: ${statusColor};"> ${statusText}</span>
            </p>
          </td>
        </tr>
      </table>
      <p style="margin: 0;">Acesse o painel RSVP para acompanhar os detalhes em tempo real.</p>
    `,
    footerNote: "Atualização automática enviada pela LUMIÊ RSVP.",
  });

  return sendEmail({
    to: input.to,
    subject: `RSVP atualizado - ${input.eventTitle}`,
    html,
  });
}
