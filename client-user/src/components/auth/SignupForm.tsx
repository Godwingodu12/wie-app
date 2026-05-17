'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signupSendOtp, getCountries } from '@/services/wieUserService';
import { SignupSendOtpRequest } from '@/types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import Image from 'next/image';
import Link from 'next/link';
import { Country } from '@/types';
import CountrySelect from '../ui/CountrySelect';
import EyeIcon from '@/assets/Auth/Eye.svg';

const PW_RULES = {
  minLength:  { test: (p: string) => p.length >= 6,           label: "At least 6 characters"      },
  uppercase:  { test: (p: string) => /[A-Z]/.test(p),         label: "One uppercase letter (A–Z)"  },
  lowercase:  { test: (p: string) => /[a-z]/.test(p),         label: "One lowercase letter (a–z)"  },
  number:     { test: (p: string) => /[0-9]/.test(p),         label: "One number (0–9)"            },
  symbol:     { test: (p: string) => /[!@#$%^&*()\-_=+\[\]{};':",.<>/?\\|`~]/.test(p),
                                                               label: "One symbol (!@#$… etc)"     },
} as const;

type RuleKey = keyof typeof PW_RULES;

const validatePassword = (pw: string): string | null => {
  const failing = (Object.keys(PW_RULES) as RuleKey[]).filter(
    (key) => !PW_RULES[key].test(pw),
  );
  if (failing.length === 0) return null;
  return `Password requires: ${PW_RULES[failing[0]].label.toLowerCase()}`;
};

const passwordStrength = (pw: string): number =>
  (Object.keys(PW_RULES) as RuleKey[]).filter((key) => PW_RULES[key].test(pw)).length;

const STRENGTH_COLOR = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
const STRENGTH_LABEL = ["Very weak", "Weak", "Fair", "Good", "Strong"];

export const SignupForm: React.FC = () => {
  const [formData, setFormData] = useState({
    identifier:   '',
    country_code: '',
  });
  const [countries,      setCountries]      = useState<Country[]>([]);
  const [error,          setError]          = useState('');
  const [alertVisible,   setAlertVisible]   = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [showPassword,   setShowPassword]   = useState(false);
  // ✅ Single source of truth for password — no more ref vs state split
  const [pwValue,        setPwValue]        = useState('');
  const [showStrength,   setShowStrength]   = useState(false);

  const router = useRouter();

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const res = await getCountries();
        setCountries(res);
        if (res.length) {
          const def = res.find((c) => c.country_code === 'IN') || res[0];
          setFormData((prev) => ({ ...prev, country_code: def.country_code }));
        }
      } catch {
        setError('Failed to load countries');
        setAlertVisible(true);
      }
    };
    loadCountries();
  }, []);

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const isPhoneNumber = (v: string) =>
    /^[\d\s+\-()]+$/.test(v) && /\d{5,}/.test(v.replace(/\D/g, ''));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ✅ Use pwValue (state) as the single source of truth
    const actualPassword    = pwValue;
    const trimmedIdentifier = formData.identifier.trim();

    if (!trimmedIdentifier) {
      setError('Email or phone is required');
      setAlertVisible(true);
      return;
    }

    if (!formData.country_code) {
      setError('Country is required');
      setAlertVisible(true);
      return;
    }

    if (!actualPassword) {
      setError('Password is required');
      setAlertVisible(true);
      return;
    }

    // ✅ Validate locally first — matches backend rules exactly
    const pwError = validatePassword(actualPassword);
    if (pwError) {
      setError(pwError);
      setAlertVisible(true);
      return;
    }

    try {
      setLoading(true);

      const selectedCountry = countries.find(
        (c) => c.country_code === formData.country_code,
      );

      let signupPayload: SignupSendOtpRequest;
      if (isEmail(trimmedIdentifier)) {
        signupPayload = {
          email:        trimmedIdentifier,
          password:     actualPassword,
          country_code: formData.country_code,
        };
      } else if (isPhoneNumber(trimmedIdentifier)) {
        const cleanPhone = trimmedIdentifier.replace(/\D/g, '');
        const phoneCode  = selectedCountry?.phone_code?.replace(/^\+/, '') ?? '';
        signupPayload = {
          contact_no:   `${phoneCode}${cleanPhone}`,
          password:     actualPassword,
          country_code: formData.country_code,
        };
      } else {
        setError('Enter a valid email or phone number');
        setAlertVisible(true);
        return;
      }

      const res = await signupSendOtp(signupPayload);
      if (res?.tempUserId) {
        router.push(
          `/verify-otp?tempUserId=${res.tempUserId}&method=${
            signupPayload.email ? 'email' : 'phone'
          }&identifier=${encodeURIComponent(trimmedIdentifier)}`,
        );
      } else {
        setError('OTP sending failed. Please try again.');
        setAlertVisible(true);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Signup failed. Please try again.',
      );
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const strength      = passwordStrength(pwValue);
  const strengthColor = STRENGTH_COLOR[Math.min(strength, 4)];
  const strengthLabel = pwValue.length > 0 ? STRENGTH_LABEL[Math.min(strength, 4)] : '';

  return (
    <div className="w-full flex flex-col">
      <form onSubmit={handleSubmit} className="space-y-5">

        <div className="flex items-center gap-3 w-full">
          <div className="flex-1">
            <Input
              type="text"
              name="identifier"
              autoComplete="username"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="Enter your email or phone"
              required
            />
          </div>
          <CountrySelect
            countries={countries}
            value={formData.country_code}
            onChange={(code) =>
              setFormData((prev) => ({ ...prev, country_code: code }))
            }
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="relative">
            {/* ✅ Fully controlled — no ref needed, pwValue is the single source */}
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              placeholder="Enter your password"
              required
              value={pwValue}
              onChange={(e) => {
                setPwValue(e.target.value);
                setShowStrength(e.target.value.length > 0);
              }}
              className="w-full h-[56px] rounded-full px-5 pr-14 outline-none text-white placeholder:text-[#6F7680]"
              style={{
                background:   'linear-gradient(270deg,rgba(32,32,32,0.5) 0%,rgba(66,66,66,0.5) 100%)',
                borderRadius: '9999px',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-5 top-1/2 -translate-y-1/2 z-20 opacity-70 hover:opacity-100 transition"
            >
              <Image src={EyeIcon} alt="Toggle password" width={20} height={20} />
            </button>
          </div>

          {showStrength && (
            <div className="px-1 flex flex-col gap-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((seg) => (
                  <div
                    key={seg}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      background: seg <= strength ? strengthColor : 'rgba(255,255,255,0.12)',
                    }}
                  />
                ))}
              </div>
              <span className="text-[11px] font-medium" style={{ color: strengthColor }}>
                {strengthLabel}
              </span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-0.5">
                {(Object.keys(PW_RULES) as RuleKey[]).map((key) => {
                  const passed = PW_RULES[key].test(pwValue);
                  return (
                    <div key={key} className="flex items-center gap-1.5">
                      <span style={{ color: passed ? '#22c55e' : 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                        {passed ? '✓' : '○'}
                      </span>
                      <span
                        className="text-[11px]"
                        style={{ color: passed ? '#22c55e' : 'rgba(255,255,255,0.4)' }}
                      >
                        {PW_RULES[key].label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Alert
          message={error}
          visible={alertVisible}
          onClose={() => setAlertVisible(false)}
          type="error"
        />

        <Button
          type="submit"
          loading={loading}
          className="w-full h-[56px] rounded-full text-white bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] hover:brightness-110 active:scale-[0.98] transition-all duration-300 shadow-[0_0_20px_rgba(136,96,217,0.3)] hover:shadow-[0_0_30px_rgba(136,96,217,0.5)] font-semibold text-lg"
        >
          Register
        </Button>

        <p className="text-center text-sm text-white/60 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-[#8a63d7] hover:text-[#B3B8E2] transition-colors font-medium">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};
export default SignupForm;
