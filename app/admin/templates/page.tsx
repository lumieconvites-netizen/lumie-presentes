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

type ClientGiftList = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  user: { email: string; name: string | null };
  _count: { gifts: number; orders: number; messages: number };
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
  const [clientListQuery, setClientListQuery] = useState('');
  const [clientLists, setClientLists] = useState<ClientGiftList[]>([]);
  const [selectedClientList, setSelectedClientList] = useState<ClientGiftList | null>(null);
  const [copyForm, setCopyForm] = useState({ name: '', category: initialCategory === 'all' ? '' : initialCategory });
  const [copyingClientList, setCopyingClientList] = useState(false);

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

  async function loadClientLists() {
    const params = new URLSearchParams();
    if (clientListQuery.trim()) params.set('q', clientListQuery.trim());
    const res = await fetch(`/api/admin/gift-lists?${params.toString()}`, { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Erro ao carregar listas de clientes');
    setClientLists(json.giftLists || []);
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
    if (!window.confirm('Excluir tipo de evento? Só é permitido se não tiver templates.')) return;
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

  function selectClientListForCopy(list: ClientGiftList) {
    setSelectedClientList(list);
    setCopyForm({
      name: `${list.title} - modelo`,
      category: selectedCategory !== 'all' ? selectedCategory : categories[0]?.slug || '',
    });
  }

  async function copyClientSiteAsTemplate() {
    if (!selectedClientList) return;
    if (!copyForm.name.trim()) {
      alert('Informe o nome do novo template.');
      return;
    }
    if (!copyForm.category.trim()) {
      alert('Escolha a categoria do template.');
      return;
    }

    setCopyingClientList(true);
    try {
      const res = await fetch(`/api/admin/gift-lists/${selectedClientList.id}/copy-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: copyForm.name,
          category: copyForm.category,
          isActive: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao criar template a partir do cliente');

      alert('Template criado com sucesso.');
      setSelectedClientList(null);
      await Promise.all([loadCategories(), loadTemplates(copyForm.category)]);
      setSelectedCategory(copyForm.category);
      if (json?.template?.id) router.push(`/admin/templates/editor/${json.template.id}`);
    } finally {
      setCopyingClientList(false);
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
    loadClientLists().catch((error) => alert(error.message));
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
                  <th className="text-left p-2">Ações</th>
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

      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Copiar site de cliente como template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Buscar cliente, lista, slug ou e-mail"
              value={clientListQuery}
              onChange={(e) => setClientListQuery(e.target.value)}
              className="max-w-md"
            />
            <Button variant="outline" onClick={() => loadClientLists().catch((error) => alert(error.message))}>
              Buscar listas
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <div className="max-h-[520px] overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-[#faf3ee]">
                  <tr>
                    <th className="p-2 text-left">Lista</th>
                    <th className="p-2 text-left">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {clientLists.map((list) => (
                    <tr key={list.id} className="border-t">
                      <td className="p-2">
                        <p className="font-medium">{list.title}</p>
                        <p className="text-xs text-gray-500">/{list.slug}</p>
                        <p className="text-xs text-gray-500">{list.user.name || 'Sem nome'} - {list.user.email}</p>
                        <p className="text-xs text-gray-500">{list._count.gifts} presentes</p>
                      </td>
                      <td className="p-2">
                        <Button size="sm" variant="outline" onClick={() => selectClientListForCopy(list)}>
                          Ver preview
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!clientLists.length ? (
                    <tr>
                      <td className="p-3 text-sm text-gray-500" colSpan={2}>
                        Nenhuma lista encontrada.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border bg-[#fffaf6] p-3">
              {selectedClientList ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#8E3D2C]">{selectedClientList.title}</p>
                      <p className="text-xs text-gray-500">/{selectedClientList.slug}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/site/${selectedClientList.slug}`} target="_blank" rel="noreferrer">Abrir em nova aba</a>
                    </Button>
                  </div>

                  <div className="overflow-hidden rounded-lg border bg-white">
                    <iframe
                      src={`/site/${selectedClientList.slug}`}
                      title={`Preview ${selectedClientList.title}`}
                      className="h-[520px] w-full"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Nome do novo template</Label>
                      <Input value={copyForm.name} onChange={(e) => setCopyForm((prev) => ({ ...prev, name: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Categoria</Label>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={copyForm.category}
                        onChange={(e) => setCopyForm((prev) => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="">Escolha uma categoria</option>
                        {categories.map((category) => (
                          <option key={category.slug} value={category.slug}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button onClick={() => copyClientSiteAsTemplate().catch((error) => alert(error.message))} disabled={copyingClientList}>
                    {copyingClientList ? 'Salvando template...' : 'Salvar como template'}
                  </Button>
                </div>
              ) : (
                <div className="flex h-[520px] items-center justify-center rounded-lg border border-dashed bg-white text-sm text-gray-500">
                  Escolha uma lista ao lado para visualizar antes de transformar em template.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
