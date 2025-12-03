import { OAuth2Client } from 'google-auth-library';
declare const oauth2Client: OAuth2Client;
export interface GoogleUserInfo {
    id: string;
    email: string;
    name: string;
    picture?: string;
    verified_email: boolean;
}
export declare const getGoogleAuthUrl: () => string;
export declare const getGoogleUserInfo: (code: string) => Promise<GoogleUserInfo>;
export default oauth2Client;
//# sourceMappingURL=google-oauth.d.ts.map