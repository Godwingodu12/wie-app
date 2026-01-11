"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { forgotPassword } from "@/services/wieUserService";
import { NavBar } from "@/components/auth/NavBar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TopAlert } from "@/components/ui/TopAlert";

import BackIcon from "@/assets/forgot-password/BackIcon.svg";
import ForgotIcon from "@/assets/forgot-password/ForgotIcon.svg";

const ForgotPassword = () => {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔔 Top alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"error" | "success">("error");

  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) {
      setAlertMessage("Fill The Input Box.");
      setAlertType("error");
      setShowAlert(true);
      return;
    }

    setLoading(true);
    setShowAlert(false);

    try {
      const isEmail = inputValue.includes("@");
      const payload = isEmail
        ? { email: inputValue.trim() }
        : { contact_no: inputValue.trim() };

      const response = await forgotPassword(payload);

      if (response.success && response.data?.userId) {
        router.push(
          `/forgot-password/verify?userId=${response.data.userId}&identifier=${encodeURIComponent(
            inputValue
          )}`
        );
      } else {
        setAlertMessage(response.message || "Failed to send OTP.");
        setAlertType("error");
        setShowAlert(true);
      }
    } catch (err: any) {
      setAlertMessage(
        err.response?.data?.message ||
          "Something went wrong. Please try again."
      );
      setAlertType("error");
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white flex flex-col">
      {/* NAVBAR */}
      <NavBar />

      {/* TOP ALERT */}
      <TopAlert
        visible={showAlert}
        message={alertMessage}
        type={alertType}
        onClose={() => setShowAlert(false)}
      />

      {/* BACK BUTTON (all screens) */}
      <div className="hidden md:flex px-6 mt-4">
        <button
          onClick={() => router.push("/login")}
          className="w-10 h-10 rounded-full bg-[#1C2024B2]
                     flex items-center justify-center
                     hover:bg-[#2A2F35] transition"
        >
          <Image src={BackIcon} alt="Back" className="w-5 h-5" />
        </button>
      </div>

      {/* MAIN CONTENT */}
<div className="flex-1 flex items-center justify-center px-4 -mt-12 sm:-mt-8 md:-mt-4">
        <div className="w-full max-w-md flex flex-col items-center">

          {/* ICON */}
          <div className="w-16 h-16 sm:w-20 sm:h-20
                          bg-[#2F2F2F] rounded-2xl sm:rounded-3xl
                          flex items-center justify-center
                          mb-5 sm:mb-6">
            <Image src={ForgotIcon} alt="Forgot Password" />
          </div>

          {/* HEADING */}
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-center">
            Forgot Password
          </h1>

          {/* DESCRIPTION */}
          <p className="text-center text-sm sm:text-base text-gray-400
                        mb-6 sm:mb-8 leading-relaxed px-2">
            <span className="block">
              Please enter your registered email or phone number.
            </span>
            <span className="block">
              A verification code will be sent to verify your account.
            </span>
          </p>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col gap-4 sm:gap-5"
          >
            <Input
              placeholder="Email or phone number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full h-[52px] sm:h-[56px]
                         rounded-full text-white
                         bg-gradient-to-b
                         from-[#B3B8E2] via-[#8860D9] to-[#9575CD]"
            >
              Send OTP
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
