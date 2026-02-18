export default function PrivacidadePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-6">
      <h1 className="font-display text-4xl text-[#8E3D2C]">Politica de Privacidade</h1>
      <p className="text-gray-600">
        Esta politica explica como coletamos, usamos e protegemos seus dados pessoais na LUMIÊ.
      </p>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Dados coletados</h2>
        <p className="text-gray-600">Coletamos dados de cadastro, uso da plataforma e transacoes.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Finalidade</h2>
        <p className="text-gray-600">Usamos os dados para operacao da conta, pagamentos e suporte.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Compartilhamento</h2>
        <p className="text-gray-600">
          Compartilhamos apenas com provedores necessarios para pagamento, armazenamento e seguranca.
        </p>
      </section>
    </main>
  );
}

