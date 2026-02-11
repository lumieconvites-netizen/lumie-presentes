import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-terracota-50 via-white to-gold-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="relative w-64 h-32">
              <Image
                src="/logo.png"
                alt="LUMIÊ"
                fill
                className="object-contain"
                priority
              />
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-bold text-terracota-700 max-w-4xl">
              Transforme seus presentes em realizações
            </h1>
            
            <p className="text-xl md:text-2xl text-terracota-600 max-w-2xl">
              Crie sua lista de presentes inteligente. Seus convidados escolhem presentes, 
              você recebe em dinheiro para realizar seus sonhos.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button 
                asChild 
                size="lg" 
                className="bg-terracota-500 hover:bg-terracota-600 text-white text-lg px-8 py-6"
              >
                <Link href="/cadastro">Criar minha lista grátis</Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="border-terracota-500 text-terracota-700 hover:bg-terracota-50 text-lg px-8 py-6"
              >
                <Link href="/como-funciona">Como funciona</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gold-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-terracota-200 rounded-full blur-3xl opacity-30" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-center text-terracota-700 mb-16">
            Por que escolher a LUMIÊ?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="✨"
              title="Flexibilidade Total"
              description="Receba em dinheiro e use como preferir. Seus sonhos, suas escolhas."
            />
            <FeatureCard
              icon="🎨"
              title="Personalize Tudo"
              description="Editor visual completo. Cores, fotos, textos - tudo do seu jeito."
            />
            <FeatureCard
              icon="💳"
              title="Pagamento Seguro"
              description="Integração com Pagar.me. Dinheiro direto na sua conta."
            />
            <FeatureCard
              icon="📱"
              title="100% Responsivo"
              description="Sua lista linda em qualquer dispositivo, celular, tablet ou desktop."
            />
            <FeatureCard
              icon="💌"
              title="Recados Especiais"
              description="Convidados podem deixar mensagens carinhosas junto com o presente."
            />
            <FeatureCard
              icon="📊"
              title="Dashboard Completo"
              description="Acompanhe tudo em tempo real: valores, presentes e mensagens."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gradient-to-br from-terracota-50 to-gold-50">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-center text-terracota-700 mb-16">
            Como funciona?
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-12">
            <Step
              number="1"
              title="Crie sua conta"
              description="Cadastre-se gratuitamente em menos de 2 minutos."
            />
            <Step
              number="2"
              title="Monte sua lista"
              description="Escolha um template ou crie do zero. Adicione presentes com fotos e valores."
            />
            <Step
              number="3"
              title="Compartilhe"
              description="Envie o link da sua lista para amigos e família."
            />
            <Step
              number="4"
              title="Receba em dinheiro"
              description="Quando alguém presenteia, o valor cai direto na sua conta!"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-terracota-700 mb-8">
            Preço justo e transparente
          </h2>
          
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-terracota-50 to-gold-50 rounded-2xl p-12 shadow-lg">
            <div className="text-6xl font-display font-bold text-terracota-600 mb-4">
              7,99%
            </div>
            <p className="text-xl text-terracota-700 mb-6">
              Taxa única por presente recebido
            </p>
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Sem mensalidade</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Sem taxa de cadastro</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Você escolhe quem paga a taxa</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Até 100 presentes por lista</span>
              </li>
            </ul>
            
            <Button 
              asChild 
              size="lg"
              className="bg-terracota-500 hover:bg-terracota-600 text-white"
            >
              <Link href="/cadastro">Começar agora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-terracota-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-display text-xl font-bold mb-4">LUMIÊ</h3>
              <p className="text-terracota-200">
                Transforme seus presentes em realizações
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-terracota-200">
                <li><Link href="/como-funciona" className="hover:text-white">Como funciona</Link></li>
                <li><Link href="/templates" className="hover:text-white">Templates</Link></li>
                <li><Link href="/precos" className="hover:text-white">Preços</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-terracota-200">
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
                <li><Link href="/contato" className="hover:text-white">Contato</Link></li>
                <li><Link href="/ajuda" className="hover:text-white">Central de ajuda</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-terracota-200">
                <li><Link href="/termos" className="hover:text-white">Termos de uso</Link></li>
                <li><Link href="/privacidade" className="hover:text-white">Privacidade</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-terracota-800 mt-8 pt-8 text-center text-terracota-300">
            <p>&copy; 2024 LUMIÊ. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-gradient-to-br from-white to-terracota-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-display text-2xl font-bold text-terracota-700 mb-3">{title}</h3>
      <p className="text-terracota-600">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0 w-16 h-16 bg-terracota-500 text-white rounded-full flex items-center justify-center font-display text-2xl font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-display text-2xl font-bold text-terracota-700 mb-2">{title}</h3>
        <p className="text-terracota-600 text-lg">{description}</p>
      </div>
    </div>
  );
}
