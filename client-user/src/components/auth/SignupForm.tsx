'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signupSendOtp, getCountries } from '@/services/wieUserService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { GoogleAuthButton } from './GoogleAuthButton';
import Link from 'next/link';
import { Country } from '@/types';
import { CountrySelect } from '../ui/CountrySelect';
export const SignupForm: React.FC = () => {
  const [formData, setFormData] = useState({
    identifier: '', // This will hold either email or phone
    password: '',
    confirmPassword: '',
    country_id: '',
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const data = await getCountries();
      setCountries(data);
    } catch (err) {
      console.error('Failed to load countries:', err);
      setError('Failed to load countries');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Detect if input is email or phone number
  const isEmail = (input: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  };

  const isPhoneNumber = (input: string): boolean => {
    // Check if it contains only digits, spaces, +, -, (, )
    return /^[\d\s+\-()]+$/.test(input) && /\d{5,}/.test(input.replace(/\D/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.identifier) {
      setError('Email or phone number is required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.country_id) {
      setError('Country is required');
      return;
    }

    try {
      setLoading(true);
      
      const signupData: any = {
        password: formData.password,
        country_id: formData.country_id,
      };

      // Detect if identifier is email or phone
      const trimmedIdentifier = formData.identifier.trim();
      
      if (isEmail(trimmedIdentifier)) {
        signupData.email = trimmedIdentifier;
      } else if (isPhoneNumber(trimmedIdentifier)) {
        signupData.contact_no = trimmedIdentifier;
      } else {
        setError('Please enter a valid email or phone number');
        setLoading(false);
        return;
      }

      const response = await signupSendOtp(signupData);
      
      if (response.tempUserId) {
        // Navigate to OTP verification page
        const method = signupData.email ? 'email' : 'phone';
        router.push(`/verify-otp?tempUserId=${response.tempUserId}&method=${method}&identifier=${encodeURIComponent(trimmedIdentifier)}`);
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Signup failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get country flag emoji
  const getCountryFlag = (countryCode: string): string => {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email or Phone Number"
          type="text"
          name="identifier"
          value={formData.identifier}
          onChange={handleChange}
          placeholder="Enter your email or phone number"
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter password (min 6 characters)"
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          required
        />

        <div className="w-full">
          <CountrySelect
            countries={countries}
            value={formData.country_id}
            onChange={handleChange}
            required
            />
        </div>
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
            {error}
          </div>
        )}
        <Button type="submit" loading={loading} className="w-full">
          Sign Up
        </Button>
      </form>
      <div className="mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-4">
          <GoogleAuthButton />
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
};
export default SignupForm;