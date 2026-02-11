'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import PublicPageView from '@/components/public/PublicPageView';

export default function PreviewPage() {
  const { pageBlocks, gifts, messages, settings } = useUser();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard/editor">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Editor
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <span className="text-sm text-gray-600">
                Modo Preview - Visualização como convidado
              </span>
            </div>
            <Button asChild>
              <Link href="/dashboard/editor">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Public Page View */}
      <PublicPageView 
        blocks={pageBlocks}
        gifts={gifts}
        messages={messages}
        settings={settings}
        theme={settings.theme || {}}
      />
    </div>
  );
}
