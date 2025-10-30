import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/authService";

import LockIcon from "../../assets/LockIcon.svg";
import LoginIcon from "../../assets/LoginIcon.svg";
import WieLogo from "../../assets/WieLogo.svg";
import BG1 from "../../assets/BG1.png"; // Forgot password card
import BG2 from "../../assets/BG2.png"; // WIE card

const ForgotPassword = () => {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    // Prevent default if called from form submission
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!inputValue.trim()) {
      setError("Please enter your email or contact number");
      return;
    }

    // Clear previous errors
    setError("");
    setIsLoading(true);

    try {
      // Determine if it's email or contact number
      const isEmail = inputValue.includes('@');
      const payload = isEmail ? { email: inputValue } : { contact_no: inputValue };

      await forgotPassword(payload);
      
      // Encode the input value to handle special characters in email
      const encodedInput = encodeURIComponent(inputValue);
      navigate(`/verify-user/${encodedInput}`);
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Failed to send reset OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#101115] text-white font-poppins relative flex flex-col lg:flex-row items-center justify-center gap-6 px-4 py-8 overflow-x-hidden nest-hub:h-screen nest-hub:gap-3 nest-hub:px-3 nest-hub:py-3 nest-hub:overflow-hidden">

      {/* Top-Left Logo */}
      <div className="absolute top-6 left-4 flex items-center gap-2 nest-hub:top-3 nest-hub:left-3 nest-hub:gap-1">
        <img src={WieLogo} alt="Wie Logo" className="w-8 h-8 md:w-10 md:h-10 nest-hub:w-6 nest-hub:h-6" />
        <span className="text-lg md:text-xl font-semibold nest-hub:text-sm">Wie</span>
      </div>

      {/* Bottom-Left Socials */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 text-xs text-white nest-hub:bottom-3 nest-hub:left-3 nest-hub:gap-1">
        <span className="hidden sm:inline nest-hub:inline nest-hub:text-xs">Follow us on:</span>
        <button className="w-6 h-6 rounded-full bg-[#362c92] flex items-center justify-center font-bold nest-hub:w-5 nest-hub:h-5 nest-hub:text-xs">f</button>
        <button className="w-6 h-6 rounded-full bg-[#362c92] flex items-center justify-center font-bold nest-hub:w-5 nest-hub:h-5 nest-hub:text-xs">X</button>
        <button className="w-6 h-6 rounded-full bg-[#362c92] flex items-center justify-center font-bold nest-hub:w-5 nest-hub:h-5 nest-hub:text-xs">⧉</button>
      </div>

      {/* WIE Card */}
      <div
        className="hidden lg:flex w-[278px] h-[500px] rounded-[2.5rem] flex-col items-center justify-center p-6 bg-cover bg-center overflow-auto nest-hub:flex nest-hub:w-[160px] nest-hub:h-[280px] nest-hub:rounded-[1.5rem] nest-hub:p-2"
        style={{ backgroundImage: `url(${BG2})` }}
      >
        <img src={WieLogo} alt="Wie Center Logo" className="w-24 lg:w-32 mb-4 nest-hub:w-12 nest-hub:mb-1" />
        <span className="text-white text-xl lg:text-2xl font-semibold nest-hub:text-base">WIE</span>
      </div>

      {/* Forgot Password Card */}
      <div
        className="w-full max-w-[625px] h-auto lg:h-[425px] rounded-xl px-4 sm:px-6 md:px-10 py-8 sm:py-10 flex flex-col justify-center items-center relative bg-cover bg-center overflow-visible nest-hub:max-w-[480px] nest-hub:h-[calc(100vh-130px)] nest-hub:rounded-xl nest-hub:px-4 nest-hub:py-4"
        style={{ backgroundImage: `url(${BG1})` }}
      >

        {/* Lock Icon */}
        <div className="absolute -top-10 w-full flex justify-center overflow-visible pointer-events-none nest-hub:-top-5">
          <img src={LockIcon} alt="Lock Icon" className="w-12 h-12 md:w-20 md:h-20 nest-hub:w-10 nest-hub:h-10" />
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="w-full max-w-md text-center flex flex-col mt-[30px] pb-2 flex-grow nest-hub:max-w-xs nest-hub:mt-7">
          <h2 className="text-xl md:text-[28px] font-bold mb-2 leading-snug nest-hub:text-base nest-hub:leading-tight nest-hub:mb-1">
            Forgot password
          </h2>

          <p className="text-xs md:text-sm font-normal text-gray-300 mb-6 md:mb-[28px] px-4 md:px-0 nest-hub:text-[10px] nest-hub:mb-3 nest-hub:px-1">
            Enter your email or phone number to receive reset instructions.
          </p>

          {/* Error Message */}
          {error && (
            <div className="text-red-400 text-xs md:text-sm mb-4 nest-hub:text-[10px] nest-hub:mb-2">
              {error}
            </div>
          )}

          <label className="text-left font-medium text-white mb-2 text-sm md:text-base nest-hub:mb-1 nest-hub:text-[11px]">
            Email or phone number
          </label>
          <input
            type="text"
            required
            className="w-full p-3 rounded-md text-sm mb-4 nest-hub:p-1.5 nest-hub:text-xs nest-hub:mb-2"
            style={{
              background: '#101115',
              color: '#ffffff',
              border: 'none',
              boxShadow: `
                inset 0 6px 12px rgba(0, 0, 0, 0.6),
                inset 0 -1px 2px rgba(255, 255, 255, 0.1),
                0 3px 8px rgba(255, 255, 255, 0.12)
              `
            }}
            placeholder="Enter the email or contact"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              // Clear error when user starts typing
              if (error) setError("");
            }}
            disabled={isLoading}
          />

          <div className="flex justify-between items-center text-sm text-gray-400 mb-6 nest-hub:text-xs nest-hub:mb-3">
            <div></div>
            <span>
              Remember password?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-white font-semibold hover:underline"
              >
                Login
              </button>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center w-full mt-auto gap-4 sm:gap-0 nest-hub:flex-row nest-hub:gap-0">
            <span
              className="text-white font-bold cursor-pointer text-base nest-hub:text-xs hover:underline"
              onClick={() => navigate(-1)}
            >
              back
            </span>

            <button
              type="submit"
              disabled={isLoading}
              className="text-white font-bold rounded-full transition-all duration-300 hover:scale-105 shadow-md text-sm px-6 py-2 nest-hub:text-xs nest-hub:px-3 nest-hub:py-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                width: '150px',
                background: 'linear-gradient(to bottom, #1e1b4b, #8b5cf6)'
              }}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>

      {/* Login Icon Button */}
      <button
        onClick={() => navigate("/login")}
        className="absolute top-6 right-4 font-bold flex items-center gap-2 px-4 py-1 text-white text-sm rounded-full transition-all duration-300 hover:scale-105 shadow-md nest-hub:top-3 nest-hub:right-3 nest-hub:gap-1 nest-hub:px-3 nest-hub:text-xs"
        style={{
          background: 'linear-gradient(to bottom, #1e1b4b, #8b5cf6)'
        }}
      >
        <img src={LoginIcon} alt="Login Icon" className="w-4 h-4 nest-hub:w-3 nest-hub:h-3" />
        Login
      </button>

      {/* Custom CSS for Nest Hub WIE Card */}
      <style jsx>{`
        @media (width: 1024px) and (height: 600px) {
          .nest-hub\\:rounded-3xl {
            border-radius: 1.5rem !important;
          }

          /* Existing Tailwind utilities for Nest Hub */
          .nest-hub\\:h-screen { height: 100vh !important; }
          .nest-hub\\:gap-3 { gap: 0.75rem !important; }
          .nest-hub\\:px-3 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
          .nest-hub\\:py-3 { padding-top: 0.75rem !important; padding-bottom: 0.75rem !important; }
          .nest-hub\\:overflow-hidden { overflow: hidden !important; }
          .nest-hub\\:top-3 { top: 0.75rem !important; }
          .nest-hub\\:left-3 { left: 0.75rem !important; }
          .nest-hub\\:gap-1 { gap: 0.25rem !important; }
          .nest-hub\\:w-6 { width: 1.5rem !important; }
          .nest-hub\\:h-6 { height: 1.5rem !important; }
          .nest-hub\\:text-sm { font-size: 0.875rem !important; }
          .nest-hub\\:bottom-3 { bottom: 0.75rem !important; }
          .nest-hub\\:text-xs { font-size: 0.75rem !important; }
          .nest-hub\\:w-5 { width: 1.25rem !important; }
          .nest-hub\\:h-5 { height: 1.25rem !important; }
          .nest-hub\\:inline { display: inline !important; }
          .nest-hub\\:flex { display: flex !important; }
          .nest-hub\\:max-w-\\[240px\\] { max-width: 240px !important; }
          .nest-hub\\:h-\\[calc\\(100vh-16px\\)\\] { height: calc(100vh - 16px) !important; }
          .nest-hub\\:rounded-lg { border-radius: 0.5rem !important; }
          .nest-hub\\:rounded-xl { border-radius: 0.75rem !important; }
          .nest-hub\\:rounded-2xl { border-radius: 1rem !important; }
          .nest-hub\\:p-4 { padding: 1rem !important; }
          .nest-hub\\:w-16 { width: 4rem !important; }
          .nest-hub\\:mb-2 { margin-bottom: 0.5rem !important; }
          .nest-hub\\:text-lg { font-size: 1.125rem !important; }
          .nest-hub\\:h-\\[calc\\(100vh-80px\\)\\] { height: calc(100vh - 80px) !important; }
          .nest-hub\\:h-\\[calc\\(100vh-130px\\)\\] { height: calc(100vh - 130px) !important; }
          .nest-hub\\:px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
          .nest-hub\\:py-6 { padding-top: 1.5rem !important; padding-bottom: 1.5rem !important; }
          .nest-hub\\:-top-8 { top: -2rem !important; }
          .nest-hub\\:max-w-sm { max-width: 24rem !important; }
          .nest-hub\\:mt-12 { margin-top: 3rem !important; }
          .nest-hub\\:text-xl { font-size: 1.25rem !important; }
          .nest-hub\\:leading-tight { line-height: 1.25 !important; }
          .nest-hub\\:mb-4 { margin-bottom: 1rem !important; }
          .nest-hub\\:px-2 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
          .nest-hub\\:mb-1 { margin-bottom: 0.25rem !important; }
          .nest-hub\\:p-2 { padding: 0.5rem !important; }
          .nest-hub\\:mb-3 { margin-bottom: 0.75rem !important; }
          .nest-hub\\:flex-row { flex-direction: row !important; }
          .nest-hub\\:gap-0 { gap: 0 !important; }
          .nest-hub\\:right-3 { right: 0.75rem !important; }
          .nest-hub\\:px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
          .nest-hub\\:py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
          .nest-hub\\:w-3 { width: 0.75rem !important; }
          .nest-hub\\:h-3 { height: 0.75rem !important; }
        }
      `}</style>
    </div>
  );
};
export default ForgotPassword;