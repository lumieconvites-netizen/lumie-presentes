# Consolidado de Custos em BRL - Lumie

Data base: 2026-02-22  
Objetivo: consolidar custo mensal estimado e realizado por provedor.

## Parametros
- Cambio USD->BRL usado no fechamento: `R$ ____`
- Periodo: `____/2026`

## Tabela mensal (preencher)
| Provedor | Plano/uso | Moeda origem | Valor origem | Cambio usado | Valor em BRL |
|---|---|---|---:|---:|---:|
| Supabase | | USD | | | |
| Vercel | | USD | | | |
| Cloudflare R2 | | USD | | | |
| Upstash Redis | | USD | | | |
| Sentry | | USD | | | |
| Resend | | USD | | | |
| Pagar.me (infra/plataforma) | | BRL | | 1.00 | |
| Outros | | BRL/USD | | | |
| **TOTAL MENSAL** |  |  |  |  | **R$** |

## Rateio por tipo (opcional)
| Categoria | Valor BRL |
|---|---:|
| Banco/infra dados | |
| Frontend/deploy | |
| Storage/CDN | |
| Observabilidade | |
| Email transacional | |
| Pagamentos/financeiro | |
| **TOTAL** | **R$** |

## Checklist de fechamento mensal
1. Capturar valor fechado de cada provedor no ultimo dia do mes.
2. Converter USD para BRL com o cambio definido no fechamento.
3. Atualizar a tabela acima e registrar total.
4. Comparar com mes anterior e registrar variacao.
5. Se variacao > 20%, abrir analise de causa.

## Observacoes
- Este arquivo e operacional e nao deve conter credenciais.
- Recomenda-se manter um commit por fechamento mensal para historico.
