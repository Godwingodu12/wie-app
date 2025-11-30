export interface WieUser {
    id: string;
    email?: string | null;
    contact_no?: string | null;
    password?: string | null;
    name?: string | null;
    username?: string | null;
    profile_picture?: string | null;
    country_id?: string | null;
    role: string;
    status: string;
    bio?: string | null;
    location: string;
    latitude?: number | null;
    longitude?: number | null;
    isOnline: boolean;
    is_blocked: boolean;
    is_verified: boolean;
    google_id?: string | null;
    auth_provider: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreateUserInput {
    email?: string;
    contact_no?: string;
    password?: string;
    name?: string;
    username?: string;
    profile_picture?: string;
    country_id?: string;
    google_id?: string;
    auth_provider?: string;
}
declare class WieUserModel {
    create(userData: CreateUserInput): Promise<WieUser>;
    findByEmail(email: string): Promise<WieUser | null>;
    findByContactNo(contact_no: string): Promise<WieUser | null>;
    findByUsername(username: string): Promise<WieUser | null>;
    findById(id: string): Promise<WieUser | null>;
    findByGoogleId(google_id: string): Promise<WieUser | null>;
    findByEmailOrContactNo(identifier: string): Promise<WieUser | null>;
    updateVerificationStatus(id: string, is_verified: boolean): Promise<WieUser>;
    updateProfile(id: string, updates: {
        name?: string;
        profile_picture?: string;
        email?: string;
        contact_no?: string;
        username?: string;
        country_id?: string;
        bio?: string;
    }): Promise<WieUser>;
    linkGoogleAccount(id: string, googleData: {
        google_id: string;
        profile_picture?: string;
        auth_provider: string;
    }): Promise<WieUser>;
    getLocation(id: string): Promise<{
        location?: string | null;
        latitude?: number | null;
        longitude?: number | null;
    } | null>;
    updateLocation(id: string, updates: {
        location?: string | null;
        latitude?: number | null;
        longitude?: number | null;
    }): Promise<{
        location?: string | null;
        latitude?: number | null;
        longitude?: number | null;
    }>;
    deleteUser(id: string): Promise<void>;
    updatePassword(id: string, newPassword: string): Promise<WieUser>;
    setPasswordForOAuthUser(id: string, hashedPassword: string): Promise<WieUser>;
    deleteUnverifiedUsers(olderThanMinutes: number): Promise<number>;
    disconnect(): Promise<void>;
}
declare const _default: WieUserModel;
export default _default;
//# sourceMappingURL=wieuser.model.d.ts.map