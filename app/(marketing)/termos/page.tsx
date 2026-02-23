import { CheckCircle2, Shield, Wallet, UserCheck, AlertCircle } from 'lucide-react';

export default function TermosPage() {
  return (
    <main className="bg-[#f7f2ed] text-[#2b2422]">
      <section className="border-y border-[#ead6c8] bg-gradient-to-b from-[#f7f2ed] to-[#f2e6dc]">
        <div className="container mx-auto px-6 py-16 md:py-20 text-center">
          <h1 className="font-display text-4xl md:text-6xl text-primary leading-tight">Termos de Uso</h1>
          <p className="mx-auto mt-5 max-w-4xl text-lg md:text-xl text-[#5f4b42] leading-relaxed">
            Ao utilizar a Lumie, vocÃª concorda com as condiÃ§Ãµes abaixo para uso da plataforma, gestÃ£o da sua lista,
            recebimento de valores e seguranÃ§a das operaÃ§Ãµes.
          </p>
          <p className="mt-5 text-sm text-[#7a665c]">Ãšltima atualizaÃ§Ã£o: 19 de fevereiro de 2026</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#e8d3c5] bg-white p-7 md:p-10 shadow-[0_14px_36px_rgba(85,55,40,0.08)]">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-[#ecd9cc] bg-[#fffaf6] p-5">
                <Wallet className="h-6 w-6 text-[#c65a3a]" />
                <p className="mt-3 font-medium text-[#3c2f2a]">Taxa no PIX: 11,99%</p>
              </div>
              <div className="rounded-2xl border border-[#ecd9cc] bg-[#fffaf6] p-5">
                <Wallet className="h-6 w-6 text-[#c65a3a]" />
                <p className="mt-3 font-medium text-[#3c2f2a]">Taxa no cartÃ£o: 15,99%</p>
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
                  <h2 className="font-display text-3xl text-primary">1. Sobre a Lumie e uso da plataforma</h2>
                  <p className="mt-3 text-[#5f4b42] leading-relaxed">
                    A Lumie Ã© uma plataforma digital para criaÃ§Ã£o de listas de presentes simbÃ³licos, em que os
                    convidados contribuem financeiramente e o titular recebe os valores em dinheiro. O uso da conta Ã©
                    pessoal, e o titular Ã© responsÃ¡vel por manter dados corretos e atualizados.
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
                    O titular da conta Ã© responsÃ¡vel pela confidencialidade de login e senha. A Lumie nÃ£o recomenda o
                    compartilhamento de credenciais com terceiros. Qualquer atividade realizada na conta serÃ¡
                    considerada de responsabilidade do titular atÃ© comunicaÃ§Ã£o de uso indevido ao suporte.
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
                      A criaÃ§Ã£o da lista Ã© gratuita, sem mensalidade e sem custo fixo. A cobranÃ§a ocorre apenas sobre
                      transaÃ§Ãµes aprovadas.
                    </p>
                    <p>
                      As taxas aplicÃ¡veis sÃ£o: 11,99% para pagamentos via PIX e 15,99% para pagamentos via cartÃ£o de
                      crÃ©dito.
                    </p>
                    <p>
                      O titular pode optar por repassar a taxa ao convidado ou assumir o custo da taxa no valor a
                      receber. Em saques solicitados, aplica-se taxa de R$ 3,67 por saque.
                    </p>
                    <p>
                      SolicitaÃ§Ãµes de saque realizadas atÃ© 15 horas podem ser liquidadas no mesmo dia. SolicitaÃ§Ãµes
                      apÃ³s 15 horas seguem para o prÃ³ximo dia Ãºtil. Valores de cartÃ£o de crÃ©dito seguem janela de
                      disponibilidade conforme prazo de liquidaÃ§Ã£o do mercado (D+30).
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
                      A Lumie utiliza a Pagar.me como parceira de pagamentos para processar transaÃ§Ãµes, validar
                      operaÃ§Ãµes, mitigar risco de fraude e executar repasses.
                    </p>
                    <p>
                      Processos de autorizaÃ§Ã£o, captura, recusa, anÃ¡lise antifraude, estorno e liquidaÃ§Ã£o financeira
                      seguem tambÃ©m critÃ©rios tÃ©cnicos e regras operacionais da Pagar.me e da adquirente.
                    </p>
                    <p>
                      Em situaÃ§Ãµes de recusa por emissor, antifraude, inconsistÃªncia cadastral ou risco operacional, a
                      transaÃ§Ã£o pode nÃ£o ser concluÃ­da, mesmo com tentativa vÃ¡lida de pagamento.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">5. Conduta e conteÃºdo permitido</h2>
                  <div className="mt-3 space-y-2 text-[#5f4b42] leading-relaxed">
                    <p>NÃ£o Ã© permitido utilizar a plataforma para fraude, golpe, lavagem de dinheiro ou ato ilÃ­cito.</p>
                    <p>TambÃ©m Ã© vedada a publicaÃ§Ã£o de conteÃºdo ofensivo, discriminatÃ³rio ou que viole direitos de terceiros.</p>
                    <p>A Lumie pode restringir recursos, suspender ou encerrar contas em caso de violaÃ§Ã£o destes termos.</p>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <Shield className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">6. VigÃªncia da conta e exclusÃ£o</h2>
                  <p className="mt-3 text-[#5f4b42] leading-relaxed">
                    A conta e os dados operacionais da lista permanecem ativos por atÃ© 90 dias apÃ³s o Ãºltimo dia do
                    evento informado. ApÃ³s esse prazo, a conta poderÃ¡ ser excluÃ­da da base ativa da plataforma,
                    incluindo dados nÃ£o obrigatÃ³rios para retenÃ§Ã£o legal e fiscal.
                  </p>
                  <p className="mt-3 text-[#5f4b42] leading-relaxed">
                    Recomendamos que o titular finalize conferÃªncias, exporte informaÃ§Ãµes importantes e solicite saques
                    pendentes dentro desse perÃ­odo.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <Shield className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">7. Parceiros, sigilo e atualizacoes de politica</h2>
                  <div className="mt-3 space-y-3 text-[#5f4b42] leading-relaxed">
                    <p>
                      A Lumie Eventos atua em parceria com profissionais e empresas que acessam exclusivamente o nosso
                      proprio site para execucao dos servicos contratados. Ressaltamos que nenhum parceiro esta
                      autorizado a solicitar senha pessoal, codigos de verificacao, dados bancarios completos ou
                      qualquer informacao sigilosa dos clientes.
                    </p>
                    <p>
                      A Lumie Eventos nao se responsabiliza por situacoes indevidas decorrentes do fornecimento dessas
                      informacoes diretamente a terceiros. Caso algum parceiro solicite senha, dados bancarios ou
                      qualquer informacao confidencial, orientamos que o cliente nao forneca tais dados e entre
                      imediatamente em contato conosco para que possamos apurar os fatos e adotar as medidas
                      administrativas cabiveis.
                    </p>
                    <p>
                      O usuario dos servicos prestados pelo site concede autorizacao para que a Lumie Eventos utilize
                      as informacoes inseridas em seu site exclusivamente para o cumprimento dos objetivos
                      institucionais e operacionais da plataforma. O uso dessas informacoes nao implicara pagamento de
                      royalties de qualquer natureza, tampouco configurara violacao de direitos autorais, direitos de
                      publicidade ou quaisquer outros direitos de propriedade eventualmente vinculados.
                    </p>
                    <p>
                      A Lumie Eventos podera, a qualquer momento, alterar esta Politica de Privacidade, atualizando
                      seu conteudo conforme necessidades de aprimoramento. Sempre que houver alteracao que impacte os
                      direitos dos usuarios, sera realizado aviso previo aos interessados.
                    </p>
                  </div>
                </div>
              </div>
            </article>
            <article className="rounded-3xl border border-[#e8d3c5] bg-[#fff8f3] p-7 md:p-8">
              <h2 className="font-display text-3xl text-primary">8. Contato</h2>
              <p className="mt-3 text-[#5f4b42] leading-relaxed">
                Para duvidas sobre estes termos, suporte tecnico ou solicitacoes relacionadas a conta, entre em contato
                pelo e-mail <strong>contato@lumie.com.br</strong> ou telefone <strong>(16) 98187-3064</strong>.
              </p>
              <p className="mt-3 text-[#5f4b42] leading-relaxed">
                <strong>Lumie Convites</strong> - CNPJ: <strong>62.076.127/0001-41</strong>.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}


