'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, calculateTotal } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface Gift {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: number;
  availableQty: number;
}

interface GiftList {
  id: string;
  title: string;
  feeMode: 'PASS_TO_GUEST' | 'ABSORB';
  allowMessages: boolean;
  allowPhotoUpload: boolean;
}

export default function CheckoutPage({
  params,
}: {
  params: { slug: string; giftId: string };
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gift, setGift] = useState<Gift | null>(null);
  const [giftList, setGiftList] = useState<GiftList | null>(null);
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    message: '',
    signature: '',
    quantity: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/public/gifts/${params.giftId}?slug=${params.slug}`);
      if (!res.ok) throw new Error('Presente não encontrado');
      
      const data = await res.json();
      setGift(data.gift);
      setGiftList(data.giftList);
    } catch (error: any) {
      toast.error(error.message);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gift || !giftList) return;

    if (!formData.guestName || !formData.guestEmail) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.quantity < 1 || formData.quantity > gift.availableQty) {
      toast.error('Quantidade inválida');
      return;
    }

    setIsProcessing(true);

    try {
      // Criar pedido
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftId: gift.id,
          giftListId: giftList.id,
          guestName: formData.guestName,
          guestEmail: formData.guestEmail,
          quantity: formData.quantity,
          message: formData.message || undefined,
          signature: formData.signature || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      const { orderId, checkoutUrl } = await res.json();

      // Redirecionar para checkout Pagar.me
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.success('Pedido criado! Redirecionando...');
        router.push(`/lista/${params.slug}/sucesso?orderId=${orderId}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar pedido');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!gift || !giftList) {
    return null;
  }

  const baseAmount = Number(gift.basePrice) * formData.quantity;
  const calculation = calculateTotal(baseAmount, giftList.feeMode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-terracota-50 via-white to-gold-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-terracota-100">
        <div className="container mx-auto px-4 py-4">
          <Link href={`/lista/${params.slug}`} className="inline-flex items-center text-terracota-600 hover:text-terracota-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a lista
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-display text-4xl font-bold text-terracota-700 mb-8 text-center">
            Finalizar Presente
          </h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Resumo do Presente */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Resumo do Presente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-48 bg-gradient-to-br from-terracota-100 to-gold-100 rounded-lg mb-4">
                  {gift.imageUrl ? (
                    <Image
                      src={gift.imageUrl}
                      alt={gift.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-6xl">
                      🎁
                    </div>
                  )}
                </div>

                <h3 className="font-display text-2xl font-bold text-terracota-700 mb-2">
                  {gift.name}
                </h3>

                {gift.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {gift.description}
                  </p>
                )}

                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between">
                    <span>Valor unitário:</span>
                    <span className="font-bold">{formatCurrency(Number(gift.basePrice))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantidade:</span>
                    <span className="font-bold">{formData.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-bold">{formatCurrency(baseAmount)}</span>
                  </div>
                  {giftList.feeMode === 'PASS_TO_GUEST' && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Taxa de serviço (7,99%):</span>
                      <span>{formatCurrency(calculation.feeAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-terracota-700 pt-2 border-t">
                    <span>Total:</span>
                    <span>{formatCurrency(calculation.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulário */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Seus Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="guestName">
                      Seu nome <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="guestName"
                      placeholder="Nome completo"
                      value={formData.guestName}
                      onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      required
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guestEmail">
                      Seu email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.guestEmail}
                      onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                      required
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">
                      Quantidade <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={gift.availableQty}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      required
                      disabled={isProcessing}
                    />
                    <p className="text-xs text-muted-foreground">
                      Máximo: {gift.availableQty}
                    </p>
                  </div>

                  {giftList.allowMessages && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="message">Deixe um recado</Label>
                        <Textarea
                          id="message"
                          placeholder="Escreva uma mensagem carinhosa..."
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          disabled={isProcessing}
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signature">Assinatura</Label>
                        <Input
                          id="signature"
                          placeholder="Ex: Com carinho, Ana e Pedro"
                          value={formData.signature}
                          onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                          disabled={isProcessing}
                        />
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-terracota-500 hover:bg-terracota-600 text-lg py-6"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processando...' : `Pagar ${formatCurrency(calculation.totalAmount)}`}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Pagamento seguro via Pagar.me
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
