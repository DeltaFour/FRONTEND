export const validateEmail = (email: string): boolean => {
  const trimmed = email.trim();
  if (!trimmed) return false;

  // Robust standard email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (trimmed.includes("@.")) return false;
  return emailRegex.test(trimmed);
};

export interface PasswordCriteria {
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  noSpaces: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  criteria: PasswordCriteria;
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const criteria: PasswordCriteria = {
    hasMinLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9\s]/.test(password),
    noSpaces: !/\s/.test(password) && password.length > 0,
  };

  const isValid =
    criteria.hasMinLength &&
    criteria.hasUpper &&
    criteria.hasLower &&
    criteria.hasNumber &&
    criteria.hasSpecial &&
    criteria.noSpaces;

  return { isValid, criteria };
};
