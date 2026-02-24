'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

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
  const dropdownRef = useRef<HTMLDetailsElement | null>(null);
  const [open, setOpen] = useState(false);

  const activeLabel = useMemo(
    () => OPTIONS.find((option) => option.value === activeFilter)?.label ?? 'Todos',
    [activeFilter]
  );

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <div className="mb-6 flex items-center gap-2">
      <span className="text-sm text-gray-600">Filtrar:</span>
      <details ref={dropdownRef} className="relative" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary
          className="list-none cursor-pointer px-3 py-1.5 rounded-full text-sm border border-transparent text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {activeLabel}
        </summary>
        {open ? (
          <div className="absolute left-0 mt-2 z-20 w-64 rounded-xl border border-gray-200 bg-white shadow-lg p-2">
            {OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={option.value === 'all' ? '?' : `?f=${option.value}`}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {option.label}
              </Link>
            ))}
          </div>
        ) : null}
      </details>
    </div>
  );
}
