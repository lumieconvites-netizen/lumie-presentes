'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type AdminTemplate = {
  id: string;
  name: string;
  slug: string;
  category: string;
  isActive: boolean;
};

const slugify = (v: string) =>
  v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ name: '', slug: '', category: 'casamento' });

  const filteredTemplates = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(term) ||
        template.slug.toLowerCase().includes(term) ||
        template.category.toLowerCase().includes(term)
    );
  }, [q, templates]);

  async function loadTemplates() {
    const res = await fetch('/api/admin/templates', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Erro ao carregar templates');
    setTemplates(json.templates || []);
  }

  async function createTemplate() {
    const slug = slugify(form.slug || form.name);
    const res = await fetch('/api/admin/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        slug,
        category: form.category,
        description: null,
        thumbnail: null,
        defaultTheme: {
          primary_color: '#C65A3A',
          secondary_color: '#8E3D2C',
          background_color: '#FAF4EF',
          font_title: 'Playfair Display',
          font_body: 'Inter',
        },
        defaultBlocks: [
          {
            id: 'hero-1',
            type: 'hero',
            order: 1,
            enabled: true,
            config: { title: form.name || 'Novo template', subtitle: 'Seu evento especial', backgroundColor: '#8E3D2C' },
          },
        ],
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Erro ao criar template');
    setForm({ name: '', slug: '', category: 'casamento' });
    await loadTemplates();
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
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    loadTemplates().catch((error) => alert(error.message));
  }, []);

  return (
    <div className="space-y-6">
      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Criar template</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input placeholder="Nome do template" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          <Input placeholder="Slug (opcional)" value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} />
          <Input placeholder="Categoria" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} />
          <Button onClick={() => createTemplate().catch((error) => alert(error.message))}>Criar e publicar</Button>
        </CardContent>
      </Card>

      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Buscar por nome, slug ou categoria" value={q} onChange={(e) => setQ(e.target.value)} />
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
                    <td className="p-2">{template.isActive ? 'Ativo' : 'Inativo'}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
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
                      Nenhum template encontrado.
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
