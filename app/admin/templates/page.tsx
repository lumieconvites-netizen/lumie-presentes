'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const slugify = (v: string) =>
  v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

type AdminTemplate = {
  id: string;
  name: string;
  slug: string;
  category: string;
  isActive: boolean;
};

type CategoryItem = {
  slug: string;
  name: string;
  templatesCount: number;
  activeTemplatesCount: number;
};

export default function AdminTemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '' });

  const filteredTemplates = useMemo(() => {
    const term = q.trim().toLowerCase();
    return templates.filter((template) => {
      if (!term) return true;
      return (
        template.name.toLowerCase().includes(term) ||
        template.slug.toLowerCase().includes(term) ||
        template.category.toLowerCase().includes(term)
      );
    });
  }, [q, templates]);

  async function loadCategories() {
    const res = await fetch('/api/admin/template-categories', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Erro ao carregar categorias');
    setCategories(json.categories || []);
  }

  async function loadTemplates(category?: string) {
    const categorySlug = category || selectedCategory;
    const query = categorySlug !== 'all' ? `?category=${encodeURIComponent(categorySlug)}` : '';
    const res = await fetch(`/api/admin/templates${query}`, { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Erro ao carregar templates');
    setTemplates(json.templates || []);
  }

  async function createCategory() {
    if (!categoryForm.name.trim()) {
      alert('Informe o nome do tipo de evento.');
      return;
    }

    const res = await fetch('/api/admin/template-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: categoryForm.name,
        slug: categoryForm.slug || slugify(categoryForm.name),
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Erro ao criar tipo de evento');

    setCategoryForm({ name: '', slug: '' });
    const nextCategory = json.slug || 'all';
    await loadCategories();
    setSelectedCategory(nextCategory);
    await loadTemplates(nextCategory);
  }

  async function deleteCategory(slug: string) {
    if (!window.confirm('Excluir tipo de evento? So e permitido se nao tiver templates.')) return;
    const res = await fetch(`/api/admin/template-categories/${slug}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Erro ao excluir categoria');

    await loadCategories();
    setSelectedCategory('all');
    await loadTemplates('all');
  }

  async function patchTemplate(id: string, payload: any) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao atualizar template');
      await loadTemplates();
      await loadCategories();
    } finally {
      setBusyId(null);
    }
  }

  async function removeTemplate(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao excluir template');
      await loadTemplates();
      await loadCategories();
    } finally {
      setBusyId(null);
    }
  }

  async function duplicateTemplate(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/templates/${id}/duplicate`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao duplicar template');
      await Promise.all([loadCategories(), loadTemplates()]);
      if (json?.template?.id) {
        router.push(`/admin/templates/editor/${json.template.id}`);
      }
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([loadCategories(), loadTemplates(initialCategory)]);
      } catch (error: any) {
        if (!cancelled) alert(error?.message || 'Erro ao carregar templates');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadTemplates().catch((error) => alert(error.message));
  }, [selectedCategory]);

  const selectedCategoryName =
    selectedCategory === 'all' ? 'Todos os tipos' : categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory;

  return (
    <div className="space-y-6">
      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Tipos de evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label>Nome do tipo</Label>
              <Input placeholder="Ex: 15 anos" value={categoryForm.name} onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Slug (opcional)</Label>
              <Input placeholder="Ex: 15-anos" value={categoryForm.slug} onChange={(e) => setCategoryForm((prev) => ({ ...prev, slug: e.target.value }))} />
            </div>
            <div className="flex items-end">
              <Button onClick={() => createCategory().catch((error) => alert(error.message))}>Criar tipo de evento</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-xl border px-4 py-3 text-left ${selectedCategory === 'all' ? 'bg-[#fff4ea] border-[#d9b9a4]' : 'bg-white border-[#ead9cd]'}`}
            >
              <p className="font-medium">Todos</p>
              <p className="text-xs text-gray-500">{categories.reduce((acc, c) => acc + c.templatesCount, 0)} templates</p>
            </button>

            {categories.map((category) => (
              <div
                key={category.slug}
                className={`rounded-xl border px-4 py-3 ${selectedCategory === category.slug ? 'bg-[#fff4ea] border-[#d9b9a4]' : 'bg-white border-[#ead9cd]'}`}
              >
                <button type="button" className="text-left w-full" onClick={() => setSelectedCategory(category.slug)}>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-xs text-gray-500">{category.templatesCount} templates ({category.activeTemplatesCount} publicados)</p>
                </button>
                <div className="mt-2 flex gap-1">
                  <Button size="sm" asChild>
                    <Link href={`/admin/templates/editor/new?category=${encodeURIComponent(category.slug)}`}>Criar template</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteCategory(category.slug).catch((error) => alert(error.message))}
                  >
                    Excluir tipo
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Templates - {selectedCategoryName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Buscar por nome, slug ou categoria"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-md"
            />
            <Button asChild>
              <Link href={`/admin/templates/editor/new${selectedCategory !== 'all' ? `?category=${encodeURIComponent(selectedCategory)}` : ''}`}>
                Criar template
              </Link>
            </Button>
          </div>

          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-[#faf3ee]">
                <tr>
                  <th className="text-left p-2">Template</th>
                  <th className="text-left p-2">Categoria</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map((template) => (
                  <tr key={template.id} className="border-t">
                    <td className="p-2">
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-gray-500">/{template.slug}</p>
                    </td>
                    <td className="p-2">{template.category}</td>
                    <td className="p-2">{template.isActive ? 'Publicado' : 'Rascunho'}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/templates/editor/${template.id}`}>Editar</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === template.id}
                          onClick={() => patchTemplate(template.id, { isActive: !template.isActive }).catch((error) => alert(error.message))}
                        >
                          {template.isActive ? 'Despublicar' : 'Publicar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === template.id}
                          onClick={() => duplicateTemplate(template.id).catch((error) => alert(error.message))}
                        >
                          Duplicar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          disabled={busyId === template.id}
                          onClick={() => {
                            if (window.confirm('Excluir template?')) {
                              removeTemplate(template.id).catch((error) => alert(error.message));
                            }
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTemplates.length === 0 ? (
                  <tr>
                    <td className="p-3 text-sm text-gray-500" colSpan={4}>
                      Nenhum template encontrado para esse tipo de evento.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
