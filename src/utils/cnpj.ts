export const maskCnpj = (value: string): string => {
  const upper = value.toUpperCase();
  let clean = "";
  for (let i = 0; i < upper.length; i++) {
    const char = upper[i];
    if (clean.length < 12) {
      if (/[A-Z0-9]/.test(char)) {
        clean += char;
      }
    } else if (clean.length < 14) {
      if (/[0-9]/.test(char)) {
        clean += char;
      }
    }
  }

  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
  if (clean.length <= 12) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
  }
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
};

export const validateCnpj = (cnpj: string): boolean => {
  if (!cnpj) return false;

  const clean = cnpj.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (clean.length !== 14) return false;

  if (!/^\d{2}$/.test(clean.slice(12))) return false;

  if (/^(.)\1{13}$/.test(clean)) return false;

  // Receita Federal alphanumeric CNPJ spec: all chars mapped as charCode - 48
  // This gives 0-9 for digits and 17-42 for A-Z (not the A=10 numeric-only convention)
  const getCharValue = (char: string): number => char.charCodeAt(0) - 48;

  const digits = Array.from(clean).map(getCharValue);

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += digits[i] * weights1[i];
  }
  const rem1 = sum1 % 11;
  const d1 = rem1 < 2 ? 0 : 11 - rem1;

  if (digits[12] !== d1) return false;

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 12; i++) {
    sum2 += digits[i] * weights2[i];
  }
  sum2 += d1 * weights2[12];
  const rem2 = sum2 % 11;
  const d2 = rem2 < 2 ? 0 : 11 - rem2;

  return digits[13] === d2;
};
