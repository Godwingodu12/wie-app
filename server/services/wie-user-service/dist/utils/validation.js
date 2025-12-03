export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
export const validateContactNo = (contact_no) => {
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    return phoneRegex.test(contact_no);
};
export const validatePassword = (password) => {
    return !!password && password.length >= 6;
};
export const validateName = (name) => {
    return !!name && name.trim().length >= 2;
};
//# sourceMappingURL=validation.js.map