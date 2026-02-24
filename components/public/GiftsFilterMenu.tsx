'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type GiftFilter = 'all' | 'available' | 'price_desc' | 'price_asc' | 'name_asc';

type Props = {
  activeFilter: GiftFilter;
  primaryColor: string;
};

const OPTIONS: Array<{ value: GiftFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'available', label: 'Disponíveis' },
  { value: 'price_desc', label: 'Valor: maior para menor' },
  { value: 'price_asc', label: 'Valor: menor para maior' },
  { value: 'name_asc', label: 'Nome: A-Z' },
];

export default function GiftsFilterMenu({ activeFilter, primaryColor }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const activeLabel = useMemo(
    () => OPTIONS.find((option) => option.value === activeFilter)?.label ?? 'Todos',
    [activeFilter]
  );

  const applyFilter = (value: GiftFilter) => {
    const nextUrl = value === 'all' ? pathname : `${pathname}?f=${value}`;
    setOpen(false);
    router.push(nextUrl, { scroll: false });
  };

  return (
    <div className="mb-6 flex items-center gap-2">
      <span className="text-sm text-gray-600">Filtrar:</span>
      <div className="relative">
        <button
          type="button"
          className="px-3 py-1.5 rounded-full text-sm border border-transparent text-white"
          style={{ backgroundColor: primaryColor }}
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          {activeLabel}
        </button>

        {open ? (
          <div className="absolute left-0 mt-2 z-20 w-64 rounded-xl border border-gray-200 bg-white shadow-lg p-2">
            {OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => applyFilter(option.value)}
                className="block w-full text-left rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
