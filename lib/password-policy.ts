const COMMON_PASSWORDS = new Set([
  '123456',
  '1234567',
  '12345678',
  '123456789',
  '1234567890',
  'senha123',
  'senha1234',
  'qwerty123',
  'abc123456',
  'password',
  'password1',
  'lumie123',
]);

function normalize(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

function hasSequentialNumbers(password: string) {
  const digits = password.replace(/\D/g, '');
  if (digits.length < 6) return false;
  return '0123456789'.includes(digits) || '9876543210'.includes(digits);
}

export function validatePasswordStrength(password: string, context?: { email?: string | null; name?: string | null }) {
  const errors: string[] = [];
  const normalizedPassword = normalize(password);
  const emailUser = normalize(context?.email).split('@')[0] ?? '';
  const nameParts = normalize(context?.name)
    .split(/\s+/)
    .filter((part) => part.length >= 3);

  if (password.length < 8) errors.push('ter pelo menos 8 caracteres');
  if (!/[a-z]/.test(password)) errors.push('ter uma letra minúscula');
  if (!/[A-Z]/.test(password)) errors.push('ter uma letra maiúscula');
  if (!/\d/.test(password)) errors.push('ter um número');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('ter um símbolo');
  if (COMMON_PASSWORDS.has(normalizedPassword)) errors.push('não ser uma senha comum');
  if (/^(.)\1+$/.test(password)) errors.push('não repetir o mesmo caractere');
  if (hasSequentialNumbers(password)) errors.push('não usar sequência numérica');
  if (emailUser.length >= 4 && normalizedPassword.includes(emailUser)) errors.push('não conter seu email');
  if (nameParts.some((part) => normalizedPassword.includes(part))) errors.push('não conter seu nome');

  return {
    ok: errors.length === 0,
    errors,
    message: errors.length ? `A senha deve ${errors.join(', ')}.` : null,
  };
}
