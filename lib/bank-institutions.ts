export type BankInstitution = {
  code: string;
  name: string;
};

const BANKS_RAW: Array<[string, string]> = [
  ["001", "Banco do Brasil"],
  ["003", "Banco da Amazonia"],
  ["004", "Banco do Nordeste do Brasil"],
  ["021", "Banestes"],
  ["033", "Santander"],
  ["041", "Banrisul"],
  ["070", "BRB"],
  ["077", "Banco Inter"],
  ["085", "Ailos"],
  ["104", "Caixa Economica Federal"],
  ["107", "Banco Bocom BBM"],
  ["121", "Agibank"],
  ["136", "Unicred"],
  ["237", "Bradesco"],
  ["260", "Nubank"],
  ["290", "PagBank"],
  ["318", "Banco BMG"],
  ["323", "Mercado Pago"],
  ["336", "C6 Bank"],
  ["341", "Itau Unibanco"],
  ["380", "PicPay Bank"],
  ["389", "Banco Mercantil do Brasil"],
  ["422", "Banco Safra"],
  ["655", "Banco Votorantim"],
  ["735", "Neon"],
  ["748", "Sicredi"],
  ["756", "Sicoob"],
];

export const BANK_INSTITUTIONS: BankInstitution[] = BANKS_RAW.map(([code, name]) => ({
  code,
  name,
}));

const BANK_CODES = new Set(BANK_INSTITUTIONS.map((bank) => bank.code));

export function normalizeBankCode(value?: string | null): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.padStart(3, "0").slice(-3);
}

export function isSupportedBankCode(value?: string | null): boolean {
  const code = normalizeBankCode(value);
  return Boolean(code) && BANK_CODES.has(code);
}

export function getBankNameByCode(value?: string | null): string | null {
  const code = normalizeBankCode(value);
  if (!code) return null;
  const bank = BANK_INSTITUTIONS.find((item) => item.code === code);
  return bank?.name ?? null;
}

