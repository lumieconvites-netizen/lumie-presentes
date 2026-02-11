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
import { ArrowLeft, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewGiftPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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
    fetchGiftList();
  }, []);

  const fetchGiftList = async () => {
    try {
      const res = await fetch('/api/gift-lists/my-list');
      const data = await res.json();
      setGiftListId(data.id);
    } catch (error) {
      toast.error('Erro ao carregar lista');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem deve ter no máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!giftListId) {
      toast.error('Lista não encontrada');
      return;
    }

    if (!formData.name || !formData.basePrice) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const basePrice = parseFloat(formData.basePrice);
    if (isNaN(basePrice) || basePrice <= 0) {
      toast.error('Preço inválido');
      return;
    }

    const totalQuantity = parseInt(formData.totalQuantity);
    if (isNaN(totalQuantity) || totalQuantity < 1) {
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
          name: formData.name,
          description: formData.description || undefined,
          imageUrl: formData.imageUrl || undefined,
          basePrice,
          totalQuantity,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast.success('Presente cadastrado com sucesso!');
      router.push('/dashboard/presentes');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar presente');
    } finally {
      setIsLoading(false);
    }
  };

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
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setFormData({ ...formData, imageUrl: '' });
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isLoading}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos aceitos: JPG, PNG, GIF. Máximo 5MB.
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o presente..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isLoading}
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
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Este é o valor que você receberá por cada unidade presenteada (sem a taxa de 7,99%)
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
                onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
                required
                disabled={isLoading}
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
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-terracota-500 hover:bg-terracota-600"
              >
                {isLoading ? 'Salvando...' : 'Cadastrar presente'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
