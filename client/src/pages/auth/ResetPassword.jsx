import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { resetPassword } from "../../services/authService";

import UnlockIcon from "../../assets/UnlockIcon.svg";
import LoginIcon from "../../assets/LoginIcon.svg";
import WieLogo from "../../assets/WieLogo.svg";
import BG1 from "../../assets/BG1.png"; // Reset password card
import BG2 from "../../assets/BG2.png"; // WIE card

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const navigate = useNavigate();
  const { input } = useParams();

  useEffect(() => {
    if (input) {
      setUserId(decodeURIComponent(input));
    } else {
      navigate('/forgot-password');
    }
  }, [input, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password.trim() || !confirmPassword.trim()) {
      setError("Please fill in both fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const resetData = { userId, newPassword: password };
      await resetPassword(resetData);
      navigate("/home");
    } catch (error) {
      console.error("Error resetting password:", error);
      setError("Failed to reset password. Please try again.");
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
      <div className="hidden lg:flex w-[278px] h-[500px] rounded-[2.5rem] flex-col items-center justify-center p-6 bg-cover bg-center shadow-[0_4px_20px_rgba(0,0,0,0.15)] nest-hub:flex nest-hub:w-[160px] nest-hub:h-[280px] nest-hub:rounded-[1.5rem] nest-hub:p-2"
        style={{ backgroundImage: `url(${BG2})` }}>
        <img src={WieLogo} alt="WIE Center Logo" className="w-24 lg:w-32 mb-4 nest-hub:w-12 nest-hub:mb-1" />
        <span className="text-white text-xl lg:text-2xl font-semibold nest-hub:text-base">WIE</span>
      </div>

      {/* Reset Password Card */}
      <div className="w-full max-w-[625px] h-auto lg:h-[425px] rounded-xl px-4 sm:px-6 md:px-10 py-8 sm:py-10 flex flex-col justify-center items-center relative bg-cover bg-center nest-hub:max-w-[480px] nest-hub:h-[calc(100vh-130px)] nest-hub:rounded-xl nest-hub:px-4 nest-hub:py-4"
        style={{ backgroundImage: `url(${BG1})` }}>

        {/* Unlock Icon */}
        <div className="absolute -top-10 w-full flex justify-center overflow-visible pointer-events-none nest-hub:-top-5">
          <img src={UnlockIcon} alt="Unlock Icon" className="w-12 h-12 md:w-20 md:h-20 nest-hub:w-10 nest-hub:h-10" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-md text-center flex flex-col mt-[30px] pb-2 flex-grow nest-hub:max-w-xs nest-hub:mt-7">
          <h2 className="text-xl md:text-[28px] font-bold mb-2 leading-snug nest-hub:text-base nest-hub:leading-tight nest-hub:mb-1">Reset Password</h2>
          <p className="text-xs md:text-sm font-normal text-gray-300 mb-6 md:mb-[28px] px-4 md:px-0 nest-hub:text-[10px] nest-hub:mb-3 nest-hub:px-1">Create a new password for your account.</p>

          {error && <div className="text-red-400 text-xs md:text-sm mb-4 nest-hub:text-[10px] nest-hub:mb-2">{error}</div>}

          <label className="text-left font-medium text-white mb-2 text-sm md:text-base nest-hub:mb-1 nest-hub:text-[11px]">New Password</label>
          <input
            type="password"
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
            placeholder="Enter new password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            disabled={isLoading}
          />

          <label className="text-left font-medium text-white mb-2 text-sm md:text-base nest-hub:mb-1 nest-hub:text-[11px]">Confirm Password</label>
          <input
            type="password"
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
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError("");
            }}
            disabled={isLoading}
          />

          <div className="flex justify-between items-center text-sm text-gray-400 mb-6 nest-hub:text-xs nest-hub:mb-3">
            <div></div>
            <span>
              Remember password?{" "}
              <button type="button" onClick={() => navigate("/login")} className="text-white font-semibold hover:underline">
                Login
              </button>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center w-full mt-auto gap-4 sm:gap-0 nest-hub:flex-row nest-hub:gap-0">
            <span className="text-white font-bold cursor-pointer text-base nest-hub:text-xs hover:underline" onClick={() => navigate(-1)}>back</span>

            <button
              type="submit"
              disabled={isLoading}
              className="text-white font-bold rounded-full transition-all duration-300 hover:scale-105 shadow-md text-sm px-6 py-2 nest-hub:text-xs nest-hub:px-3 nest-hub:py-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                width: '150px',
                background: 'linear-gradient(to bottom, #1e1b4b, #8b5cf6)'
              }}
            >
              {isLoading ? 'Resetting...' : 'Reset'}
            </button>
          </div>
        </form>
      </div>

      {/* Login Icon Button */}
      <button
        onClick={() => navigate("/home")}
        className="absolute top-6 right-4 font-bold flex items-center gap-2 px-4 py-1 text-white text-sm rounded-full transition-all duration-300 hover:scale-105 shadow-md nest-hub:top-3 nest-hub:right-3 nest-hub:gap-1 nest-hub:px-3 nest-hub:text-xs"
        style={{
          background: 'linear-gradient(to bottom, #1e1b4b, #8b5cf6)'
        }}
      >
        <img src={LoginIcon} alt="Login Icon" className="w-4 h-4 nest-hub:w-3 nest-hub:h-3" />
        Login
      </button>
    </div>
  );
};

export default ResetPassword;
