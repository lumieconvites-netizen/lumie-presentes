# Consolidado de Custos em BRL - Lumie

Data base: 2026-02-22  
Objetivo: consolidar custo mensal estimado e realizado por provedor.

## Parametros
- Cambio USD->BRL usado no fechamento: `a definir no fechamento`
- Periodo: `02/2026` (parcial)

## Tabela mensal (parcial preenchida)
| Provedor | Plano/uso | Moeda origem | Valor origem | Cambio usado | Valor em BRL |
|---|---|---|---:|---:|---:|
| Supabase | Pro Plan + 7-days PITR (ciclo Feb 22 - Mar 22) | USD | `Current: 25.96` (`Projected: 118.88`) | `pendente` | `pendente` |
| Vercel | Pro Plan (ciclo Feb 22 - Mar 21) | USD | `Included credit used: 10.79 / 20.00` (`Upcoming invoice: 20.00`) | `pendente` | `pendente` |
| Cloudflare R2 | storage + egress + operacoes | USD | `pendente uso real (print enviado foi de tabela de preco)` | `pendente` | `pendente` |
| Upstash Redis | Pay as You Go | USD | `0.00` atual (`preco: $0.20 por 100k comandos`) | `pendente` | `0.00` (parcial) |
| Sentry | Business | USD | `89.00/mes` (`trial expira em 13 dias`) | `pendente` | `pendente` |
| Resend | Live atual / Pro opcional | USD | `Atual: 0.00` (`Opcional: 20.00/mes`) | `pendente` | `pendente` |
| Pagar.me (infra/plataforma) | taxa por transacao | BRL | `PIX 1.09%` + `Cartao 2.39%` (`mix 90/10 => taxa media 1.22%`) | `1.00` | `variavel por volume` |
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
- Decisao recomendada para agora:
  - Manter `Resend Live (US$0)` ate ultrapassar 3.000 emails/mes.
  - Subir para `Resend Pro (US$20)` apenas quando houver necessidade real de volume/SLA.
