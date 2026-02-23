import { Shield, Database, Lock, Users, FileCheck, Mail } from 'lucide-react';

export default function PrivacidadePage() {
  return (
    <main className="bg-[#f7f2ed] text-[#2b2422]">
      <section className="border-y border-[#ead6c8] bg-gradient-to-b from-[#f7f2ed] to-[#f2e6dc]">
        <div className="container mx-auto px-6 py-16 md:py-20 text-center">
          <h1 className="font-display text-4xl md:text-6xl text-primary leading-tight">PolÃ­tica de Privacidade</h1>
          <p className="mx-auto mt-5 max-w-4xl text-lg md:text-xl text-[#5f4b42] leading-relaxed">
            Esta PolÃ­tica explica como a Lumiê coleta, utiliza, compartilha e protege seus dados pessoais no uso da
            plataforma.
          </p>
          <p className="mt-5 text-sm text-[#7a665c]">Ãšltima atualizaÃ§Ã£o: 19 de fevereiro de 2026</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#e8d3c5] bg-white p-7 md:p-10 shadow-[0_14px_36px_rgba(85,55,40,0.08)]">
            <h2 className="font-display text-3xl text-primary">1. Quem somos</h2>
            <div className="mt-4 space-y-2 text-[#5f4b42] leading-relaxed">
              <p>
                A <strong>LumiÃª Convites</strong>, inscrita no CNPJ <strong>62.076.127/0001-41</strong>, Ã© a responsÃ¡vel
                pelo tratamento dos dados pessoais no contexto da plataforma Lumiê.
              </p>
              <p>
                Contato: <strong>contato@lumie.com.br</strong> e <strong>(16) 98187-3064</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl space-y-6">
            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <Database className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">2. Dados que coletamos</h2>
                  <div className="mt-3 space-y-2 text-[#5f4b42] leading-relaxed">
                    <p>Podemos coletar, conforme o uso da plataforma:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Dados de cadastro: nome, e-mail, telefone, CPF e informaÃ§Ãµes de conta.</li>
                      <li>Dados da lista: textos, imagens, recados e configuraÃ§Ãµes do evento.</li>
                      <li>Dados transacionais: informaÃ§Ãµes necessÃ¡rias para processar pagamentos e saques.</li>
                      <li>Dados tÃ©cnicos: IP, navegador, dispositivo, cookies e registros de acesso.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <FileCheck className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">3. Para que usamos os dados (finalidades)</h2>
                  <div className="mt-3 space-y-2 text-[#5f4b42] leading-relaxed">
                    <p>Tratamos dados para:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Criar e manter sua conta e sua lista de presentes.</li>
                      <li>Processar pagamentos, saques e validaÃ§Ãµes antifraude.</li>
                      <li>Permitir suporte, comunicaÃ§Ã£o e seguranÃ§a da plataforma.</li>
                      <li>Cumprir obrigaÃ§Ãµes legais, regulatÃ³rias e fiscais.</li>
                      <li>Melhorar a experiÃªncia, desempenho e estabilidade dos serviÃ§os.</li>
                    </ul>
                    <p>
                      As bases legais aplicÃ¡veis incluem execuÃ§Ã£o de contrato, cumprimento de obrigaÃ§Ã£o legal, legÃ­timo
                      interesse e, quando aplicÃ¡vel, consentimento.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <Users className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">4. Compartilhamento de dados</h2>
                  <div className="mt-3 space-y-2 text-[#5f4b42] leading-relaxed">
                    <p>
                      Compartilhamos dados apenas com parceiros necessÃ¡rios para a operaÃ§Ã£o do serviÃ§o, sempre com
                      critÃ©rio de necessidade e seguranÃ§a.
                    </p>
                    <p>
                      Em especial, utilizamos a <strong>Pagar.me</strong> para processamento de pagamentos, anÃ¡lise
                      antifraude, liquidaÃ§Ã£o e repasses financeiros. Nessas hipÃ³teses, os dados necessÃ¡rios para a
                      transaÃ§Ã£o podem ser tratados por essa parceira conforme regras prÃ³prias e legislaÃ§Ã£o aplicÃ¡vel.
                    </p>
                    <p>
                      TambÃ©m podemos compartilhar dados quando exigido por lei, ordem judicial ou autoridade competente.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <Lock className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">5. Cookies e coleta automÃ¡tica</h2>
                  <div className="mt-3 space-y-2 text-[#5f4b42] leading-relaxed">
                    <p>
                      Utilizamos cookies e tecnologias similares para autenticaÃ§Ã£o, seguranÃ§a, desempenho, anÃ¡lise de
                      uso e personalizaÃ§Ã£o da experiÃªncia.
                    </p>
                    <p>
                      VocÃª pode ajustar as permissÃµes de cookies no navegador. PorÃ©m, a desativaÃ§Ã£o de determinados
                      cookies pode limitar o funcionamento da plataforma.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <Shield className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">6. Armazenamento, retenÃ§Ã£o e exclusÃ£o</h2>
                  <div className="mt-3 space-y-2 text-[#5f4b42] leading-relaxed">
                    <p>
                      Aplicamos medidas tÃ©cnicas e organizacionais para proteger dados pessoais contra acesso nÃ£o
                      autorizado, perda, alteraÃ§Ã£o ou uso indevido.
                    </p>
                    <p>
                      A conta e os dados operacionais da lista permanecem ativos por atÃ© <strong>90 dias</strong> apÃ³s o
                      Ãºltimo dia do evento informado. ApÃ³s esse prazo, a conta poderÃ¡ ser excluÃ­da da base ativa.
                    </p>
                    <p>
                      Dados que precisem ser preservados para cumprimento legal, regulatÃ³rio ou defesa de direitos podem
                      ser mantidos pelo prazo necessÃ¡rio.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <FileCheck className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">7. Direitos do titular (LGPD)</h2>
                  <div className="mt-3 space-y-2 text-[#5f4b42] leading-relaxed">
                    <p>Nos termos da LGPD, vocÃª pode solicitar, quando aplicÃ¡vel:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>ConfirmaÃ§Ã£o de tratamento e acesso aos dados.</li>
                      <li>CorreÃ§Ã£o de dados incompletos, inexatos ou desatualizados.</li>
                      <li>AnonimizaÃ§Ã£o, bloqueio ou eliminaÃ§Ã£o de dados desnecessÃ¡rios.</li>
                      <li>Portabilidade, revogaÃ§Ã£o de consentimento e informaÃ§Ãµes sobre compartilhamento.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">8. Contato e encarregado</h2>
                  <p className="mt-3 text-[#5f4b42] leading-relaxed">
                    Para exercer direitos previstos na LGPD, tirar dÃºvidas ou reportar incidente de privacidade, entre
                    em contato com nosso canal: <strong>contato@lumie.com.br</strong>.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-[#fff8f3] p-7 md:p-8">
              <h2 className="font-display text-3xl text-primary">9. AtualizaÃ§Ãµes desta PolÃ­tica</h2>
              <p className="mt-3 text-[#5f4b42] leading-relaxed">
                Esta PolÃ­tica pode ser atualizada para refletir melhorias de serviÃ§o, exigÃªncias legais e ajustes
                operacionais. A versÃ£o vigente serÃ¡ sempre disponibilizada nesta pÃ¡gina com data de atualizaÃ§Ã£o.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}



