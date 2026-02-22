# Politica de Rotacao de Segredos - Lumie

Data de vigencia: 2026-02-22  
Escopo: producao (`lumieeventos.com`)

## Objetivo
Definir calendario, responsavel e procedimento padrao para rotacao de chaves/tokens sem indisponibilidade.

## Responsaveis operacionais
- Owner primario: `Backend Owner` (execucao tecnica e validacao)
- Owner secundario: `Ops Owner` (janela, comunicacao e auditoria)
- Aprovador: `Product Owner` (go/no-go de janela critica)

## Inventario minimo de segredos
- Auth/App:
  - `NEXTAUTH_SECRET`
- Banco:
  - `DATABASE_URL`
  - `DIRECT_URL`
- Cloudflare R2:
  - `CLOUDFLARE_R2_ACCESS_KEY_ID`
  - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- Upstash:
  - `UPSTASH_REDIS_REST_TOKEN`
- Sentry:
  - `SENTRY_DSN`
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_AUTH_TOKEN`
- Pagar.me:
  - `PAGARME_API_KEY`
  - `PAGARME_SECRET_KEY`
  - `PAGARME_WEBHOOK_SECRET`
  - `PAGARME_WEBHOOK_BASIC_USER`
  - `PAGARME_WEBHOOK_BASIC_PASSWORD`
- Resend:
  - `RESEND_API_KEY`
- Jobs/cron/gateway:
  - `CRON_SECRET`
  - `WITHDRAW_GATEWAY_TOKEN`

## Calendario padrao
- Mensal (todo dia 05):
  - `CRON_SECRET`
  - `WITHDRAW_GATEWAY_TOKEN`
  - `UPSTASH_REDIS_REST_TOKEN`
- Trimestral (jan/abr/jul/out - dia 10):
  - `NEXTAUTH_SECRET`
  - `CLOUDFLARE_R2_ACCESS_KEY_ID` + `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
  - `SENTRY_AUTH_TOKEN`
  - `RESEND_API_KEY`
- Semestral (mar/set - dia 15):
  - `PAGARME_API_KEY`
  - `PAGARME_SECRET_KEY`
  - `PAGARME_WEBHOOK_SECRET`
  - `PAGARME_WEBHOOK_BASIC_USER`
  - `PAGARME_WEBHOOK_BASIC_PASSWORD`
- Anual (nov - dia 20):
  - Revisao completa de `DATABASE_URL`/`DIRECT_URL` e credenciais associadas

## Janela e ordem de execucao (padrao)
1. Gerar novo segredo no provedor.
2. Registrar data/hora e operador.
3. Atualizar segredo na Vercel (Production).
4. Disparar novo deploy de producao.
5. Rodar smoke test:
   - login
   - upload avatar
   - checkout
   - webhook
   - `/api/cron/account-retention?dryRun=1`
6. Monitorar 30 minutos (Sentry + fluxo funcional).
7. Revogar segredo antigo no provedor.

## Rollback
1. Reverter valor da env var para segredo anterior.
2. Re-deploy imediato.
3. Validar smoke test minimo.
4. Abrir incidente interno com causa e acao preventiva.

## Registro obrigatorio de auditoria
- Manter historico em documento operacional (data, segredo, operador, resultado).
- Formato minimo:
  - `YYYY-MM-DD | segredo | operador | status(ok/falha) | observacao`

## Proxima revisao desta politica
- 2026-05-22
