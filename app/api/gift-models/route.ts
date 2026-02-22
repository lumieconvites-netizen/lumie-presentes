import { NextResponse } from 'next/server';
import { getActingUserContext } from '@/lib/acting-user';
import { listGiftModelTemplates } from '@/lib/gift-model-store';

export async function GET() {
  const ctx = await getActingUserContext();
  if (!ctx) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }

  const categories = await listGiftModelTemplates();
  return NextResponse.json({ categories: categories.filter((category) => category.isActive) });
}
