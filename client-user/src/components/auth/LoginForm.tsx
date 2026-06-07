"use client";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "@/features/auth/authSlice";
import { login } from "@/services/wieUserService";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import Link from "next/link";
import Image from "next/image";
import EyeIcon from "@/assets/Auth/Eye.svg";

export const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.identifier || !formData.password) {
      setError("Please fill in all fields");
      setAlertVisible(true);
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
        router.push("/home");
      } else {
        throw new Error();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg === "Invalid credentials" ? "Invalid email or password" : msg);
      setAlertVisible(true);
      dispatch(loginFailure());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <Input
          type="text"
          name="identifier"
          value={formData.identifier}
          onChange={handleChange}
           placeholder="Email or username"
          required
        />

        {/* Password */}
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            className="pr-14"
          />

          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-5 top-1/2 -translate-y-1/2 z-20 opacity-70 hover:opacity-100 transition"
          >
            <Image
              src={EyeIcon}
              alt={showPassword ? "Hide password" : "Show password"}
              width={20}
              height={20}
            />
          </button>
        </div>

        {/* Forgot password */}
        <div className="text-center text-sm text-white/60">
          Forgot password?{" "}
          <Link
            href="/forgot-password"
            className="text-[#8a63d7] hover:underline"
          >
            Reset password
          </Link>
        </div>

        {/* Error */}
        <Alert
          message={error}
          visible={alertVisible}
          onClose={() => setAlertVisible(false)}
          type="error"
        />

        {/* Login button */}
        <Button
          type="submit"
          loading={loading}
          className="w-full h-[56px] rounded-full text-white bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] hover:brightness-110 active:scale-[0.98] transition-all duration-300 shadow-[0_0_20px_rgba(136,96,217,0.3)] hover:shadow-[0_0_30px_rgba(136,96,217,0.5)] font-semibold text-lg"
        >
          Login
        </Button>

        {/* Footer */}
        <p className="text-center text-sm text-white/60">
          New here?{" "}
          <Link href="/signup" className="text-[#8a63d7] hover:text-[#B3B8E2] transition-colors font-medium">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
