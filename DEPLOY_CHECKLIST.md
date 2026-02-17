# Deploy checklist - LUMIE

## 1) Pre-requisitos
- Projeto Supabase (Postgres + Storage bucket `avatars` publico)
- Conta Vercel
- Conta Resend (email transacional)
- Conta Pagar.me (sandbox/producao)

## 2) Comandos locais (PowerShell)
```powershell
cd "C:\Users\Rayan\Documents\Site Lumie presentes\lumie-presentes"
npm install

# Se voce usa somente .env.local, copie para .env para o Prisma CLI:
Copy-Item .env.local .env -Force

npx prisma migrate deploy
npx prisma generate
npm run build
```

## 3) Variaveis de ambiente na Vercel
- `DATABASE_URL` (Supabase connection string)
- `NEXTAUTH_URL=https://lumieconvites.com`
- `NEXTAUTH_SECRET` (openssl rand -base64 32)
- `NEXT_PUBLIC_APP_URL=https://lumieconvites.com`
- `NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE=7.99`
- `PLATFORM_FEE_PERCENTAGE=7.99`
- `RESEND_API_KEY`
- `EMAIL_FROM=LUMIE <no-reply@lumieconvites.com>`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAGARME_API_KEY`
- `PAGARME_SECRET_KEY`
- `PAGARME_WEBHOOK_SECRET`
- `PAGARME_WEBHOOK_BASIC_USER` (se habilitar autenticacao no webhook)
- `PAGARME_WEBHOOK_BASIC_PASSWORD` (se habilitar autenticacao no webhook)
- `PAGARME_ENVIRONMENT=production`
- `WITHDRAW_GATEWAY_URL` (URL do backend com IP fixo para saque)
- `WITHDRAW_GATEWAY_TOKEN` (token compartilhado com o gateway)

## 4) Supabase Storage
- Bucket: `avatars`
- Visibilidade: Public
- Confirmar URL publica funcionando para upload de avatar/fotos.

## 5) Deploy Vercel
```powershell
npm i -g vercel
vercel login
vercel link
vercel --prod
```

## 6) Pos deploy
- Rodar cadastro por email (codigo)
- Criar presentes com upload
- Publicar lista e testar link copiado
- Abrir checkout e confirmar criacao de pedido
- Testar `GET /api/pagarme/ping` e fluxo de saque no dashboard
