import { NextResponse } from 'next/server';
import { getActingUserContext } from '@/lib/acting-user';
import { getGiftModelTemplateBySlug } from '@/lib/gift-model-store';

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const ctx = await getActingUserContext();
  if (!ctx) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }

  const category = await getGiftModelTemplateBySlug(params.slug);
  if (!category || !category.isActive) {
    return NextResponse.json({ error: 'Categoria nao encontrada' }, { status: 404 });
  }

  return NextResponse.json({ category });
}
