# Deploy Checklist - LUMIE (Atual)

## 1) Infra obrigatoria
- Supabase (Postgres + backup agendado ativo)
- Vercel (producao)
- Cloudflare R2 (bucket de uploads)
- Upstash Redis (rate limit + idempotencia)
- Sentry (monitoramento de erros)
- Resend (email transacional)
- Pagar.me (pagamentos)

## 2) Variaveis de ambiente (Vercel)

### Banco
- `DATABASE_URL` (Supabase Transaction Pooler, `sslmode=require`, `pgbouncer=true`, `connection_limit=1`)
- `DIRECT_URL` (Supabase Direct Connection 5432)

### Auth / App
- `NEXTAUTH_URL=https://lumieeventos.com`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_APP_URL=https://lumieeventos.com`

### Fees / negocio
- `PLATFORM_FEE_PERCENTAGE`
- `PLATFORM_FEE_PERCENTAGE_PIX`
- `PLATFORM_FEE_PERCENTAGE_CREDIT_CARD`
- `PLATFORM_NETWORK_FEE_PERCENTAGE`
- `PLATFORM_NETWORK_FEE_PERCENTAGE_PIX`
- `PLATFORM_NETWORK_FEE_PERCENTAGE_CREDIT_CARD`
- `PAGARME_PROCESSING_FEE_PERCENTAGE`
- `PAGARME_PROCESSING_FEE_PERCENTAGE_PIX`
- `PAGARME_PROCESSING_FEE_PERCENTAGE_CREDIT_CARD`
- `PARTNER_COMMISSION_PERCENTAGE`
- `AMBASSADOR_COMMISSION_PERCENTAGE`

### Pagar.me
- `PAGARME_API_KEY`
- `PAGARME_SECRET_KEY`
- `PAGARME_PLATFORM_RECIPIENT_ID`
- `PAGARME_WEBHOOK_SECRET`
- `PAGARME_WEBHOOK_BASIC_USER`
- `PAGARME_WEBHOOK_BASIC_PASSWORD`
- `PAGARME_ENVIRONMENT=production`

### Saque (gateway)
- `WITHDRAW_GATEWAY_URL`
- `WITHDRAW_GATEWAY_TOKEN`

### Upload (Cloudflare R2)
- `CLOUDFLARE_R2_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_PUBLIC_BASE_URL`

### Redis / rate limit
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Sentry
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

### Email
- `RESEND_API_KEY`
- `EMAIL_FROM`

### Retencao automatica
- `ACCOUNT_RETENTION_ENABLED=true`
- `ACCOUNT_RETENTION_DAYS_AFTER_EVENT=90`
- `ACCOUNT_RETENTION_GRACE_DAYS=7`
- `CRON_SECRET`

## 3) Passos locais antes do deploy
```powershell
cd "C:\Users\Rayan\Documents\Site Lumie presentes\lumie-presentes"
npm install
npx prisma generate
npm run build
```

## 4) Deploy de producao
```powershell
vercel --prod
```

## 5) Validacao pos-deploy (smoke test)
- Login e dashboard de cliente
- Criacao/edicao de presente com upload de imagem
- Checkout PIX e cartao
- RSVP e check-in publico
- Admin: financeiro, bloqueados, retencao, templates
- Partner/Embaixador dashboards
- `/api/sentry-debug` gera evento no Sentry (com `Authorization: Bearer <CRON_SECRET>`)
- Cron dry-run:
```powershell
$h = @{ Authorization = "Bearer <CRON_SECRET>" }
Invoke-RestMethod -Uri "https://lumieeventos.com/api/cron/account-retention?dryRun=1" -Headers $h
Invoke-RestMethod -Uri "https://lumieeventos.com/api/sentry-debug?mode=exception&label=smoke-prod" -Headers $h
```

## 6) Rotina operacional semanal
- Revisar erros 5xx no Sentry
- Revisar falhas de webhook Pagar.me
- Revisar uso de banco/latencia no Supabase
- Revisar uso/operacoes no Upstash
- Revisar custo/uso no R2
