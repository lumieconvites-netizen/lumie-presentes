const express = require("express");

const app = express();
app.use(express.json({ limit: "256kb" }));

const port = Number(process.env.PORT || 3001);
const pagarmeApiBase = process.env.PAGARME_API_BASE || "https://api.pagar.me/core/v5";
const pagarmeSecretKey = process.env.PAGARME_SECRET_KEY || "";
const gatewayToken = process.env.WITHDRAW_GATEWAY_TOKEN || "";

function fail(res, status, message) {
  return res.status(status).json({ ok: false, message });
}

function readAuthToken(req) {
  const auth = String(req.headers.authorization || "");
  if (!auth.toLowerCase().startsWith("bearer ")) return "";
  return auth.slice(7).trim();
}

async function pagarmeTransfer({ recipientId, amountInCents, metadata }) {
  const response = await fetch(`${pagarmeApiBase}/transfers`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${pagarmeSecretKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountInCents,
      recipient_id: recipientId,
      metadata: metadata || {},
    }),
  });

  const raw = await response.text().catch(() => "");
  let parsed = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = { raw };
  }

  return { response, parsed };
}

app.get("/health", (_req, res) => {
  if (!pagarmeSecretKey) return fail(res, 500, "PAGARME_SECRET_KEY nao configurada");
  if (!gatewayToken) return fail(res, 500, "WITHDRAW_GATEWAY_TOKEN nao configurada");
  return res.json({ ok: true, service: "withdraw-gateway" });
});

app.post("/transfer", async (req, res) => {
  if (!pagarmeSecretKey) return fail(res, 500, "PAGARME_SECRET_KEY nao configurada");
  if (!gatewayToken) return fail(res, 500, "WITHDRAW_GATEWAY_TOKEN nao configurada");

  const token = readAuthToken(req);
  if (!token || token !== gatewayToken) {
    return fail(res, 401, "Nao autorizado");
  }

  const { recipientId, amountInCents, metadata } = req.body || {};
  if (!recipientId || typeof recipientId !== "string") {
    return fail(res, 400, "recipientId obrigatorio");
  }
  if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
    return fail(res, 400, "amountInCents invalido");
  }

  try {
    const { response, parsed } = await pagarmeTransfer({ recipientId, amountInCents, metadata });
    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        provider: "pagarme",
        status: response.status,
        result: parsed,
      });
    }

    return res.json({
      ok: true,
      provider: "pagarme",
      transfer: parsed,
    });
  } catch (error) {
    return fail(res, 500, String(error && error.message ? error.message : "Erro no gateway"));
  }
});

app.listen(port, () => {
  console.log(`withdraw-gateway running on :${port}`);
});

