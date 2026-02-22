# Consolidado de Custos em BRL - Lumie

Data base: 2026-02-22  
Objetivo: consolidar custo mensal estimado e realizado por provedor.

## Parametros
- Cambio USD->BRL usado no fechamento: `R$ 5,18`
- Periodo: `02/2026` (parcial)

## Tabela mensal (parcial preenchida)
| Provedor | Plano/uso | Moeda origem | Valor origem | Cambio usado | Valor em BRL |
|---|---|---|---:|---:|---:|
| Supabase | Pro Plan + 7-days PITR (ciclo Feb 22 - Mar 22) | USD | `Current: 25.96` (`Projected: 118.88`) | `5.18` | `R$ 129,50` (base Pro) |
| Vercel | Pro Plan (ciclo Feb 22 - Mar 21) | USD | `Included credit used: 10.79 / 20.00` (`Upcoming invoice: 20.00`) | `5.18` | `R$ 103,60` |
| Cloudflare R2 | R2 Paid (`$0.00/mo` + usage) | USD | `Ficticio: 3.00` | `5.18` | `R$ 15,54` |
| Upstash Redis | Pay as You Go | USD | `0.00` atual (`preco: $0.20 por 100k comandos`) | `5.18` | `R$ 0,00` (parcial) |
| Sentry | Business | USD | `89.00/mes` (`trial expira em 13 dias`) | `5.18` | `R$ 461,02` |
| Resend | Transactional Pro (50.000 emails/mes) | USD | `20.00/mes` (renova Mar 22) | `5.18` | `R$ 103,60` |
| Pagar.me (infra/plataforma) | taxa por transacao | BRL | `PIX 1.09%` + `Cartao 2.39%` (`mix 90/10 => taxa media 1.22%`) | `1.00` | `variavel por volume` |
| Outros | dominios/plugins/ferramentas | BRL/USD | `pendente coleta` | `pendente` | `pendente` |
| **TOTAL MENSAL** |  |  |  |  | **R$ 813,26 + variaveis** |

### Subtotal USD fixo conhecido (sem variaveis)
- Supabase (base Pro): `25.00`
- Vercel Pro: `20.00`
- Sentry Business: `89.00`
- Resend Transactional Pro: `20.00`
- Cloudflare R2 ficticio: `3.00`
- Upstash base: `0.00`
- **Subtotal fixo conhecido:** `USD 157.00/mes` + variaveis de uso
- **Subtotal fixo em BRL (cambio 5,18):** `R$ 813,26/mes`

## Rateio por tipo (opcional)
| Categoria | Valor BRL |
|---|---:|
| Banco/infra dados | `R$ 129,50` |
| Frontend/deploy | `R$ 103,60` |
| Storage/CDN | `R$ 15,54` (ficticio) |
| Observabilidade | `R$ 461,02` |
| Email transacional | `R$ 103,60` |
| Pagamentos/financeiro | `variavel (media 1,22% por transacao)` |
| **TOTAL** | **R$ 813,26 + variaveis** |

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
- Resend atualizado para `Transactional Pro (US$20/mes)`.
- Projeto `lumie-restore-test` removido do Supabase (confirmado pelo owner).
