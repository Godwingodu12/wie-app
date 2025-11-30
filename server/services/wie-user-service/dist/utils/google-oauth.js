import { OAuth2Client } from 'google-auth-library';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
    throw new Error('Google OAuth environment variables are not set');
}
const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL);
export const getGoogleAuthUrl = () => {
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
    ];
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    });
};
export const getGoogleUserInfo = async (code) => {
    try {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        // Fetch user info
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokens.access_token}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user info from Google');
        }
        const userInfo = await response.json();
        return userInfo;
    }
    catch (error) {
        throw new Error(`Google OAuth error: ${error.message}`);
    }
};
export default oauth2Client;
//# sourceMappingURL=google-oauth.js.map