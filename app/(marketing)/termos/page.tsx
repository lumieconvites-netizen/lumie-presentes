import { CheckCircle2, Shield, Wallet, UserCheck, AlertCircle } from 'lucide-react';

export default function TermosPage() {
  return (
    <main className="bg-[#f7f2ed] text-[#2b2422]">
      <section className="border-y border-[#ead6c8] bg-gradient-to-b from-[#f7f2ed] to-[#f2e6dc]">
        <div className="container mx-auto px-6 py-16 md:py-20 text-center">
          <h1 className="font-display text-4xl md:text-6xl text-primary leading-tight">Termos de Uso</h1>
          <p className="mx-auto mt-5 max-w-4xl text-lg md:text-xl text-[#5f4b42] leading-relaxed">
            Ao utilizar a Lumi&ecirc;, você concorda com as condições abaixo para uso da plataforma, gestão da sua lista,
            recebimento de valores e segurança das operações.
          </p>
          <p className="mt-5 text-sm text-[#7a665c]">Última atualização: 19 de fevereiro de 2026</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#e8d3c5] bg-white p-7 md:p-10 shadow-[0_14px_36px_rgba(85,55,40,0.08)]">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-[#ecd9cc] bg-[#fffaf6] p-5">
                <Wallet className="h-6 w-6 text-[#c65a3a]" />
                <p className="mt-3 font-medium text-[#3c2f2a]">Taxa padrão: 7,99% no PIX e 13,99% no crédito</p>
              </div>
              <div className="rounded-2xl border border-[#ecd9cc] bg-[#fffaf6] p-5">
                <Wallet className="h-6 w-6 text-[#c65a3a]" />
                <p className="mt-3 font-medium text-[#3c2f2a]">Taxa por saque: R$ 3,67</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl space-y-6">
            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <UserCheck className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">1. Sobre a Lumi&ecirc; e uso da plataforma</h2>
                  <p className="mt-3 text-[#5f4b42] leading-relaxed">
                    A Lumi&ecirc; é uma plataforma digital para criação de listas de presentes simbólicos, em que os
                    convidados contribuem financeiramente e o titular recebe os valores em dinheiro. O uso da conta é
                    pessoal, e o titular é responsável por manter dados corretos e atualizados.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <Shield className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">2. Acesso, login e senha</h2>
                  <p className="mt-3 text-[#5f4b42] leading-relaxed">
                    O titular da conta é responsável pela confidencialidade de login e senha. A Lumi&ecirc; não recomenda o
                    compartilhamento de credenciais com terceiros. Qualquer atividade realizada na conta será
                    considerada de responsabilidade do titular até comunicação de uso indevido ao suporte.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <Wallet className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">3. Pagamentos, taxas e repasses</h2>
                  <div className="mt-3 space-y-3 text-[#5f4b42] leading-relaxed">
                    <p>
                      A criação da lista é gratuita, sem mensalidade e sem custo fixo. A cobrança ocorre apenas sobre
                      transações aprovadas.
                    </p>
                    <p>
                        As taxas aplicáveis são informadas no checkout e podem variar conforme a configuração vigente da conta.
                    </p>
                    <p>
                      O titular pode optar por repassar a taxa ao convidado ou assumir o custo da taxa no valor a
                      receber. Em saques solicitados, aplica-se taxa de R$ 3,67 por saque.
                    </p>
                    <p>
                      Solicitações de saque realizadas até 15 horas podem ser liquidadas no mesmo dia. Solicitações
                      após 15 horas seguem para o próximo dia útil. Valores de cartão de crédito seguem janela de
                      disponibilidade conforme prazo de liquidação do mercado (D+30).
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">4. Pagar.me e processamento financeiro</h2>
                  <div className="mt-3 space-y-3 text-[#5f4b42] leading-relaxed">
                    <p>
                      A Lumi&ecirc; utiliza a Pagar.me como parceira de pagamentos para processar transações, validar
                      operações, mitigar risco de fraude e executar repasses.
                    </p>
                    <p>
                      Processos de autorização, captura, recusa, análise antifraude, estorno e liquidação financeira
                      seguem também critérios técnicos e regras operacionais da Pagar.me e da adquirente.
                    </p>
                    <p>
                      Em situações de recusa por emissor, antifraude, inconsistência cadastral ou risco operacional, a
                      transação pode não ser concluída, mesmo com tentativa válida de pagamento.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">5. Conduta e conteúdo permitido</h2>
                  <div className="mt-3 space-y-2 text-[#5f4b42] leading-relaxed">
                    <p>Não é permitido utilizar a plataforma para fraude, golpe, lavagem de dinheiro ou ato ilícito.</p>
                    <p>Também é vedada a publicação de conteúdo ofensivo, discriminatório ou que viole direitos de terceiros.</p>
                    <p>A Lumi&ecirc; pode restringir recursos, suspender ou encerrar contas em caso de violação destes termos.</p>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <Shield className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">6. Vigência da conta e exclusão</h2>
                  <p className="mt-3 text-[#5f4b42] leading-relaxed">
                    A conta e os dados operacionais da lista permanecem ativos por até 90 dias após o último dia do
                    evento informado. Após esse prazo, a conta poderá ser excluída da base ativa da plataforma,
                    incluindo dados não obrigatórios para retenção legal e fiscal.
                  </p>
                  <p className="mt-3 text-[#5f4b42] leading-relaxed">
                    Recomendamos que o titular finalize conferências, exporte informações importantes e solicite saques
                    pendentes dentro desse período.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <Shield className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">7. Parceiros, sigilo e atualizações de política</h2>
                  <div className="mt-3 space-y-3 text-[#5f4b42] leading-relaxed">
                    <p>
                      A Lumiê Eventos atua em parceria com profissionais e empresas que acessam exclusivamente o nosso
                      próprio site para execução dos serviços contratados. Ressaltamos que nenhum parceiro está
                      autorizado a solicitar senha pessoal, códigos de verificação, dados bancários completos ou
                      qualquer informação sigilosa dos clientes.
                    </p>
                    <p>
                      A Lumiê Eventos não se responsabiliza por situações indevidas decorrentes do fornecimento dessas
                      informações diretamente a terceiros. Caso algum parceiro solicite senha, dados bancários ou
                      qualquer informação confidencial, orientamos que o cliente não forneça tais dados e entre
                      imediatamente em contato conosco para que possamos apurar os fatos e adotar as medidas
                      administrativas cabíveis.
                    </p>
                    <p>
                      O usuário dos serviços prestados pelo site concede autorização para que a Lumiê Eventos utilize
                      as informações inseridas em seu site exclusivamente para o cumprimento dos objetivos
                      institucionais e operacionais da plataforma. O uso dessas informações não implicará pagamento de
                      royalties de qualquer natureza, tampouco configurará violação de direitos autorais, direitos de
                      publicidade ou quaisquer outros direitos de propriedade eventualmente vinculados.
                    </p>
                    <p>
                      A Lumiê Eventos poderá, a qualquer momento, alterar esta Política de Privacidade, atualizando
                      seu conteúdo conforme necessidades de aprimoramento. Sempre que houver alteração que impacte os
                      direitos dos usuários, será realizado aviso prévio aos interessados.
                    </p>
                  </div>
                </div>
              </div>
            </article>
            <article className="rounded-3xl border border-[#e8d3c5] bg-[#fff8f3] p-7 md:p-8">
              <h2 className="font-display text-3xl text-primary">8. Contato</h2>
              <p className="mt-3 text-[#5f4b42] leading-relaxed">
                Para dúvidas sobre estes termos, suporte técnico ou solicitações relacionadas à conta, entre em contato
                pelo e-mail <strong>contato@lumie.com.br</strong> ou telefone <strong>(16) 98187-3064</strong>.
              </p>
              <p className="mt-3 text-[#5f4b42] leading-relaxed">
                <strong>Lumiê Convites</strong> - CNPJ: <strong>62.076.127/0001-41</strong>.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
