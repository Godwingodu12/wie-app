'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signupSendOtp, getCountries } from '@/services/wieUserService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import Image from 'next/image';
import Link from 'next/link';
import { Country } from '@/types';
import CountrySelect from '../ui/CountrySelect';
import EyeIcon from '@/assets/Auth/Eye.svg';
import DownArrow from '@/assets/Auth/DownArrow.svg';

export const SignupForm: React.FC = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    country_code: '',
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  /* -------------------- LOAD COUNTRIES -------------------- */
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const res = await getCountries();
        setCountries(res);
        // Default country (India or first available)
        if (res.length) {
          const defaultCountry = res.find(c => c.country_code === 'IN') || res[0];
          setFormData(prev => ({
            ...prev,
            country_code: defaultCountry.country_code,
          }));
        }
      } catch (err) {
        console.error('Failed to load countries:', err);
        setError('Failed to load countries');
      }
    };

    loadCountries();
  }, []);

  /* -------------------- HELPERS -------------------- */
  const isEmail = (input: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

  const isPhoneNumber = (input: string) =>
    /^[\d\s+\-()]+$/.test(input) && /\d{5,}/.test(input.replace(/\D/g, ''));

  /* -------------------- HANDLERS -------------------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.identifier) {
      setError('Email or phone number is required');
      return;
    }

    if (!formData.country_code) {
      setError('Country is required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);

      const trimmed = formData.identifier.trim();
      const selectedCountry = countries.find(c => c.country_code === formData.country_code);

      const signupData: any = {
        password: formData.password,
        country_code: formData.country_code,
      };

      if (isEmail(trimmed)) {
        signupData.email = trimmed;
      } else if (isPhoneNumber(trimmed)) {
        // Remove any non-digit characters from phone number
        const cleanPhone = trimmed.replace(/\D/g, '');
        
        // Attach country phone code if available
        if (selectedCountry?.phone_code) {
          // Remove leading + from phone code for storage
          const phoneCode = selectedCountry.phone_code.replace(/^\+/, '');
          signupData.contact_no = `${phoneCode}${cleanPhone}`;
        } else {
          signupData.contact_no = cleanPhone;
        }
      } else {
        setError('Invalid email or phone number');
        return;
      }

      const res = await signupSendOtp(signupData);

      if (res?.tempUserId) {
        router.push(
          `/verify-otp?tempUserId=${res.tempUserId}&method=${
            signupData.email ? 'email' : 'phone'
          }&identifier=${encodeURIComponent(trimmed)}`
        );
      } else {
        setError('OTP sending failed');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="w-full flex flex-col">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* EMAIL / PHONE + COUNTRY (pill + round button) */}
<div className="flex items-center gap-3 w-full">

  {/* Pill Input */}
  <div className="flex-1">
    <Input
      type="text"
      name="identifier"
      value={formData.identifier}
      onChange={handleChange}
      placeholder="Email or phone number"
      required
      className="
        h-[56px]
        rounded-full
        px-6
        bg-[#0B0E14]
        border border-[#1f2430]
        text-white
        placeholder:text-gray-400
      "
    />
  </div>
  {/* Country Circle */}
  <CountrySelect
    countries={countries}
    value={formData.country_code}
    onChange={(code) =>
      setFormData(prev => ({ ...prev, country_code: code }))
    }
    required
  />
</div>

        {/* PASSWORD */}
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
            className="pr-14"
          />

          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            className="absolute right-5 top-1/2 -translate-y-1/2"
          >
            <Image src={EyeIcon} alt="Toggle password" width={20} height={20} />
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        <p className="text-center text-sm text-white/60">
          Already have an account?{' '}
          <Link href="/login" className="text-[#8a63d7] hover:underline">
            Login
          </Link>
        </p>

        <Button
          type="submit"
          loading={loading}
          className="w-full h-[56px] rounded-full text-white bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD]"
        >
          Register
        </Button>
      </form>
    </div>
  );
};

export default SignupForm;
