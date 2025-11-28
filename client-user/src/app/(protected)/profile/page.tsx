'use client';

import { useState, useEffect, Suspense } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { updateUser, logoutSuccess } from '@/features/auth/authSlice';
import { getProfile, updateProfile, getCountries } from '@/services/wieUserService';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Country } from '@/types';
import SideBar from '@/components/home/SideBar';
import DummyAvatar from '@/assets/Home/dummypost.png';
import { Alert } from "@/components/events/Alert";
function ProfileContent() {
  const { user, loading: authLoading } = useAuth(true);
  const searchParams = useSearchParams();
  const passwordSet = searchParams.get("password-set");
  const dispatch = useDispatch();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    country_id: '',
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState<{ name: string; avatar: string }>({
    name: 'User',
    avatar: typeof DummyAvatar === 'string' ? DummyAvatar : DummyAvatar.src,
  });
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  useEffect(() => {
    const initPage = async () => {
      try {
        await loadCountries();
        await fetchUserProfile();
      } catch (err) {
        console.error('Failed to initialize page:', err);
      } finally {
        setPageLoading(false);
      }
    };
    
    initPage();
  }, []);
  const fetchUserProfile = async () => {
    try {
      const profile = await getProfile();
      setCurrentProfile(profile);
      
      // Update form data with fetched profile
      setFormData({
        name: profile?.name || '',
        username: profile?.username || '',
        bio: profile?.bio || '',
        country_id: profile?.country_id || '',
      });
      
      // Update sidebar data
      const userName = profile?.name || profile?.username || 'User';
      const userAvatar = profile?.profile_picture || (typeof DummyAvatar === 'string' ? DummyAvatar : DummyAvatar.src);
      setProfileData({ name: userName, avatar: userAvatar });
      
      // Also update Redux state with fresh data from server
      dispatch(updateUser(profile));
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const loadCountries = async () => {
    try {
      const data = await getCountries();
      setCountries(data);
    } catch (err) {
      console.error('Failed to load countries:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear messages on change
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      
      // Only send fields that have values
      const updateData: any = {};
      if (formData.name?.trim()) updateData.name = formData.name.trim();
      if (formData.username?.trim()) updateData.username = formData.username.trim();
      if (formData.bio?.trim()) updateData.bio = formData.bio.trim();
      if (formData.country_id) updateData.country_id = formData.country_id;

      const updatedUser = await updateProfile(updateData);
      
      // Update Redux state (this also updates localStorage and cookie)
      dispatch(updateUser(updatedUser));
      
      // Update local state
      setCurrentProfile(updatedUser);
      setProfileData({
        name: updatedUser.name || updatedUser.username || 'User',
        avatar: updatedUser.profile_picture || profileData.avatar,
      });
      
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutSuccess());
    router.push('/login');
  };

  // Get selected country name
  const getSelectedCountryName = () => {
    const country = countries.find(c => c.id === formData.country_id);
    return country?.country_name || 'Not selected';
  };

  if (authLoading || pageLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0a0a0a]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const displayUser = currentProfile || user;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <SideBar userName={profileData.name} userAvatar={profileData.avatar} />
      
      <main className="ml-0 md:ml-20 lg:ml-[281px] pb-20 md:pb-0 transition-all duration-300">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Header
            title="Your Profile"
            subtitle="Manage your account settings"
          />
          {passwordSet === "1" && (
            <Alert
              alert={{
                message: "Password set successfully!",
                type: "success",
                show: true,
              }}
              onClose={() => router.replace('/profile')} 
            />
          )}
          <Card className="bg-[#1a1a1a] border border-[#2D2F39]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-4 mb-6">
                {displayUser?.profile_picture ? (
                  <img
                    src={displayUser.profile_picture}
                    alt={displayUser.name || 'Profile'}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {displayUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {displayUser?.name || displayUser?.username || 'User'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {displayUser?.email || displayUser?.contact_no}
                  </p>
                  <p className="text-xs text-gray-500">
                    Auth: {displayUser?.auth_provider === 'google' ? 'Google' : 'Local'}
                  </p>
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2D2F39] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8860D9] focus:border-transparent"
                />
              </div>

              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2D2F39] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8860D9] focus:border-transparent"
                />
              </div>

              {/* Bio Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself"
                  rows={4}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2D2F39] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8860D9] focus:border-transparent resize-none"
                />
              </div>

              {/* Country Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Country
                </label>
                <select
                  name="country_id"
                  value={formData.country_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2D2F39] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8860D9] focus:border-transparent"
                >
                  <option value="">Select a country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.country_name}
                    </option>
                  ))}
                </select>
                {formData.country_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {getSelectedCountryName()}
                  </p>
                )}
              </div>

              {/* Success Message */}
              {success && (
                <div className="text-green-400 text-sm bg-green-900/20 border border-green-800 p-3 rounded flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {success}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 p-3 rounded flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {/* Set Password Button - Only visible for Google users */}
                {displayUser?.auth_provider === 'google' && (
                  <Button
                    type="button"
                    onClick={() => router.push('/profile/set-password')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Set Password
                  </Button>
                )}
                <Button 
                  type="submit" 
                  loading={loading} 
                  className="flex-1 bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] hover:opacity-90"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>      
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  Logout
                </Button>
              </div>

            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-[#0a0a0a]">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
