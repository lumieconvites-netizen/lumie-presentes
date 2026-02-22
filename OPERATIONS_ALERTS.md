# Operacional - 5 Alertas (Sentry + DB + Redis)

Data base: 2026-02-22
Ambiente alvo: producao (`https://lumieeventos.com`)

## Objetivo
Fechar o bloco prioritario de alertas operacionais com thresholds fixos e acionaveis.

## Status real em 2026-02-22
- Concluido:
  - `prod-api-5xx-spike` (Sentry)
  - `prod-auth-failure-spike` (Sentry)
  - `prod-checkout-webhook-critical` (Sentry)
  - monitor custom no Supabase: `prod-db-saturation` (visual)
- Parcial:
  - Supabase: sem alerta automatico nativo configurado nesta UI; monitor visual criado.
- Pendente (decisao de custo):
  - Upstash alerta automatico (`prod-redis-error-latency`) depende de ativar pacote de monitoramento pago.

## Alertas (definicao final)

### 1) SENTRY - API 5xx Spike (geral)
- Plataforma: Sentry Metric Alert
- Nome: `prod-api-5xx-spike`
- Filtro:
  - `environment:production`
  - `transaction:/api/*`
  - `level:error`
- Threshold:
  - `>= 20 eventos em 5 minutos`
- Acao:
  - Notificar canal operacional (Slack/email) + owner de plantao

### 2) SENTRY - Auth Failure Spike
- Plataforma: Sentry Metric Alert
- Nome: `prod-auth-failure-spike`
- Filtro:
  - `environment:production`
  - `transaction:/api/auth/* OR transaction:/auth/*`
  - `level:error`
- Threshold:
  - `>= 10 eventos em 5 minutos`
- Acao:
  - Notificar canal operacional + owner auth

### 3) SENTRY - Checkout/Webhook Critical
- Plataforma: Sentry Issue Alert
- Nome: `prod-checkout-webhook-critical`
- Filtro:
  - `environment:production`
  - `transaction:/checkout/* OR transaction:/api/orders OR transaction:/api/webhooks/pagarme`
- Threshold:
  - `qualquer issue nova` OU `>= 5 eventos em 5 minutos` (mesma issue)
- Acao:
  - Notificar canal operacional + owner pagamentos

### 4) SUPABASE - Database Saturation
- Plataforma: Supabase Observability (custom report)
- Nome: `prod-db-saturation`
- Metrica preferencial:
  - Connection utilization `> 80%` por `10 minutos`
- Fallback (se utilization nao estiver disponivel):
  - CPU `> 80%` por `10 minutos`
- Acao:
  - Revisao manual diaria enquanto alerta automatico nao estiver disponivel

### 5) UPSTASH REDIS - Error/Latency
- Plataforma: Upstash Alerts
- Nome: `prod-redis-error-latency`
- Metrica:
  - Error rate `> 1%` por `5 minutos` OU
  - P95 latency `> 100ms` por `10 minutos`
- Acao:
  - Notificar canal operacional + owner backend

## Sequencia de execucao (passo a passo)

1. Criar os 3 alertas no Sentry (1, 2, 3) com `environment:production`. (concluido)
2. Criar monitor de banco no Supabase (4). (concluido como visual)
3. Criar alerta de Redis no Upstash (5). (pendente por custo/plano)
4. Testar disparo controlado do Sentry: (concluido)
   - Com header `Authorization: Bearer <CRON_SECRET>`, chamar:
   - `GET /api/sentry-debug?mode=exception&label=alert-test`
5. Validar recebimento no canal (Slack/email) e registrar data/hora. (fazer apos cada ajuste futuro)

## Rotina semanal sem custo extra (enquanto Redis alerta automatico estiver pendente)
1. Sentry:
   - revisar alertas `prod-api-5xx-spike`, `prod-auth-failure-spike`, `prod-checkout-webhook-critical`
   - confirmar que houve/nao houve disparos na semana
2. Supabase:
   - abrir report `prod-db-saturation`
   - validar picos de conexao/CPU e registrar observacao
3. Upstash:
   - abrir aba `Uso` e `Monitor` do Redis de producao
   - checar erros/latencia anormal
   - registrar data/hora da revisao manual
4. Acao corretiva:
   - se houver degradacao recorrente, priorizar ativacao de pacote para alerta automatico no Upstash

## Validacao rapida (PowerShell)

```powershell
$h = @{ Authorization = "Bearer <CRON_SECRET>" }
Invoke-RestMethod -Uri "https://lumieeventos.com/api/sentry-debug?mode=exception&label=alert-test" -Headers $h
Invoke-RestMethod -Uri "https://lumieeventos.com/api/cron/account-retention?dryRun=1" -Headers $h
```

## O que ainda falta depois destes 5
- Politica formal de rotacao de chaves/tokens (calendario + responsavel).
- Fila/worker para tarefas pesadas fora da request.
- Teste de carga real (cadastro, checkout, RSVP/check-in, upload).
