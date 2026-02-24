"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BANK_INSTITUTIONS, getBankNameByCode, normalizeBankCode } from "@/lib/bank-institutions";
import { cn } from "@/lib/utils";

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

type BankInstitutionComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function BankInstitutionCombobox({
  value,
  onChange,
  placeholder = "Selecione o banco",
}: BankInstitutionComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedValue = normalizeBankCode(value);
  const selectedName = getBankNameByCode(normalizedValue);

  const filteredBanks = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return BANK_INSTITUTIONS;

    return BANK_INSTITUTIONS.filter((bank) => {
      const searchable = normalizeSearch(`${bank.code} ${bank.name}`);
      return searchable.includes(q);
    });
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          <span className="truncate text-left">
            {selectedName ? `${normalizedValue} - ${selectedName}` : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou código (ex.: Nubank, 260)"
          className="mb-2"
        />
        <div className="max-h-72 overflow-auto rounded-md border">
          {filteredBanks.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Nenhuma instituição encontrada.</p>
          ) : (
            filteredBanks.map((bank) => {
              const selected = bank.code === normalizedValue;
              return (
                <button
                  key={`${bank.code}-${bank.name}`}
                  type="button"
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between gap-2",
                    selected ? "bg-accent/60" : ""
                  )}
                  onClick={() => {
                    onChange(bank.code);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <span className="truncate">{bank.code} - {bank.name}</span>
                  <Check className={cn("h-4 w-4 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

