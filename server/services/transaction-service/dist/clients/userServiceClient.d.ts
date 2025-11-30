export interface User {
    id: string;
    name: string;
    email: string;
    contactNo?: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const getUserById: (userId: string) => Promise<User>;
//# sourceMappingURL=userServiceClient.d.ts.map