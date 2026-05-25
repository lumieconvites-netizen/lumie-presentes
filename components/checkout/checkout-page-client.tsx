'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export type GiftResponse = {
  gift: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    basePrice: number;
    availableQty: number;
    totalQuantity: number;
  };
  giftList: {
    id: string;
    title: string;
    slug: string;
    feeMode: 'PASS_TO_GUEST' | 'ABSORB';
    allowMessages: boolean;
    allowPhotoUpload: boolean;
    feePercentPix: number;
    feePercentCreditCard: number;
  };
};

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcTotals(base: number, feeMode: 'PASS_TO_GUEST' | 'ABSORB', feePercent: number) {
  const fee = Number((base * (feePercent / 100)).toFixed(2));
  if (feeMode === 'PASS_TO_GUEST') {
    return {
      base,
      fee,
      total: Number((base + fee).toFixed(2)),
      net: base,
    };
  }

  return {
    base,
    fee,
    total: base,
    net: Number((base - fee).toFixed(2)),
  };
}

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function buildCheckoutErrorMessage(data: any) {
  const baseError = data?.error ?? 'Erro ao processar pedido';
  const orderId = data?.orderId ? ` Pedido: ${data.orderId}.` : '';
  const statusHint =
    data?.transactionStatus === 'not_authorized'
      ? ' Cartão não autorizado pelo emissor. Tente outro cartão ou PIX.'
      : '';
  const detail = data?.details ? ` ${data.details}` : '';
  return `${baseError}${detail}${statusHint}${orderId}`.trim();
}

type CheckoutPageClientProps = {
  giftId: string;
  initialGiftData: GiftResponse | null;
  initialSlug: string | null;
};

export default function CheckoutPageClient({
  giftId,
  initialGiftData,
  initialSlug,
}: CheckoutPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slugParam = searchParams.get('slug');

  const [giftData, setGiftData] = useState<GiftResponse | null>(initialGiftData);
  const [loadingGift, setLoadingGift] = useState(!initialGiftData);
  const [submitting, setSubmitting] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestDocument, setGuestDocument] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [message, setMessage] = useState('');
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardExpMonth, setCardExpMonth] = useState('');
  const [cardExpYear, setCardExpYear] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardInstallments, setCardInstallments] = useState(1);
  const [billingZipCode, setBillingZipCode] = useState('');
  const [billingStreet, setBillingStreet] = useState('');
  const [billingNumber, setBillingNumber] = useState('');
  const [billingNeighborhood, setBillingNeighborhood] = useState('');
  const [billingComplement, setBillingComplement] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [pixData, setPixData] = useState<{
    qrCode: string | null;
    qrCodeUrl: string | null;
    checkoutUrl: string | null;
    expiresAt: string | null;
    splitApplied: boolean;
    splitReason: string | null;
    orderId: string;
  } | null>(null);
  const [pixOrderStatus, setPixOrderStatus] = useState<
    'PENDING' | 'PAID' | 'AUTHORIZED' | 'REFUSED' | 'REFUNDED' | 'CHARGEBACK' | null
  >(null);

  useEffect(() => {
    if (initialGiftData && initialSlug === slugParam) {
      setGiftData(initialGiftData);
      setLoadingGift(false);
      return;
    }

    let cancelled = false;
    setLoadingGift(true);

    (async () => {
      try {
        const qs = slugParam ? `?slug=${encodeURIComponent(slugParam)}` : '';
        const res = await fetch(`/api/public/gifts/${giftId}${qs}`, { cache: 'no-store' });
        const data = await parseJsonSafe(res);

        if (!res.ok) {
          throw new Error(data?.error ?? 'Presente não encontrado');
        }

        if (!cancelled) setGiftData(data as GiftResponse);
      } catch (error: any) {
        if (!cancelled) {
          alert(error?.message ?? 'Erro ao carregar checkout');
        }
      } finally {
        if (!cancelled) setLoadingGift(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [giftId, initialGiftData, initialSlug, slugParam]);

  useEffect(() => {
    if (!pixData?.orderId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const pollStatus = async () => {
      try {
        const emailParam = guestEmail.trim()
          ? `?email=${encodeURIComponent(guestEmail.trim())}`
          : '';
        const res = await fetch(`/api/public/orders/${pixData.orderId}/status${emailParam}`, {
          cache: 'no-store',
        });
        const data = await parseJsonSafe(res);
        if (!res.ok || cancelled) return;

        const status = (data?.status ?? null) as
          | 'PENDING'
          | 'PAID'
          | 'AUTHORIZED'
          | 'REFUSED'
          | 'REFUNDED'
          | 'CHARGEBACK'
          | null;
        setPixOrderStatus(status);

        if (status && ['PAID', 'AUTHORIZED', 'REFUSED', 'REFUNDED', 'CHARGEBACK'].includes(status)) {
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
        }
      } catch {
        // Ignora falhas transientes de rede no polling.
      }
    };

    pollStatus();
    timer = setInterval(pollStatus, 5000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [pixData?.orderId, guestEmail]);

  const feeMode = giftData?.giftList.feeMode ?? 'PASS_TO_GUEST';
  const feePercentPix = Number(giftData?.giftList.feePercentPix ?? 7.99);
  const feePercentCreditCard = Number(giftData?.giftList.feePercentCreditCard ?? feePercentPix);
  const available = giftData?.gift.availableQty ?? 0;
  const qtyMax = Math.max(1, available);

  const baseTotal = useMemo(() => {
    const value = Number(giftData?.gift.basePrice ?? 0) * Math.max(1, Number(qty || 1));
    return Number(value.toFixed(2));
  }, [giftData?.gift.basePrice, qty]);

  const selectedFeePercent = paymentMethod === 'CREDIT_CARD' ? feePercentCreditCard : feePercentPix;
  const totals = useMemo(
    () => calcTotals(baseTotal, feeMode, selectedFeePercent),
    [baseTotal, feeMode, selectedFeePercent]
  );
  const displayUnitPrice = useMemo(() => {
    const single = calcTotals(Number(giftData?.gift.basePrice ?? 0), feeMode, selectedFeePercent);
    return single.total;
  }, [giftData?.gift.basePrice, feeMode, selectedFeePercent]);

  async function handleCheckout() {
    if (!giftData) return;

    const quantity = Math.max(1, Number(qty || 1));

    if (!guestName.trim()) return alert('Digite seu nome.');
    if (!guestEmail.trim()) return alert('Digite seu email.');
    if (quantity > available) return alert(`Quantidade indisponível. Máximo: ${available}.`);
    if (paymentMethod === 'CREDIT_CARD') {
      if (!cardNumber.trim()) return alert('Digite o número do cartão.');
      if (!cardHolderName.trim()) return alert('Digite o nome do titular.');
      if (!cardExpMonth.trim()) return alert('Digite o mes de validade.');
      if (!cardExpYear.trim()) return alert('Digite o ano de validade.');
      if (!cardCvv.trim()) return alert('Digite o CVV.');
      if (billingZipCode.replace(/\D/g, '').length !== 8) return alert('Digite um CEP valido para o endereco de cobranca.');
      if (!billingStreet.trim()) return alert('Digite a rua do endereco de cobranca.');
      if (!billingNumber.trim()) return alert('Digite o numero do endereco de cobranca.');
      if (!billingNeighborhood.trim()) return alert('Digite o bairro do endereco de cobranca.');
      if (!billingCity.trim()) return alert('Digite a cidade do endereco de cobranca.');
      if (billingState.trim().length !== 2) return alert('Digite a UF do endereco de cobranca.');
    }

    const phoneDigits = guestPhone.replace(/\D/g, '');
    const parsedArea = phoneDigits.length >= 10 ? phoneDigits.slice(0, 2) : '';
    const parsedNumber = phoneDigits.length >= 10 ? phoneDigits.slice(2) : '';

    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftId: giftData.gift.id,
          giftListId: giftData.giftList.id,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          guestDocument: guestDocument.trim() || undefined,
          guestPhoneArea: parsedArea || undefined,
          guestPhoneNumber: parsedNumber || undefined,
          paymentMethod,
          card:
            paymentMethod === 'CREDIT_CARD'
              ? {
                  number: cardNumber,
                  holderName: cardHolderName,
                  expMonth: cardExpMonth,
                  expYear: cardExpYear,
                  cvv: cardCvv,
                  installments: cardInstallments,
                }
              : undefined,
          billingAddress:
            paymentMethod === 'CREDIT_CARD'
              ? {
                  zipCode: billingZipCode,
                  street: billingStreet,
                  number: billingNumber,
                  neighborhood: billingNeighborhood,
                  complement: billingComplement,
                  city: billingCity,
                  state: billingState,
                }
              : undefined,
          quantity,
          message: message.trim() || undefined,
          signature: guestName.trim(),
        }),
      });

      const data = await parseJsonSafe(res);
      if (!res.ok) {
        throw new Error(buildCheckoutErrorMessage(data));
      }

      if (data?.mode === 'pagarme_pix') {
        setPixData({
          qrCode: data?.pixQrCode ?? null,
          qrCodeUrl: data?.pixQrCodeUrl ?? data?.checkoutUrl ?? null,
          checkoutUrl: data?.checkoutUrl ?? null,
          expiresAt: data?.expiresAt ?? null,
          splitApplied: Boolean(data?.splitApplied),
          splitReason: data?.splitReason ?? null,
          orderId: data?.orderId,
        });
        return;
      }

      if (data?.mode === 'pagarme_credit_card') {
        alert('Pagamento em cartão enviado com sucesso. Ele pode ficar em processamento até a confirmação.');
        router.push(`/site/${giftData.giftList.slug}`);
        router.refresh();
        return;
      } else {
        alert(data?.message || data?.error || 'Pedido registrado com sucesso.');
      }
      router.push(`/site/${giftData.giftList.slug}`);
      router.refresh();
    } catch (error: any) {
      alert(error?.message ?? 'Erro ao finalizar checkout');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingGift) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="p-6">Carregando checkout...</Card>
      </div>
    );
  }

  if (!giftData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="text-lg font-semibold">Presente não encontrado</div>
          <div className="text-sm text-gray-500 mt-1">Volte para a lista e tente novamente.</div>
          <Button className="mt-6" onClick={() => router.push('/site')}>
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  const { gift, giftList } = giftData;
  const soldOut = available <= 0;
  const pixExpiresLabel =
    pixData?.expiresAt ? new Date(pixData.expiresAt).toLocaleString('pt-BR') : null;
  const pixQrImageSrc = pixData?.qrCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(pixData.qrCode)}`
    : pixData?.qrCodeUrl ?? null;

  async function handleCopyPixCode() {
    if (!pixData?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      alert('Código PIX copiado.');
    } catch {
      alert('Não foi possível copiar automaticamente. Copie manualmente o código.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.push(`/site/${giftList.slug}`)}>
            Voltar para lista
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="relative w-full h-56 bg-gray-100">
              {gift.imageUrl ? (
                <Image src={gift.imageUrl} alt={gift.name} fill className="object-cover" />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">Sem foto</div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-semibold">{gift.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{gift.description || 'Sem descrição'}</div>
                </div>
                <Badge variant={soldOut ? 'secondary' : 'default'}>{soldOut ? 'Esgotado' : 'Disponível'}</Badge>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                Disponível: <b>{gift.availableQty}</b> de {gift.totalQuantity}
              </div>

              <div className="mt-4">
                <div className="text-2xl font-bold">{formatBRL(displayUnitPrice)}</div>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-3 p-6">
            <div className="text-xl font-semibold">Checkout</div>
            <div className="text-sm text-gray-500 mt-1">Finalize seu presente e deixe um recado opcional.</div>

            <div className="grid gap-3 mt-6">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={paymentMethod === 'PIX' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('PIX')}
                >
                  PIX
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'CREDIT_CARD' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                >
                  Cartão de crédito
                </Button>
              </div>

              <Input placeholder="Seu nome" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
              <Input placeholder="Seu email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
              <Input
                placeholder="CPF (somente números)"
                value={guestDocument}
                onChange={(e) => setGuestDocument(e.target.value)}
              />
              <Input
                placeholder="Celular com DDD (ex: 11988887777)"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Quantidade de presentes</div>
                  <Input
                    type="number"
                    min={1}
                    max={qtyMax}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Disponível neste presente</div>
                  <Input disabled value={`Máx: ${qtyMax} unidades`} />
                </div>
              </div>

              {giftList.allowMessages ? (
                <Input
                  placeholder="Recado para o mural (opcional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              ) : null}

              {paymentMethod === 'CREDIT_CARD' ? (
                <div className="space-y-3 rounded-lg border bg-white p-3">
                  <div className="text-sm font-medium">Dados do cartão</div>
                  <Input
                    placeholder="Número do cartão"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                  <Input
                    placeholder="Nome do titular"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      placeholder="Mes (MM)"
                      value={cardExpMonth}
                      onChange={(e) => setCardExpMonth(e.target.value)}
                    />
                    <Input
                      placeholder="Ano (AA ou AAAA)"
                      value={cardExpYear}
                      onChange={(e) => setCardExpYear(e.target.value)}
                    />
                    <Input placeholder="CVV" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Parcelas (1 = à vista)</div>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      placeholder="Número de parcelas"
                      value={cardInstallments}
                      onChange={(e) =>
                        setCardInstallments(Math.max(1, Math.min(12, Number(e.target.value) || 1)))
                      }
                    />
                  </div>
                  <div className="border-t pt-3">
                    <div className="mb-3 text-sm font-medium">Endereço de cobrança</div>
                    <div className="grid gap-3">
                      <Input
                        placeholder="CEP"
                        value={billingZipCode}
                        onChange={(e) => setBillingZipCode(e.target.value)}
                      />
                      <Input
                        placeholder="Rua"
                        value={billingStreet}
                        onChange={(e) => setBillingStreet(e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Número"
                          value={billingNumber}
                          onChange={(e) => setBillingNumber(e.target.value)}
                        />
                        <Input
                          placeholder="Complemento (opcional)"
                          value={billingComplement}
                          onChange={(e) => setBillingComplement(e.target.value)}
                        />
                      </div>
                      <Input
                        placeholder="Bairro"
                        value={billingNeighborhood}
                        onChange={(e) => setBillingNeighborhood(e.target.value)}
                      />
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          className="col-span-2"
                          placeholder="Cidade"
                          value={billingCity}
                          onChange={(e) => setBillingCity(e.target.value)}
                        />
                        <Input
                          placeholder="UF"
                          maxLength={2}
                          value={billingState}
                          onChange={(e) => setBillingState(e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between text-base">
                <span>Total</span>
                <b>{formatBRL(totals.total)}</b>
              </div>
            </div>

            {pixData ? (
              <div className="mt-6 border rounded-lg p-4 space-y-3">
                <div className="font-medium">PIX gerado</div>
                <p className="text-xs text-gray-500">
                  Depois de pagar no app do banco, volte para esta tela para confirmar.
                </p>
                {pixExpiresLabel ? <div className="text-xs text-gray-500">Valido até {pixExpiresLabel}</div> : null}
                {pixOrderStatus === 'PAID' || pixOrderStatus === 'AUTHORIZED' ? (
                  <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    Pagamento efetuado com sucesso.
                  </div>
                ) : null}
                {pixOrderStatus === 'REFUSED' || pixOrderStatus === 'REFUNDED' || pixOrderStatus === 'CHARGEBACK' ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    Pagamento nao confirmado. Gere um novo PIX para concluir.
                  </div>
                ) : null}
                {!pixOrderStatus || pixOrderStatus === 'PENDING' ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    Aguardando confirmacao do pagamento...
                  </div>
                ) : null}
                {pixQrImageSrc ? (
                  <div className="bg-white rounded border p-2 flex justify-center">
                    <img
                      src={pixQrImageSrc}
                      alt="QR Code PIX"
                      width={280}
                      height={280}
                      className="w-full max-w-[280px] h-auto object-contain"
                    />
                  </div>
                ) : null}

                {pixData.qrCode ? (
                  <>
                    <Input readOnly value={pixData.qrCode} />
                    <Button type="button" variant="outline" className="w-full" onClick={handleCopyPixCode}>
                      Copiar PIX copia e cola
                    </Button>
                  </>
                ) : null}

                {!pixData.qrCode && pixData.checkoutUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(pixData.checkoutUrl as string, '_blank', 'noopener,noreferrer')}
                  >
                    Abrir PIX
                  </Button>
                ) : null}

                {!pixData.qrCode && !pixData.qrCodeUrl && !pixData.checkoutUrl ? (
                  <p className="text-xs text-amber-700">
                    Não foi possível exibir o QR/copia e cola neste pedido. Gere um novo pagamento.
                  </p>
                ) : null}

                <Button type="button" className="w-full" onClick={() => router.push(`/site/${giftData.giftList.slug}`)}>
                  Voltar para site do evento
                </Button>
                {!pixData.splitApplied ? (
                  <p className="text-[11px] text-amber-700">
                    Aviso interno: split não aplicado ({pixData.splitReason ?? 'desconhecido'}).
                  </p>
                ) : null}
              </div>
            ) : (
              <Button className="w-full mt-6" onClick={handleCheckout} disabled={submitting || soldOut}>
                {submitting ? 'Processando...' : `Presentear ${formatBRL(totals.total)}`}
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
