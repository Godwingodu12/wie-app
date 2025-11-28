import { sendRPC } from '../rabbit/producer';

export interface User {
  id: string;
  name: string;
  email: string;
  contactNo?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
export const getUserById = async (userId: string): Promise<User> => {
  try {
    console.log('📤 Requesting WIE user from wie-user-service:', userId);
    const response = await sendRPC<User>(
      'get-wie-user',
      { userId },
      10000
    );
  
    if (!response || (response as any).error) {
      throw new Error((response as any).error || 'User not found');
    }
    return response;
  } catch (error: any) {
    console.error('❌ Error fetching WIE user:', error.message);
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
};