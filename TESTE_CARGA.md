# Teste de Carga - Lumie

Data base: 2026-02-22

## Objetivo
Executar carga controlada nos fluxos criticos (cadastro, checkout, RSVP e upload) sem impactar dados de producao por padrao.

## Script
- Arquivo: `scripts/load-test.mjs`
- Comando: `npm run load:test`

## Modos

### 1) Seguro (padrao)
- Nao cria pedidos reais e nao conclui cadastro.
- Exercita:
  - navegacao publica
  - busca publica de RSVP (se `LOAD_RSVP_SLUG` informado)
  - guarda de autenticacao de upload (`/api/upload/avatar` -> 401 esperado)

### 2) Validacao de escrita (opcional)
- Ativar com `LOAD_ENABLE_WRITE_SCENARIOS=1`
- Exercita validacoes de:
  - `/api/auth/register`
  - `/api/orders`
- Espera principalmente `400/404/429` por desenho de teste.

## Variaveis de ambiente
- `LOAD_BASE_URL` (default: `https://lumieeventos.com`)
- `LOAD_DURATION_SECONDS` (default: `120`)
- `LOAD_CONCURRENCY` (default: `20`)
- `LOAD_TIMEOUT_MS` (default: `10000`)
- `LOAD_FAIL_RATE_THRESHOLD` (default: `0.05`)
- `LOAD_RSVP_SLUG` (opcional)
- `LOAD_RSVP_QUERY` (default: `ma`)
- `LOAD_ENABLE_WRITE_SCENARIOS` (`0` ou `1`)

## Execucao (PowerShell)

### Baseline seguro
```powershell
$env:LOAD_BASE_URL="https://lumieeventos.com"
$env:LOAD_DURATION_SECONDS="120"
$env:LOAD_CONCURRENCY="20"
$env:LOAD_RSVP_SLUG="<slug-publico-rsvp>"
$env:LOAD_ENABLE_WRITE_SCENARIOS="0"
npm run load:test
```

### Rodada com validacao de escrita
```powershell
$env:LOAD_BASE_URL="https://lumieeventos.com"
$env:LOAD_DURATION_SECONDS="180"
$env:LOAD_CONCURRENCY="25"
$env:LOAD_RSVP_SLUG="<slug-publico-rsvp>"
$env:LOAD_ENABLE_WRITE_SCENARIOS="1"
npm run load:test
```

## Saida esperada
- Resumo com:
  - `requests`, `rps`, `fail_rate`
  - distribuicao de status HTTP
  - `p95/p99` por operacao
- O processo termina com erro se `fail_rate` ultrapassar `LOAD_FAIL_RATE_THRESHOLD`.

## Critério inicial de aceite
- `fail_rate <= 5%`
- nenhuma operacao com `p95 > 2000ms` no modo seguro
- sem pico anormal de erro no Sentry durante a janela

## Pos-teste
1. Registrar resultado (data, parametros, resumo).
2. Revisar Sentry (`prod-api-5xx-spike`, `prod-auth-failure-spike`, `prod-checkout-webhook-critical`).
3. Revisar Supabase/Upstash (latencia e erros).
