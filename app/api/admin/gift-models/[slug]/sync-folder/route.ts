import { NextResponse } from 'next/server';
import { createHash, randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { requireAdminSession } from '@/lib/admin-auth';
import { getGiftModelTemplateBySlug, saveGiftModelItems } from '@/lib/gift-model-store';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

function titleFromFilename(fileName: string) {
  const withoutExt = fileName.replace(/\.[^.]+$/, '');
  const normalized = withoutExt.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return 'Presente';
  return normalized
    .split(' ')
    .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
    .join(' ');
}

function priceFromFileName(fileName: string) {
  const hash = createHash('sha1').update(fileName).digest('hex');
  const numeric = Number.parseInt(hash.slice(0, 8), 16);
  return 50 + (numeric % 351);
}

export async function POST(_request: Request, { params }: { params: { slug: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const category = await getGiftModelTemplateBySlug(params.slug);
  if (!category) {
    return NextResponse.json({ error: 'Categoria nao encontrada' }, { status: 404 });
  }

  const folderPath = path.join(process.cwd(), 'public', 'gift-models', category.slug);
  let entries: string[] = [];
  try {
    entries = await fs.readdir(folderPath);
  } catch {
    return NextResponse.json({ error: `Pasta nao encontrada: ${folderPath}` }, { status: 400 });
  }

  const imageFiles = entries
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  if (imageFiles.length === 0) {
    return NextResponse.json({ error: 'Nenhuma imagem encontrada na pasta da categoria.' }, { status: 400 });
  }

  const nextItems = imageFiles.map((fileName) => ({
    id: randomUUID(),
    name: titleFromFilename(fileName),
    description: '',
    imageUrl: `/gift-models/${category.slug}/${fileName}`,
    basePrice: priceFromFileName(fileName),
    totalQuantity: 1,
  }));

  await saveGiftModelItems(category.id, nextItems);

  return NextResponse.json({ ok: true, importedCount: nextItems.length, folderPath });
}
