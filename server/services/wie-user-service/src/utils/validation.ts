export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateContactNo = (contact_no: string): boolean => {
  const phoneRegex = /^[+]?[0-9]{10,15}$/;
  return phoneRegex.test(contact_no);
};

export const validatePassword = (password: string): boolean => {
  return !!password && password.length >= 6;
};

export const validateName = (name: string): boolean => {
  return !!name && name.trim().length >= 2;
};