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
- `DEPLOY_CHECKLIST.md`: reescrito para stack atual.

## Parcial (faltando fechar)
- Migracao 100% de legados de Storage:
  - ainda existe suporte de limpeza de URL antiga no job de retencao (`lib/account-retention.ts`), o que e intencional para limpar historico.
  - objetivo final: sem novos writes em Supabase Storage (ja atingido para rota principal de upload).
- Politica formal de rotacao de chaves:
  - falta documentar calendario e responsavel operacional.

## Pendente prioritario
- Filas para tarefas pesadas fora da request:
  - emails em lote
  - limpeza/processamentos async
  - rotinas demoradas
- Alertas operacionais completos:
  - regras Sentry para 5xx/auth/checkout/webhook
  - alertas de latencia/erros de banco e Redis
- Teste de carga:
  - cadastro
  - upload
  - checkout
  - RSVP/check-in
- Rotacao operacional:
  - tokens/chaves (R2, Upstash, Sentry, Pagar.me, Resend)

## URLs e blocos importantes
- Admin retencao: `/admin/retencao`
- Cron retencao: `/api/cron/account-retention`
- Debug Sentry: `/api/sentry-debug`

## Observacoes
- WebSocket `ws://localhost:8081` no console de browser e ruido de extensao/local devtools; nao e erro de backend de producao.
- Warning de `DialogContent` foi mitigado nos wrappers UI.
