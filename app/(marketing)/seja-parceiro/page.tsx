import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BadgeDollarSign, BarChart3, Rocket, ShieldCheck, Sparkles, Users } from 'lucide-react';

const averageGiftsPerClient = 25;
const averageGiftValue = 100;
const clientsProjection = [1, 5, 15, 30, 60];

const revenueExamples = clientsProjection.map((clientes) => {
  const mediaPresentesRecebidos = clientes * averageGiftsPerClient;
  const totalPresentes = mediaPresentesRecebidos * averageGiftValue;
  const comissao = totalPresentes * 0.02;
  return {
    clientes,
    mediaPresentesRecebidos,
    valorMedioPorPresente: averageGiftValue,
    totalPresentes,
    comissao,
  };
});

export default function SejaParceiroPage() {
  return (
    <div className="bg-[#f7f5f2]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fff5ee] via-[#fdf8f4] to-[#f5ece5] border-b border-[#ecdccf]">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#e8cdbd] bg-white px-4 py-2 text-sm text-[#4a3a33]">
                <Sparkles className="w-4 h-4 text-primary" />
                Programa de Parceiros LUMIE
              </span>

              <h1 className="font-display text-5xl lg:text-6xl leading-tight text-[#2b2422]">
                Conviteira ou cerimonialista... e se cada evento tambem virasse renda?
              </h1>

              <p className="text-lg text-[#5f534e] max-w-2xl">
                A LUMIE transforma experiencias, e agora tambem transforma seus resultados. 💼🌷
                <br />
                Ao se tornar parceira, voce recebe <strong>2% de comissao</strong> sobre todos os presentes convertidos em dinheiro nas listas dos seus clientes.
              </p>

              <Button asChild size="lg" className="rounded-xl px-8 py-6 text-base">
                <Link href="/cadastro?tipo=parceiro">
                  Seja Nossa Parceira
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="rounded-3xl bg-white border border-[#e7d7cb] p-7 shadow-xl">
              <h2 className="font-display text-3xl text-[#2b2422] mb-4">Por que clientes escolhem a LUMIE? ✨</h2>
              <ul className="space-y-3 text-[#5f534e]">
                <li className="flex gap-2"><span>✅</span><span>Lista de presentes com visual premium</span></li>
                <li className="flex gap-2"><span>✅</span><span>Pagina completa do evento (layout, recados, RSVP)</span></li>
                <li className="flex gap-2"><span>✅</span><span>Gestao simples de pagamentos e saques</span></li>
                <li className="flex gap-2"><span>✅</span><span>Experiencia moderna para clientes e convidados</span></li>
              </ul>
              <div className="mt-6 rounded-2xl bg-[#f7f1eb] p-4 border border-[#e9d8cc]">
                <p className="text-sm text-[#6c5d56]">
                  💡 Voce nao vende so uma lista: voce entrega uma experiencia digital sofisticada para o cliente final.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl text-[#2b2422] mb-3">Como funciona na pratica</h2>
            <p className="text-[#6b5f58] text-lg">Voce indica. A LUMIE opera. Voce recebe. Simples assim.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[#eadacf] bg-[#fffaf6] p-7">
              <Users className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-display text-2xl text-[#2b2422] mb-2">1. Indique clientes</h3>
              <p className="text-[#61554f]">Convide seus clientes para criarem a lista com a LUMIE.</p>
            </div>

            <div className="rounded-2xl border border-[#eadacf] bg-[#fffaf6] p-7">
              <ShieldCheck className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-display text-2xl text-[#2b2422] mb-2">2. A plataforma cuida de tudo</h3>
              <p className="text-[#61554f]">Tecnologia, suporte, sistema e operacao ficam com a nossa equipe.</p>
            </div>

            <div className="rounded-2xl border border-[#eadacf] bg-[#fffaf6] p-7">
              <BadgeDollarSign className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-display text-2xl text-[#2b2422] mb-2">3. Voce recebe comissao</h3>
              <p className="text-[#61554f]">Ganhe 2% sobre os presentes convertidos em dinheiro nas listas indicadas.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f6efe9] border-y border-[#eadacf]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl text-[#2b2422] mb-3">Sem dor de cabeca para voce</h2>
            <p className="text-[#6b5f58] text-lg">Enquanto voce brilha na frente, a LUMIE faz o trabalho pesado nos bastidores.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[#e3d2c6] bg-white p-6">
              <p className="text-[#5f534e] text-lg mb-3">🚫 Sem investir em sites caros</p>
              <p className="text-[#5f534e] text-lg mb-3">🚫 Sem lidar com plataformas complexas</p>
              <p className="text-[#5f534e] text-lg mb-3">🚫 Sem arcar com custos de operacao</p>
              <p className="text-[#5f534e] text-lg">🚫 Sem equipe, suporte ou dor de cabeca</p>
            </div>
            <div className="rounded-2xl border border-[#e3d2c6] bg-white p-6">
              <h3 className="font-display text-2xl text-[#2b2422] mb-3">Parceria elegante e estrategica 🌸</h3>
              <p className="text-[#61554f] mb-2">Seus clientes recebem uma experiencia digital sofisticada, moderna e encantadora.</p>
              <p className="text-[#61554f] mb-2">Voce agrega mais valor ao seu servico e aumenta sua autoridade no mercado.</p>
              <p className="text-[#61554f]">E ainda cria uma renda recorrente proporcional ao sucesso dos eventos que ja organiza.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-7 h-7 text-primary" />
            <h2 className="font-display text-4xl text-[#2b2422]">Projecao de faturamento do parceiro</h2>
          </div>
          <p className="text-[#685b55] mb-8">
            Cenarios ilustrativos com media de {averageGiftsPerClient} presentes por cliente e ticket medio de R$ {averageGiftValue.toLocaleString('pt-BR')} por presente.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-[#e3d2c6] bg-white">
            <table className="w-full text-left min-w-[760px]">
              <thead className="bg-[#fbf4ee]">
                <tr className="text-[#4f3f38]">
                  <th className="px-5 py-4 font-semibold">Clientes</th>
                  <th className="px-5 py-4 font-semibold">Media de presentes recebidos</th>
                  <th className="px-5 py-4 font-semibold">Total de presentes recebidos (R$)</th>
                  <th className="px-5 py-4 font-semibold">Comissao (2%)</th>
                </tr>
              </thead>
              <tbody>
                {revenueExamples.map((item) => (
                  <tr key={item.clientes} className="border-t border-[#f0e2d8] text-[#5f534e]">
                    <td className="px-5 py-4">{item.clientes}</td>
                    <td className="px-5 py-4">{item.mediaPresentesRecebidos} presentes (R$ {item.valorMedioPorPresente.toLocaleString('pt-BR')} cada)</td>
                    <td className="px-5 py-4">R$ {item.totalPresentes.toLocaleString('pt-BR')}</td>
                    <td className="px-5 py-4 font-semibold text-[#1e8a43]">R$ {item.comissao.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f6efe9] border-t border-[#eadacf]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl text-[#2b2422] mb-4">Mais autoridade. Mais renda. Zero complicacao. 💎</h2>
          <p className="text-lg text-[#6a5e58] mb-8">
            LUMIE: enquanto voce realiza sonhos, nos potencializamos seus ganhos.
          </p>
          <Button asChild size="lg" className="rounded-xl px-8 py-6 text-base">
            <Link href="/cadastro?tipo=parceiro">
              Tornar-se parceiro
              <Rocket className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
