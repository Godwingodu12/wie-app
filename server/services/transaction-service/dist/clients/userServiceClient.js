import { sendRPC } from '../rabbit/producer';
export const getUserById = async (userId) => {
    try {
        console.log('📤 Requesting WIE user from wie-user-service:', userId);
        const response = await sendRPC('get-wie-user', { userId }, 10000);
        if (!response || response.error) {
            throw new Error(response.error || 'User not found');
        }
        return response;
    }
    catch (error) {
        console.error('❌ Error fetching WIE user:', error.message);
        throw new Error(`Failed to fetch user: ${error.message}`);
    }
};
//# sourceMappingURL=userServiceClient.js.map