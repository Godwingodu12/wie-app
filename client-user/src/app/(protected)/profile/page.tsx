'use client';

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { updateUser } from '@/features/auth/authSlice';
import { getProfile, updateProfile, getCountries } from '@/services/wieUserService';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Country } from '@/types';

export default function ProfilePage() {
  const { user } = useAuth(true);
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    country_id: '',
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCountries();
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        bio: user.bio || '',
        country_id: user.country_id || '',
      });
    }
  }, [user]);

  const loadCountries = async () => {
    try {
      const data = await getCountries();
      setCountries(data);
    } catch (err) {
      console.error('Failed to load countries:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const updatedUser = await updateProfile(formData);
      dispatch(updateUser(updatedUser));
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header
          title="Your Profile"
          subtitle="Manage your account settings"
        />

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              {user?.profile_picture && (
                <img
                  src={user.profile_picture}
                  alt={user.name || 'Profile'}
                  className="h-20 w-20 rounded-full"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold">{user?.name}</h3>
                <p className="text-sm text-gray-600">{user?.email || user?.contact_no}</p>
                <p className="text-xs text-gray-500">
                  Auth: {user?.auth_provider === 'google' ? 'Google' : 'Local'}
                </p>
              </div>
            </div>

            <Input
              label="Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
            />

            <Input
              label="Username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
            />

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <select
                name="country_id"
                value={formData.country_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.country_name}
                  </option>
                ))}
              </select>
            </div>
            {success && (
              <div className="text-green-600 text-sm bg-green-50 p-3 rounded">
                {success}
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Update Profile
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
export const dynamic = 'force-dynamic';