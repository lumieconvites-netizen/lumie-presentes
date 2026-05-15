# Withdraw Gateway (IP fixo)

Servico minimo para executar `POST /transfers` da Pagar.me fora da Vercel, em um host com IP fixo.

## Variaveis de ambiente

- `PAGARME_SECRET_KEY` (producao)
- `WITHDRAW_GATEWAY_TOKEN` (segredo compartilhado com o app principal)
- `PAGARME_API_BASE` (opcional, default `https://api.pagar.me/core/v5`)
- `PORT` (opcional, default `3001`)

## Executar local

```bash
npm install
npm start
```

Healthcheck:

```bash
curl http://localhost:3001/health
```

## Endpoints

`POST /transfer`

Header:

- `Authorization: Bearer <WITHDRAW_GATEWAY_TOKEN>`

Body:

```json
{
  "recipientId": "re_xxx",
  "amountInCents": 1200,
  "metadata": {
    "source": "lumie_dashboard_withdraw"
  }
}
```

## Integracao no app principal (Vercel)

Configure no projeto principal:

- `WITHDRAW_GATEWAY_URL=https://seu-gateway.com`
- `WITHDRAW_GATEWAY_TOKEN=mesmo-token-do-gateway`

Se `WITHDRAW_GATEWAY_URL` estiver preenchida, o endpoint `POST /api/recipient/withdraw` usa o gateway.  
Se estiver vazia, usa chamada direta da Pagar.me (modo antigo).

`GET /recipient/:recipientId/status`

Header:

- `Authorization: Bearer <WITHDRAW_GATEWAY_TOKEN>`

Resposta:

```json
{
  "ok": true,
  "provider": "pagarme",
  "recipientId": "re_xxx",
  "status": "active",
  "rawStatus": "active"
}
```

Esse endpoint e usado pelo cron do app principal para acompanhar recebedores recem-criados/editados sem consultar a Pagar.me diretamente pela Vercel.

