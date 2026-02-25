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

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function mapDocumentType(document) {
  return document.length > 11 ? "company" : "individual";
}

function mapBankType(type) {
  return String(type || "") === "conta_poupanca" ? "savings" : "checking";
}

function buildDefaultBankAccount(input) {
  const document = digitsOnly(input?.holderDocument);
  return {
    holder_name: String(input?.holderName || "").trim(),
    holder_type: mapDocumentType(document),
    holder_document: document,
    bank: digitsOnly(input?.bankCode),
    branch_number: digitsOnly(input?.agency),
    branch_check_digit: digitsOnly(input?.agencyDigit) || null,
    account_number: digitsOnly(input?.accountNumber),
    account_check_digit: digitsOnly(input?.accountDigit) || null,
    type: mapBankType(input?.accountType),
  };
}

async function pagarmeRequest(path, { method, body }) {
  const response = await fetch(`${pagarmeApiBase}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${pagarmeSecretKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
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

async function pagarmeGet(path) {
  const response = await fetch(`${pagarmeApiBase}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${pagarmeSecretKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
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

function readAmount(input) {
  if (Array.isArray(input)) return input.reduce((acc, item) => acc + readAmount(item), 0);
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input === "string") {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (input && typeof input === "object" && "amount" in input) {
    return readAmount(input.amount);
  }
  return 0;
}

function extractTransfers(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.transfers)) return payload.transfers;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function isTransferPending(status) {
  const s = String(status || "").toLowerCase();
  return [
    "pending",
    "processing",
    "created",
    "scheduled",
    "waiting_transfer",
    "pending_transfer",
    "requested",
  ].includes(s);
}

function isDashboardWithdrawTransfer(transfer) {
  const source = String(
    transfer?.metadata?.source ||
      transfer?.metadata?.origin ||
      transfer?.source ||
      ""
  ).toLowerCase();
  return source === "lumie_dashboard_withdraw";
}

function transferTimestamp(transfer) {
  const value = transfer?.updated_at || transfer?.updatedAt || transfer?.created_at || transfer?.createdAt;
  const ts = new Date(value || 0).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function pickTransferSnapshot(current, next) {
  if (!current) return next;
  if (!next) return current;

  const currentPending = isTransferPending(current?.status);
  const nextPending = isTransferPending(next?.status);
  if (currentPending !== nextPending) {
    return currentPending ? next : current;
  }

  const currentTs = transferTimestamp(current);
  const nextTs = transferTimestamp(next);
  if (nextTs > currentTs) return next;
  if (currentTs > nextTs) return current;

  const currentKeys = Object.keys(current || {}).length;
  const nextKeys = Object.keys(next || {}).length;
  return nextKeys >= currentKeys ? next : current;
}

function mergeTransfers(...lists) {
  const map = new Map();
  for (const list of lists) {
    for (const item of list || []) {
      const key = String(item?.id || "") || JSON.stringify(item);
      map.set(key, pickTransferSnapshot(map.get(key), item));
    }
  }
  return Array.from(map.values());
}

app.get("/health", (_req, res) => {
  if (!pagarmeSecretKey) return fail(res, 500, "PAGARME_SECRET_KEY nao configurada");
  if (!gatewayToken) return fail(res, 500, "WITHDRAW_GATEWAY_TOKEN nao configurada");
  return res.json({ ok: true, service: "withdraw-gateway" });
});

app.post("/orders/pix", async (req, res) => {
  if (!pagarmeSecretKey) return fail(res, 500, "PAGARME_SECRET_KEY nao configurada");
  if (!gatewayToken) return fail(res, 500, "WITHDRAW_GATEWAY_TOKEN nao configurada");
  const token = readAuthToken(req);
  if (!token || token !== gatewayToken) return fail(res, 401, "Nao autorizado");

  try {
    const { response, parsed } = await pagarmeRequest("/orders", {
      method: "POST",
      body: req.body || {},
    });
    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        provider: "pagarme",
        status: response.status,
        result: parsed,
      });
    }
    return res.json(parsed);
  } catch (error) {
    return fail(res, 500, String(error && error.message ? error.message : "Erro no gateway"));
  }
});

app.post("/orders/credit-card", async (req, res) => {
  if (!pagarmeSecretKey) return fail(res, 500, "PAGARME_SECRET_KEY nao configurada");
  if (!gatewayToken) return fail(res, 500, "WITHDRAW_GATEWAY_TOKEN nao configurada");
  const token = readAuthToken(req);
  if (!token || token !== gatewayToken) return fail(res, 401, "Nao autorizado");

  try {
    const { response, parsed } = await pagarmeRequest("/orders", {
      method: "POST",
      body: req.body || {},
    });
    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        provider: "pagarme",
        status: response.status,
        result: parsed,
      });
    }
    return res.json(parsed);
  } catch (error) {
    return fail(res, 500, String(error && error.message ? error.message : "Erro no gateway"));
  }
});

app.get("/orders/:orderId", async (req, res) => {
  if (!pagarmeSecretKey) return fail(res, 500, "PAGARME_SECRET_KEY nao configurada");
  if (!gatewayToken) return fail(res, 500, "WITHDRAW_GATEWAY_TOKEN nao configurada");
  const token = readAuthToken(req);
  if (!token || token !== gatewayToken) return fail(res, 401, "Nao autorizado");

  const orderId = String(req.params.orderId || "").trim();
  if (!orderId) return fail(res, 400, "orderId obrigatorio");

  try {
    const { response, parsed } = await pagarmeGet(`/orders/${encodeURIComponent(orderId)}`);
    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        provider: "pagarme",
        status: response.status,
        result: parsed,
      });
    }
    return res.json(parsed);
  } catch (error) {
    return fail(res, 500, String(error && error.message ? error.message : "Erro no gateway"));
  }
});

app.get("/egress-ip", async (req, res) => {
  if (!gatewayToken) return fail(res, 500, "WITHDRAW_GATEWAY_TOKEN nao configurada");
  const token = readAuthToken(req);
  if (!token || token !== gatewayToken) {
    return fail(res, 401, "Nao autorizado");
  }

  try {
    const v4 = await fetch("https://api.ipify.org", { method: "GET" }).then((r) => r.text());
    let v6 = "";
    try {
      v6 = await fetch("https://api64.ipify.org", { method: "GET" }).then((r) => r.text());
    } catch {
      v6 = "";
    }

    return res.json({
      ok: true,
      ipv4: String(v4 || "").trim(),
      ipv6: String(v6 || "").trim() || null,
    });
  } catch (error) {
    return fail(res, 500, String(error && error.message ? error.message : "Erro ao obter egress IP"));
  }
});

app.post("/recipient", async (req, res) => {
  if (!pagarmeSecretKey) return fail(res, 500, "PAGARME_SECRET_KEY nao configurada");
  if (!gatewayToken) return fail(res, 500, "WITHDRAW_GATEWAY_TOKEN nao configurada");

  const token = readAuthToken(req);
  if (!token || token !== gatewayToken) {
    return fail(res, 401, "Nao autorizado");
  }

  const owner = req.body?.owner || {};
  const bankAccount = req.body?.bankAccount || {};
  const metadata = req.body?.metadata || {};
  const ownerDocument = digitsOnly(owner.document);
  if (!ownerDocument) return fail(res, 400, "Documento do titular invalido");

  const payload = {
    name: String(owner.name || "").trim(),
    email: String(owner.email || "").trim(),
    description: "Recebedor criado automaticamente pela plataforma LUMIÊ",
    document: ownerDocument,
    type: mapDocumentType(ownerDocument),
    default_bank_account: buildDefaultBankAccount(bankAccount),
    metadata,
  };

  try {
    const { response, parsed } = await pagarmeRequest("/recipients", {
      method: "POST",
      body: payload,
    });

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
      recipient: parsed,
    });
  } catch (error) {
    return fail(res, 500, String(error && error.message ? error.message : "Erro no gateway"));
  }
});

app.patch("/recipient/:recipientId/default-bank-account", async (req, res) => {
  if (!pagarmeSecretKey) return fail(res, 500, "PAGARME_SECRET_KEY nao configurada");
  if (!gatewayToken) return fail(res, 500, "WITHDRAW_GATEWAY_TOKEN nao configurada");

  const token = readAuthToken(req);
  if (!token || token !== gatewayToken) {
    return fail(res, 401, "Nao autorizado");
  }

  const recipientId = String(req.params.recipientId || "").trim();
  const bankAccount = req.body?.bankAccount || {};
  if (!recipientId) return fail(res, 400, "recipientId obrigatorio");
  if (!String(bankAccount?.holderName || "").trim()) return fail(res, 400, "holderName obrigatorio");

  const defaultBankAccount = buildDefaultBankAccount(bankAccount);
  const recoverableStatuses = new Set([404, 405, 422]);

  try {
    // 1) Rota principal recomendada (core v5)
    const main = await pagarmeRequest(`/recipients/${encodeURIComponent(recipientId)}`, {
      method: "PATCH",
      body: { default_bank_account: defaultBankAccount },
    });
    if (main.response.ok) {
      return res.json({ ok: true, provider: "pagarme", recipient: main.parsed });
    }
    if (!recoverableStatuses.has(main.response.status)) {
      return res.status(main.response.status).json({
        ok: false,
        provider: "pagarme",
        status: main.response.status,
        result: main.parsed,
      });
    }

    // 2) Fallbacks de compatibilidade
    const fallbackRoutes = [
      `/recipients/${encodeURIComponent(recipientId)}/default-bank-account`,
      `/recipients/${encodeURIComponent(recipientId)}/default_bank_account`,
    ];
    const fallbackBodies = [
      defaultBankAccount,
      { bank_account: defaultBankAccount },
      { bankaccount: defaultBankAccount },
      { default_bank_account: defaultBankAccount },
    ];
    const methods = ["PATCH", "POST", "PUT"];

    for (const route of fallbackRoutes) {
      for (const body of fallbackBodies) {
        for (const method of methods) {
          const attempt = await pagarmeRequest(route, { method, body });
          if (attempt.response.ok) {
            return res.json({ ok: true, provider: "pagarme", recipient: attempt.parsed });
          }
          if (!recoverableStatuses.has(attempt.response.status)) {
            return res.status(attempt.response.status).json({
              ok: false,
              provider: "pagarme",
              status: attempt.response.status,
              result: attempt.parsed,
            });
          }
        }
      }
    }

    return res.status(main.response.status).json({
      ok: false,
      provider: "pagarme",
      status: main.response.status,
      result: main.parsed,
    });
  } catch (error) {
    return fail(res, 500, String(error && error.message ? error.message : "Erro no gateway"));
  }
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

app.get("/recipient-summary/:recipientId", async (req, res) => {
  if (!pagarmeSecretKey) return fail(res, 500, "PAGARME_SECRET_KEY nao configurada");
  if (!gatewayToken) return fail(res, 500, "WITHDRAW_GATEWAY_TOKEN nao configurada");

  const token = readAuthToken(req);
  if (!token || token !== gatewayToken) {
    return fail(res, 401, "Nao autorizado");
  }

  const recipientId = String(req.params.recipientId || "").trim();
  if (!recipientId) return fail(res, 400, "recipientId obrigatorio");

  try {
    const [
      { response: balanceRes, parsed: balancePayload },
      { response: transfersByRecipientRes, parsed: transfersByRecipientPayload },
      { response: transfersByQueryRes, parsed: transfersByQueryPayload },
      { response: transfersAllRes, parsed: transfersAllPayload },
    ] = await Promise.all([
      pagarmeGet(`/recipients/${encodeURIComponent(recipientId)}/balance`),
      pagarmeGet(`/recipients/${encodeURIComponent(recipientId)}/transfers?page=1&size=50`),
      pagarmeGet(`/transfers?recipient_id=${encodeURIComponent(recipientId)}&page=1&size=50`),
      pagarmeGet(`/transfers?page=1&size=50`),
    ]);

    if (!balanceRes.ok) {
      return res.status(balanceRes.status).json({
        ok: false,
        provider: "pagarme",
        endpoint: `/recipients/${recipientId}/balance`,
        status: balanceRes.status,
        result: balancePayload,
      });
    }

    const available =
      readAmount(balancePayload?.available) ||
      readAmount(balancePayload?.available_amount) ||
      readAmount(balancePayload?.balance?.available) ||
      readAmount(balancePayload?.balance?.available_amount);

    const waitingFunds =
      readAmount(balancePayload?.waiting_funds) ||
      readAmount(balancePayload?.waiting_funds_amount) ||
      readAmount(balancePayload?.balance?.waiting_funds) ||
      readAmount(balancePayload?.balance?.waiting_funds_amount);

    const byRecipient = transfersByRecipientRes.ok ? extractTransfers(transfersByRecipientPayload) : [];
    const byQuery = transfersByQueryRes.ok ? extractTransfers(transfersByQueryPayload) : [];
    const fromAll = transfersAllRes.ok
      ? extractTransfers(transfersAllPayload).filter(
          (t) => String(t?.recipient_id || t?.recipientId || "") === recipientId
        )
      : [];

    const transfers = mergeTransfers(byRecipient, byQuery, fromAll).filter((transfer) =>
      isDashboardWithdrawTransfer(transfer)
    );
    const pendingTransfers = transfers.filter((t) => isTransferPending(t?.status));
    const pendingTransferAmount = pendingTransfers.reduce((sum, t) => sum + readAmount(t?.amount), 0);
    const latestPendingTransfer = pendingTransfers
      .slice()
      .sort((a, b) => {
        const da = new Date(a?.created_at || a?.createdAt || 0).getTime();
        const db = new Date(b?.created_at || b?.createdAt || 0).getTime();
        return db - da;
      })[0];

    return res.json({
      ok: true,
      provider: "pagarme",
      recipientId,
      summary: {
        available,
        waitingFunds,
        pendingTransferAmount,
        pendingTransferCount: pendingTransfers.length,
        latestPendingTransfer: latestPendingTransfer
          ? {
              id: latestPendingTransfer.id || null,
              status: latestPendingTransfer.status || null,
              amount: readAmount(latestPendingTransfer.amount),
              createdAt: latestPendingTransfer.created_at || latestPendingTransfer.createdAt || null,
            }
          : null,
      },
    });
  } catch (error) {
    return fail(res, 500, String(error && error.message ? error.message : "Erro no gateway"));
  }
});

app.listen(port, () => {
  console.log(`withdraw-gateway running on :${port}`);
});
