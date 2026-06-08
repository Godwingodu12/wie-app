// D:\projectnew\server\services\transaction-service\src\types\userTypes.ts
/**
 * User interface matching the WieUser proto definition
 * This is shared across the transaction service
 */
export interface User {
  id: string;
  name: string;
  email: string;
  contactNo?: string;
  contact_no?: string;
  role: string;
  username?: string;
  profile_picture?: string;
  country_id?: string;
  status?: string;
  bio?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  isOnline?: boolean;
  is_blocked?: boolean;
  is_verified?: boolean;
  google_id?: string;
  auth_provider?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}
export interface BookingUserInfo {
  id: string;
  name: string;
  email: string;
  contactNo?: string;
}