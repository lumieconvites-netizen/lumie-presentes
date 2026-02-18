export default function TermosPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-6">
      <h1 className="font-display text-4xl text-[#8E3D2C]">Termos de Uso</h1>
      <p className="text-gray-600">
        Ao utilizar a LUMIÊ, voce concorda com estes termos. O servico permite criar lista de presentes e
        receber pagamentos em dinheiro conforme as regras da plataforma.
      </p>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Conta e acesso</h2>
        <p className="text-gray-600">Voce e responsavel pelas informacoes da conta e seguranca da senha.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Pagamentos e taxas</h2>
        <p className="text-gray-600">A taxa da plataforma e aplicada conforme configuracao da sua lista.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Conteudo e conduta</h2>
        <p className="text-gray-600">Nao e permitido uso indevido, fraude ou publicacao de conteudo ilicito.</p>
      </section>
    </main>
  );
}

