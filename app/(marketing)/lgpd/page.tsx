import { Shield, FileCheck, Users, Scale, Mail, CheckCircle2 } from 'lucide-react';

export default function LgpdPage() {
  return (
    <main className="bg-[#f7f2ed] text-[#2b2422]">
      <section className="border-y border-[#ead6c8] bg-gradient-to-b from-[#f7f2ed] to-[#f2e6dc]">
        <div className="container mx-auto px-6 py-16 md:py-20 text-center">
          <h1 className="font-display text-4xl md:text-6xl text-primary leading-tight">LGPD e Seus Direitos</h1>
          <p className="mx-auto mt-5 max-w-4xl text-lg md:text-xl text-[#5f4b42] leading-relaxed">
            Transparência e segurança fazem parte da experiência Lumie. Nesta página explicamos como tratamos dados
            pessoais conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </p>
          <p className="mt-5 text-sm text-[#7a665c]">Última atualização: 19 de fevereiro de 2026</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#e8d3c5] bg-white p-7 md:p-10 shadow-[0_14px_36px_rgba(85,55,40,0.08)]">
            <h2 className="font-display text-3xl text-primary">Responsável pelo tratamento</h2>
            <div className="mt-4 space-y-2 text-[#5f4b42] leading-relaxed">
              <p>
                <strong>Lumiê Convites</strong> - CNPJ <strong>62.076.127/0001-41</strong>
              </p>
              <p>
                Contato para temas de privacidade: <strong>contato@lumie.com.br</strong> e{' '}
                <strong>(16) 98187-3064</strong>
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
                <FileCheck className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">1. O que é tratado pela Lumie</h2>
                  <p className="mt-3 text-[#5f4b42] leading-relaxed">
                    Tratamos dados pessoais necessários para criar conta, operar listas, processar pagamentos, realizar
                    saques, prestar suporte e cumprir obrigações legais. A coleta sempre busca o mínimo necessário para
                    cada finalidade.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <Scale className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">2. Bases legais aplicadas</h2>
                  <div className="mt-3 space-y-2 text-[#5f4b42] leading-relaxed">
                    <p>O tratamento pode ocorrer com base em:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Execução de contrato e prestação dos serviços da plataforma.</li>
                      <li>Cumprimento de obrigação legal ou regulatória.</li>
                      <li>Legítimo interesse para segurança, melhoria e prevenção de fraudes.</li>
                      <li>Consentimento, quando a legislação exigir essa base específica.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <Users className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">3. Compartilhamento e operadores</h2>
                  <p className="mt-3 text-[#5f4b42] leading-relaxed">
                    Compartilhamos dados somente com parceiros essenciais à operação, como processadores de pagamento,
                    infraestrutura e segurança. Esses parceiros atuam como operadores e devem respeitar requisitos
                    contratuais e legais de proteção de dados.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <Shield className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">4. Segurança, retenção e ciclo de vida</h2>
                  <div className="mt-3 space-y-2 text-[#5f4b42] leading-relaxed">
                    <p>
                      Adotamos controles técnicos e administrativos para proteger dados pessoais contra uso indevido,
                      perda, alteração ou acesso não autorizado.
                    </p>
                    <p>
                      A conta e os dados operacionais podem permanecer ativos por até <strong>90 dias</strong> após o
                      último dia do evento. Após esse período, os dados poderão ser excluídos da base ativa, observadas
                      obrigações legais e regulatórias de retenção.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-white p-7 md:p-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">5. Direitos do titular</h2>
                  <div className="mt-3 space-y-2 text-[#5f4b42] leading-relaxed">
                    <p>Nos termos da LGPD, você pode solicitar, quando aplicável:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Confirmação da existência de tratamento.</li>
                      <li>Acesso aos seus dados pessoais.</li>
                      <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
                      <li>Anonimização, bloqueio ou eliminação de dados desnecessários.</li>
                      <li>Portabilidade dos dados e informação sobre compartilhamentos.</li>
                      <li>Revogação de consentimento, quando essa for a base legal.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e8d3c5] bg-[#fff8f3] p-7 md:p-8">
              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-6 w-6 text-[#c65a3a]" />
                <div>
                  <h2 className="font-display text-3xl text-primary">6. Como exercer seus direitos</h2>
                  <p className="mt-3 text-[#5f4b42] leading-relaxed">
                    Para solicitações LGPD, entre em contato pelo e-mail <strong>contato@lumie.com.br</strong>.
                    Podemos solicitar informações adicionais para confirmar sua identidade e garantir segurança no
                    atendimento.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

