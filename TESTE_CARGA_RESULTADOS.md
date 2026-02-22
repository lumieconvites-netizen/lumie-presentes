# Resultados - Teste de Carga (2026-02-22)

Ambiente: `https://lumieeventos.com`

## Rodada 1 - Baseline seguro
- Inicio (UTC): `2026-02-22T17:35:49.271Z`
- Parametros:
  - `LOAD_DURATION_SECONDS=180`
  - `LOAD_CONCURRENCY=25`
  - `LOAD_ENABLE_WRITE_SCENARIOS=0`
- Resultado:
  - `requests=66271`
  - `rps=368.17`
  - `fail_rate=0.00%`
  - `status`: `200=58505`, `401=7766`
  - `PASS`
- p95/p99 por operacao:
  - `browse_home`: `40.4ms / 91.0ms`
  - `browse_site`: `37.1ms / 81.4ms`
  - `browse_templates`: `191.4ms / 260.2ms`
  - `upload_guard`: `188.0ms / 258.9ms`

## Rodada 2 - Escrita controlada + RSVP
- Inicio (UTC): `2026-02-22T17:39:53.709Z`
- Parametros:
  - `LOAD_DURATION_SECONDS=120`
  - `LOAD_CONCURRENCY=20`
  - `LOAD_ENABLE_WRITE_SCENARIOS=1`
  - `LOAD_RSVP_SLUG=page-d7cfc453cba64832`
- Resultado:
  - `requests=3087`
  - `rps=23.75`
  - `fail_rate=0.13%` (4 erros de rede por timeout)
  - `status`: `200=2500`, `400=63`, `401=273`, `429=247`
  - `PASS`
- p95/p99 por operacao:
  - `browse_home`: `54.3ms / 133.8ms`
  - `browse_site`: `50.3ms / 104.9ms`
  - `browse_templates`: `206.6ms / 279.9ms`
  - `upload_guard`: `203.1ms / 312.6ms`
  - `rsvp_search`: `8424.6ms / 9068.1ms` (degradado nesta rodada)
  - `register_validate`: `224.4ms / 526.3ms`
  - `checkout_validate`: `297.8ms / 494.0ms`

## Leitura operacional
- Baseline geral de navegacao ficou estavel.
- Fluxo de `rsvp_search` apresentou alta latencia com picos de timeout na rodada com escrita controlada.
- Prioridade de tuning: investigar consulta/filtros do endpoint `app/api/public/rsvp/[slug]/search/route.ts`.

## Rodada 3 - Pos-ajuste RSVP search
- Inicio (UTC): `2026-02-22T17:43:03.882Z`
- Parametros:
  - `LOAD_DURATION_SECONDS=90`
  - `LOAD_CONCURRENCY=20`
  - `LOAD_ENABLE_WRITE_SCENARIOS=1`
  - `LOAD_RSVP_SLUG=page-d7cfc453cba64832`
- Resultado:
  - `requests=1783`
  - `rps=17.83`
  - `fail_rate=3.76%`
  - `status`: `200=1379`, `400=14`, `401=148`, `429=175`
  - `PASS` (threshold configurado em 8%)
- p95/p99 por operacao:
  - `rsvp_search`: `9967.2ms / 10002.7ms` (ainda degradado)
  - demais operacoes mantiveram comportamento estavel

## Conclusao atualizada
- O ajuste no endpoint reduziu varredura em memoria, mas o gargalo de `rsvp_search` persiste sob carga mista.
- Proxima acao recomendada: revisar pool/latencia de banco e instrumentar tempo de query por endpoint para isolar origem.
