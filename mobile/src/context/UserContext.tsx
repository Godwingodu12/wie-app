import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { wieUserService } from '../services/wieUserService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { FOLLOW_UPDATE_EVENT } from '@/hooks/useFollowSync';

export interface UserData {
  id: string;
  name: string;
  username: string;
  email?: string;
  contact_no?: string;
  bio: string;
  website?: string;
  gender?: string;
  dob?: string;
  profile_picture: string | null;
  country_id?: string;
  country_name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  is_verified?: boolean;
  auth_provider?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
}

interface UserContextType {
  user: UserData;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateUser: (newData: Partial<UserData> | FormData) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const DEFAULT_USER: UserData = {
  id: '',
  name: 'User',
  username: 'username',
  bio: '',
  profile_picture: null,
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData>(DEFAULT_USER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const userData = await wieUserService.getProfile();
      if (userData) {
        setUser(userData);
      }
    } catch (err: any) {
      console.error('Fetch profile error:', err);
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (newData: Partial<UserData> | FormData) => {
    try {
      setError(null);
      let updatedUser;
      if (newData instanceof FormData) {
        updatedUser = await wieUserService.updateProfile(newData);
      } else {
        const formData = new FormData();
        Object.keys(newData).forEach(key => {
          const value = (newData as any)[key];
          if (value !== undefined) {
            if (key === 'profile_picture' && value && typeof value === 'object' && value.uri) {
              formData.append(key, {
                uri: value.uri,
                name: value.name || 'image.jpg',
                type: value.type || 'image/jpeg',
              } as any);
            } else if (value !== null) {
              formData.append(key, value);
            }
          }
        });
        updatedUser = await wieUserService.updateProfile(formData);
      }
      
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  };

  useEffect(() => {
    fetchProfile();

    const subscription = DeviceEventEmitter.addListener(FOLLOW_UPDATE_EVENT, (data) => {
      if (data.action === 'follow') {
        setUser(prev => ({
          ...prev,
          following_count: (prev.following_count || 0) + 1
        }));
      } else if (data.action === 'unfollow') {
        setUser(prev => ({
          ...prev,
          following_count: Math.max(0, (prev.following_count || 0) - 1)
        }));
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, error, fetchProfile, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
