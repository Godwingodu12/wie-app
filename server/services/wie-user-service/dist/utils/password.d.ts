export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (plainPassword: string, hashedPassword: string | null | undefined) => Promise<boolean>;
export declare const isLocalAuthUser: (password: string | null | undefined) => password is string;
//# sourceMappingURL=password.d.ts.map