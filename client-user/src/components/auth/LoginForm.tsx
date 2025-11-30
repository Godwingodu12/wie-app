'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginStart, loginSuccess, loginFailure } from '@/features/auth/authSlice';
import { login } from '@/services/wieUserService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { GoogleAuthButton } from './GoogleAuthButton';
import Link from 'next/link';

export const LoginForm: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Add this useEffect to handle errors from Google callback
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!identifier || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      dispatch(loginStart());
      
      const response = await login({ identifier, password });
      
      if (response.token && response.user) {
        dispatch(loginSuccess({ token: response.token, user: response.user }));
        router.push('/home');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      dispatch(loginFailure());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email or Phone Number"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Enter email or phone number"
          required
        />
        
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
        />
        <div className="flex justify-end">
          <Link 
            href="/forgot-password" 
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Login
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
        Don't have an account?{' '}
        <Link href="/signup" className="text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
};
export default LoginForm;