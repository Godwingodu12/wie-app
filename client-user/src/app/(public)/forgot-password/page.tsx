"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { forgotPassword } from "@/services/wieUserService";
import WieLogo from "@/assets/forgot-password/WieLogo.svg";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";

const ForgotPassword = () => {
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setLoading(true);
    setError(null);
    try {
      // Determine if input is email or phone number
      const isEmail = inputValue.includes("@");
      const payload = isEmail
        ? { email: inputValue }
        : { contact_no: inputValue };

      const response = await forgotPassword(payload);

      if (response.success && response.data?.userId) {
        // Navigate to verification page
        router.push(
          `/forgot-password/verify?userId=${response.data.userId}&identifier=${encodeURIComponent(inputValue)}`,
        );
      } else {
        setError(response.message || "Failed to send OTP. Please try again.");
      }
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0c10] flex items-center justify-center p-4 font-sans text-white">
      <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-32 w-full max-w-6xl">
        {/* Left Section: Logo & Title */}
        <div className="flex flex-col items-center">
          {/* Logo Container */}
          <div className="w-32 h-32 mb-6 flex items-center justify-center">
            <Image
              src={WieLogo}
              alt="Community Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Forgot Password
          </h1>
        </div>

        {/* Right Section: Form */}
        <div className="w-full max-w-md flex flex-col justify-center">
          <button
            onClick={() => router.push("/login")}
            className="flex items-center gap-2 self-start md:self-start mb-6 px-4 py-2 rounded-full text-[#8860D9] text-sm font-medium transition-all hover:opacity-90"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Log in
          </button>

          <p className="text-gray-400 text-base leading-relaxed mb-8 text-center md:text-left">
            Please enter your registered email or phone number. a verification
            code will be sent to verify your account
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="relative">
              <input
                type="text"
                placeholder="Email or phone number"
                className="w-full bg-[#16171b] text-white placeholder-gray-500 rounded-full py-4 px-6 outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full font-semibold text-white transition-transform active:scale-95 hover:opacity-90 shadow-[0_4px_20px_rgba(124,98,216,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)",
              }}
            >
              {loading ? "Sending..." : "Register"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
