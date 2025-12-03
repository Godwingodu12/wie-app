import bcrypt from 'bcryptjs';
export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};
export const comparePassword = async (plainPassword, hashedPassword) => {
    // If no hashed password exists (OAuth users), return false
    if (!hashedPassword) {
        return false;
    }
    return bcrypt.compare(plainPassword, hashedPassword);
};
// Type guard to check if user has local authentication
export const isLocalAuthUser = (password) => {
    return typeof password === 'string' && password.length > 0;
};
//# sourceMappingURL=password.js.map