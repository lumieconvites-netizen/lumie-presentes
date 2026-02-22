# Consolidado de Custos em BRL - Lumie

Data base: 2026-02-22  
Objetivo: consolidar custo mensal estimado e realizado por provedor.

## Parametros
- Cambio USD->BRL usado no fechamento: `a definir no fechamento`
- Periodo: `02/2026` (parcial)

## Tabela mensal (parcial preenchida)
| Provedor | Plano/uso | Moeda origem | Valor origem | Cambio usado | Valor em BRL |
|---|---|---|---:|---:|---:|
| Supabase | Pro (billing mensal) | USD | `pendente coleta` | `pendente` | `pendente` |
| Vercel | Pro + execucao/build | USD | `pendente coleta` | `pendente` | `pendente` |
| Cloudflare R2 | storage + egress + operacoes | USD | `pendente coleta` | `pendente` | `pendente` |
| Upstash Redis | pay-as-you-go | USD | `0.00` (parcial visto no painel) | `pendente` | `0.00` (parcial) |
| Sentry | plano atual do projeto | USD | `pendente coleta` | `pendente` | `pendente` |
| Resend | email transacional | USD | `pendente coleta` | `pendente` | `pendente` |
| Pagar.me (infra/plataforma) | custos/ajustes internos | BRL | `pendente coleta` | `1.00` | `pendente` |
| Outros | dominios/plugins/ferramentas | BRL/USD | `pendente coleta` | `pendente` | `pendente` |
| **TOTAL MENSAL** |  |  |  |  | **R$ pendente** |

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
- Status atual: consolidado estrutural concluido; fechamento financeiro depende de valores dos paineis de billing.
