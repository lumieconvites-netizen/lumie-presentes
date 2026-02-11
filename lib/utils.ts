import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

export function calculateFee(baseAmount: number, feePercentage: number = 7.99): number {
  return (baseAmount * feePercentage) / 100;
}

export function calculateTotal(baseAmount: number, feeMode: 'PASS_TO_GUEST' | 'ABSORB', feePercentage: number = 7.99): {
  baseAmount: number;
  feeAmount: number;
  totalAmount: number;
  recipientAmount: number;
} {
  const feeAmount = calculateFee(baseAmount, feePercentage);
  
  if (feeMode === 'PASS_TO_GUEST') {
    return {
      baseAmount,
      feeAmount,
      totalAmount: baseAmount + feeAmount,
      recipientAmount: baseAmount,
    };
  } else {
    return {
      baseAmount,
      feeAmount,
      totalAmount: baseAmount,
      recipientAmount: baseAmount - feeAmount,
    };
  }
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}
