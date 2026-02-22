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
  - Supabase: monitor visual manual ativo com regra operacional (`CPU > 80% por 10m` ou `Memory > 80% por 10m`)
  - Upstash: monitoramento manual ativo em `Uso` + `Monitor` (sem pacote pago)
- Parcial:
  - Alertas automaticos nativos para DB/Redis dependem de recursos pagos em plataformas externas ou plano adicional.

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
- Status atual:
  - modo manual (sem pacote pago): revisar `Uso` e `Monitor` 1x por dia util
  - registrar check com data/hora e situacao (`OK`, `atencao`, `incidente`)

## Sequencia de execucao (passo a passo)

1. Criar os 3 alertas no Sentry (1, 2, 3) com `environment:production`. (concluido)
2. Criar monitor de banco no Supabase (4). (concluido como visual)
3. Upstash em modo manual sem custo extra (5). (concluido)
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
   - checar comandos diarios por regiao e tendencia de subida anormal
   - checar latencia/erros no monitor (se houver picos recorrentes)
   - registrar data/hora da revisao manual
4. Acao corretiva:
   - se houver degradacao recorrente, priorizar ativacao de pacote para alerta automatico no Upstash

## Checklist diario (30s) - Upstash manual
1. Abrir Redis de producao em `Uso` (janela ultimos 5 dias).
2. Confirmar que nao houve salto atipico de comandos em relacao ao padrao da semana.
3. Abrir `Monitor` e verificar se nao ha pico sustentado de latencia/erro.
4. Registrar em log operacional:
   - `YYYY-MM-DD HH:mm - Upstash - OK`
   - ou `YYYY-MM-DD HH:mm - Upstash - ATENCAO (descrever pico)`

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
