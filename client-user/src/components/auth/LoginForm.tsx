'use client';

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { loginStart, loginSuccess, loginFailure } from '@/features/auth/authSlice';
import { login } from '@/services/wieUserService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import EyeIcon from '@/assets/Auth/Eye.svg';

export const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.identifier || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      dispatch(loginStart());

      const payload = {
        identifier: formData.identifier.trim(),
        password: formData.password,
      };

      const response = await login(payload);

      if (response.token && response.user) {
        dispatch(loginSuccess({ token: response.token, user: response.user }));
        router.push('/home');
      } else {
        throw new Error();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      dispatch(loginFailure());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Email / Phone */}
        <Input
          type="text"
          name="identifier"
          value={formData.identifier}
          onChange={handleChange}
          placeholder="Email or phone number"
          required
        />

        {/* Password */}
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
            className="absolute right-5 top-1/2 -translate-y-1/2 z-20 opacity-70 hover:opacity-100 transition"
          >
            <Image
              src={EyeIcon}
              alt={showPassword ? 'Hide password' : 'Show password'}
              width={20}
              height={20}
            />
          </button>
        </div>

        {/* Forgot password */}
        <div className="text-center text-sm text-white/60">
          Forgot password?{' '}
          <Link href="/forgot-password" className="text-[#8a63d7] hover:underline">
            Reset password
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Login button */}
        <Button
          type="submit"
          loading={loading}
          className="w-full h-[56px] rounded-full text-white bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD]"
        >
          Login
        </Button>

        {/* Footer */}
        <p className="text-center text-sm text-white/60">
          New here?{' '}
          <Link href="/signup" className="text-[#8a63d7] hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
