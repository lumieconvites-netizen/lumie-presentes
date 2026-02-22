# Status Handoff - Lumie (2026-02-22)

## Concluido
- Upload principal migrado para Cloudflare R2.
- Rate limiting e idempotencia com Upstash Redis.
- Sentry ativo em producao (com eventos de debug validados).
- Conexao de banco ajustada para pooler de transacao em producao.
- Indices criticos aplicados no banco.
- Retencao automatica implementada:
  - bloqueio/despublicacao apos prazo
  - grace period
  - hard delete
  - tentativa de remocao de assets
  - trilha de auditoria em `account_retention_audit_logs`
- Painel admin de retencao ativo em `/admin/retencao`.
- PITR habilitado no Supabase.
- Restore drill executado para projeto novo e validado.

## Ajustes tecnicos feitos nesta rodada
- `components/ui/dialog.tsx`: sanitiza `aria-describedby="undefined"`.
- `components/ui/alert-dialog.tsx`: sanitiza `aria-describedby="undefined"`.
- `app/api/upload/avatar/route.ts`: upload em R2-only quando configurado; sem fallback legado no endpoint.
- Endpoints de escrita de imagem (`gifts`, `admin/gift-lists/*/gifts`, `rsvp/settings`) bloqueiam novas URLs legadas de Supabase Storage.
- `app/api/sentry-debug/route.ts`: endpoint protegido por bearer para validar alertas operacionais no Sentry.
- `DEPLOY_CHECKLIST.md`: reescrito para stack atual.
- `OPERATIONS_ALERTS.md`: runbook com 5 alertas (Sentry + Supabase + Upstash) e thresholds fixos.
- `SECRET_ROTATION_POLICY.md`: politica formal de rotacao com calendario, responsaveis e rollback.
- `scripts/load-test.mjs` e `TESTE_CARGA.md`: harness de teste de carga com modo seguro e modo de validacao de escrita.
- `TESTE_CARGA_RESULTADOS.md`: quatro rodadas executadas (baseline, escrita controlada, pos-ajuste e reteste final).
- `app/api/public/rsvp/[slug]/search/route.ts`: filtro no banco + cache curto + throttling por IP para reduzir timeout sob carga.

## Parcial (faltando fechar)
- Migracao 100% de legados de Storage:
  - ainda existe suporte de limpeza de URL antiga no job de retencao (`lib/account-retention.ts`), o que e intencional para limpar historico.
  - objetivo final: sem novos writes em Supabase Storage (ja atingido para rota principal de upload).
- Politica formal de rotacao de chaves:
  - documentada em `SECRET_ROTATION_POLICY.md`.

## Pendente prioritario
- Filas para tarefas pesadas fora da request:
  - emails em lote
  - limpeza/processamentos async
  - rotinas demoradas
- Alertas operacionais completos:
  - regras Sentry para 5xx/auth/checkout/webhook (concluido)
  - Supabase em monitor visual (parcial)
  - Upstash automatico pendente por custo/plano
- Teste de carga:
  - executado com baseline oficial e reteste final (pass)
  - `rsvp_search` estabilizado no criterio global apos mitigacao (cache + rate limit)
- Rotacao operacional:
  - politica definida; falta executar primeira rodada com auditoria preenchida

## URLs e blocos importantes
- Admin retencao: `/admin/retencao`
- Cron retencao: `/api/cron/account-retention`
- Debug Sentry: `/api/sentry-debug`

## Observacoes
- WebSocket `ws://localhost:8081` no console de browser e ruido de extensao/local devtools; nao e erro de backend de producao.
- Warning de `DialogContent` foi mitigado nos wrappers UI.
