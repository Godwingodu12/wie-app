export const INVALID_CONTACT_NUMBER_FORMAT_MESSAGE =
  "Invalid contact number format";
export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }
  return null;
};

export const validateContactNo = (
  contact_no: string,
  message?: string,
): string | null => {
  const phoneRegex = /^[+]?[0-9]{10,15}$/;
  if (!phoneRegex.test(contact_no)) {
    return message || "Invalid contact number format";
  }
  return null;
};

export const validatePassword = (password: string): boolean => {
  if (!password || password.length < 6) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);
  return hasUppercase && hasLowercase && hasNumber && hasSymbol;
};

export const getPasswordError = (password: string): string | null => {
  if (!password || password.length < 6)
    return "Password must be at least 6 characters";
  if (!/[A-Z]/.test(password))
    return "Password must include at least one uppercase letter (A–Z)";
  if (!/[a-z]/.test(password))
    return "Password must include at least one lowercase letter (a–z)";
  if (!/[0-9]/.test(password))
    return "Password must include at least one number (0–9)";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password))
    return "Password must include at least one symbol (e.g. @#$!%)";
  return null;
};
export const validateName = (name: string): string | null => {
  if (!name || name.trim().length < 2) {
    return "Name does not meet requirements";
  }
  return null;
};
