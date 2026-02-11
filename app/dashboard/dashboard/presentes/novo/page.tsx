'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewGiftPage() {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [giftListId, setGiftListId] = useState<string | null>(null);

  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    basePrice: '',
    totalQuantity: '1',
  });

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      setIsLoadingList(true);
      try {
        const res = await fetch('/api/gift-lists/my-list', {
          signal: ac.signal,
          cache: 'no-store',
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.error || 'Erro ao carregar lista');
        }

        if (!data?.id) {
          throw new Error('Lista não encontrada');
        }

        setGiftListId(data.id);
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        toast.error(error?.message || 'Erro ao carregar lista');
      } finally {
        setIsLoadingList(false);
      }
    })();

    return () => ac.abort();
  }, []);

  const clearImage = () => {
    setImagePreview('');
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // opcional: valida tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo inválido. Envie uma imagem.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setFormData((prev) => ({ ...prev, imageUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoadingList) {
      toast.error('Aguarde carregar sua lista...');
      return;
    }

    if (!giftListId) {
      toast.error('Lista não encontrada');
      return;
    }

    if (!formData.name.trim() || !formData.basePrice) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const basePrice = Number(String(formData.basePrice).replace(',', '.'));
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      toast.error('Preço inválido');
      return;
    }

    const totalQuantity = parseInt(formData.totalQuantity, 10);
    if (!Number.isFinite(totalQuantity) || totalQuantity < 1) {
      toast.error('Quantidade inválida');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftListId,
          name: formData.name.trim(),
          description: formData.description?.trim() ? formData.description.trim() : undefined,
          imageUrl: formData.imageUrl || undefined,
          basePrice,
          totalQuantity,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao cadastrar presente');
      }

      toast.success('Presente cadastrado com sucesso!');
      router.push('/dashboard/presentes');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao cadastrar presente');
    } finally {
      setIsLoading(false);
    }
  };

  const disabled = isLoading || isLoadingList;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/dashboard/presentes">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-3xl text-terracota-700">
            Novo Presente
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload de imagem */}
            <div className="space-y-2">
              <Label>Foto do presente</Label>

              <div className="flex items-start gap-4">
                <div className="relative w-32 h-32 bg-gradient-to-br from-terracota-100 to-gold-100 rounded-lg overflow-hidden flex-shrink-0">
                  {imagePreview ? (
                    <>
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        aria-label="Remover imagem"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-4xl">
                      🎁
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={disabled}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos aceitos: JPG, PNG, GIF. Máximo 5MB.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (Por enquanto a imagem está sendo salva como base64. Depois vamos trocar para upload no storage.)
                  </p>
                </div>
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome do presente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ex: Jogo de panelas"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                disabled={disabled}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o presente..."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                disabled={disabled}
                rows={3}
              />
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <Label htmlFor="basePrice">
                Valor (R$) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={formData.basePrice}
                onChange={(e) => setFormData((prev) => ({ ...prev, basePrice: e.target.value }))}
                required
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Este é o valor do presente (a taxa de 7,99% será tratada no checkout).
              </p>
            </div>

            {/* Quantidade */}
            <div className="space-y-2">
              <Label htmlFor="totalQuantity">
                Quantidade disponível <span className="text-red-500">*</span>
              </Label>
              <Input
                id="totalQuantity"
                type="number"
                min="1"
                placeholder="1"
                value={formData.totalQuantity}
                onChange={(e) => setFormData((prev) => ({ ...prev, totalQuantity: e.target.value }))}
                required
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Quantas vezes este presente pode ser comprado
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={disabled}
                className="flex-1"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={disabled}
                className="flex-1 bg-terracota-500 hover:bg-terracota-600"
              >
                {isLoading ? 'Salvando...' : isLoadingList ? 'Carregando lista...' : 'Cadastrar presente'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
