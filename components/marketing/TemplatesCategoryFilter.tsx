'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type Category = {
  slug: string;
  name: string;
  count: number;
};

type Props = {
  categories: Category[];
  selectedCategory: string;
  totalCount: number;
};

export default function TemplatesCategoryFilter({ categories, selectedCategory, totalCount }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const goToCategory = (slug: string) => {
    setOpen(false);
    const normalized = slug.trim();
    if (!normalized) {
      if (!selectedCategory) return;
      router.push(pathname);
      return;
    }
    if (selectedCategory === normalized) return;
    router.push(`${pathname}?categoria=${encodeURIComponent(normalized)}`);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-10 items-center rounded-md border border-[#d7b7a3] px-4 text-sm text-[#8E3D2C] hover:bg-[#fff7f1]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Tipos de evento
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 z-20 w-72 max-h-72 overflow-auto rounded-xl border border-[#ead9cd] bg-white shadow-lg p-2">
          <button
            type="button"
            onClick={() => goToCategory('')}
            className={`block w-full text-left rounded-md px-3 py-2 text-sm ${!selectedCategory ? 'bg-[#fff0e7] text-[#8E3D2C] font-medium' : 'text-gray-700 hover:bg-[#f8f4f0]'}`}
          >
            Todos ({totalCount})
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => goToCategory(category.slug)}
              className={`block w-full text-left rounded-md px-3 py-2 text-sm ${
                selectedCategory === category.slug
                  ? 'bg-[#fff0e7] text-[#8E3D2C] font-medium'
                  : 'text-gray-700 hover:bg-[#f8f4f0]'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
