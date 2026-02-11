import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Heart, Star } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      <Navbar currentPage="home" />

      {/* Hero Section - Split Layout */}
      <section className="relative">
        <div className="container mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm">
                <span className="text-primary text-xl">✨</span>
                <span className="text-sm text-foreground">A nova forma de celebrar</span>
              </div>

              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="font-display text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="text-foreground">Transforme presentes</span>
                  <br />
                  <span className="text-foreground">em </span>
                  <span className="text-primary">sonhos realizados</span>
                </h1>

                <p className="text-lg text-muted-foreground max-w-lg">
                  Crie sua lista de presentes online e receba o valor diretamente na sua conta. 
                  Simples, elegante e sem complicações.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  asChild 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 text-base"
                >
                  <Link href="/cadastro">
                    Criar Minha Lista
                    <span className="ml-2">→</span>
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 py-6 text-base border-2 hover:border-primary"
                >
                  <Link href="/como-funciona">
                    Como Funciona
                  </Link>
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center">
                  {/* Avatars empilhados */}
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">R</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/30 border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">M</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/40 border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">A</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/50 border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">J</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">+2.000</span> listas criadas
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Image */}
            <div className="relative lg:h-[600px] h-[400px]">
              {/* Badge de Recados */}
              <div className="absolute top-8 right-8 z-10 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary fill-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">127 recados</p>
                </div>
              </div>

              {/* Notification de Pagamento */}
              <div className="absolute bottom-20 left-8 z-10 bg-white rounded-2xl shadow-lg px-5 py-4 flex items-center gap-3 max-w-xs">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-lg">✓</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Pagamento recebido!</p>
                  <p className="text-xs text-muted-foreground">R$ 350,00 • Kit Maquiagem</p>
                </div>
              </div>

              {/* Imagem Principal */}
              <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/hero-image.jpg"
                  alt="Celebração"
                  fill
                  className="object-cover"
                  priority
                />
                {/* Overlay sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Por que escolher a LUMIÊ? */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Por que escolher a LUMIÊ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A forma mais moderna e prática de criar sua lista de presentes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                Receba em dinheiro
              </h3>
              <p className="text-muted-foreground">
                Seus convidados presenteiam e você recebe o valor direto na conta. 
                Use como preferir!
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🎨</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                Totalmente personalizável
              </h3>
              <p className="text-muted-foreground">
                Editor visual completo. Escolha cores, fotos, textos e organize como quiser.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                Seguro e confiável
              </h3>
              <p className="text-muted-foreground">
                Pagamentos processados com segurança via Pagar.me. Seus dados protegidos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Como funciona?
            </h2>
            <p className="text-lg text-muted-foreground">
              Simples em apenas 4 passos
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl mb-6">
                  1
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">
                  Crie sua conta
                </h3>
                <p className="text-sm text-muted-foreground">
                  Cadastre-se gratuitamente em menos de 2 minutos
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl mb-6">
                  2
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">
                  Monte sua lista
                </h3>
                <p className="text-sm text-muted-foreground">
                  Adicione presentes com fotos e valores
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl mb-6">
                  3
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">
                  Compartilhe
                </h3>
                <p className="text-sm text-muted-foreground">
                  Envie o link para seus convidados
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl mb-6">
                  4
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">
                  Receba!
                </h3>
                <p className="text-sm text-muted-foreground">
                  O dinheiro cai direto na sua conta
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preço */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-8">
            Preço justo e transparente
          </h2>

          <div className="max-w-lg mx-auto bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-12 shadow-lg">
            <div className="text-6xl font-display font-bold text-primary mb-4">
              7,99%
            </div>
            <p className="text-xl text-foreground mb-8">
              Taxa única por presente recebido
            </p>
            
            <div className="space-y-3 text-left mb-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span className="text-foreground">Sem mensalidade</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span className="text-foreground">Sem taxa de cadastro</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span className="text-foreground">Você escolhe quem paga a taxa</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span className="text-foreground">Até 100 presentes por lista</span>
              </div>
            </div>

            <Button 
              asChild 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-8"
            >
              <Link href="/cadastro">Começar agora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            Pronto para começar?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já transformaram seus presentes em realizações
          </p>
          <Button 
            asChild 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white rounded-full px-12 py-6 text-lg"
          >
            <Link href="/cadastro">
              Criar minha lista gratuita
              <span className="ml-2">→</span>
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2B2422] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="col-span-1 md:col-span-2">
              <div className="relative w-24 h-12 mb-4 brightness-0 invert">
                <Image
                  src="/logo.png"
                  alt="LUMIÊ"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-gray-400 text-sm max-w-sm">
                Transforme seus presentes em sonhos realizados. 
                A forma mais elegante de celebrar momentos especiais.
              </p>
            </div>
            
            <div>
              <h4 className="font-display text-lg mb-4">Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/como-funciona" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Como Funciona
                  </Link>
                </li>
                <li>
                  <Link href="/tarifas" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Tarifas
                  </Link>
                </li>
                <li>
                  <Link href="/templates" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Templates
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-sm text-gray-400 hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-display text-lg mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/termos" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Política de Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="/lgpd" className="text-sm text-gray-400 hover:text-white transition-colors">
                    LGPD
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-500">
              © 2024 LUMIÊ. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
