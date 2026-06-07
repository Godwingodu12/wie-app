import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { verifyUser, resendOtp } from '../../services/authService';

import LockIcon from '../../assets/LockIcon.svg';
import UnlockIcon from '../../assets/UnlockIcon.svg';
import LoginIcon from '../../assets/LoginIcon.svg';
import WieLogo from '../../assets/WieLogo.svg';
import BG1 from '../../assets/BG1.png';
import BG2 from '../../assets/BG2.png';

const VerifyUser = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userInput, setUserInput] = useState('');
  const [inputType, setInputType] = useState('');
  const [timer, setTimer] = useState(60);
  const [isVerified, setIsVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const { input } = useParams();
  const navigate = useNavigate();
  const inputsRef = useRef([]);

  useEffect(() => {
    if (input) {
      const decoded = decodeURIComponent(input);
      setUserInput(decoded);
      setInputType(decoded.includes('@') ? 'email' : 'contact no');
    } else {
      navigate('/forgot-password');
    }

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [input, navigate]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (!/^\d?$/.test(val)) return;
    
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    
    // Clear any previous error when user starts typing
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
    
    if (val && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsVerifying(true);

    if (otp.some((digit) => digit === '')) {
      setError('Please enter the full 6-digit OTP');
      setIsVerifying(false);
      return;
    }

    const joinedOtp = otp.join('');

    try {
      const inputData = {
        input: userInput.includes('@') ? { email: userInput } : { contact_no: userInput },
        otp: joinedOtp
      };

      const response = await verifyUser(inputData);
      setIsVerified(true);
      setSuccessMessage('OTP verified successfully! Redirecting...');

      setTimeout(() => {
        navigate(`/reset-password/${response.userId}`);
      }, 1500);
    } catch (err) {
      setIsVerified(false);
      const errorMessage = err?.response?.data?.message || 'OTP verification failed';
      setError(errorMessage);
      
      // If it's an expired or invalid OTP error, clear the input fields
      if (errorMessage.includes('expired') || errorMessage.includes('no longer valid')) {
        setOtp(['', '', '', '', '', '']);
        inputsRef.current[0]?.focus();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    setSuccessMessage('');

    try {
      const inputData = userInput.includes('@') 
        ? { email: userInput } 
        : { contact_no: userInput };

      const response = await resendOtp(inputData);
      
      // Reset OTP inputs and timer
      setOtp(['', '', '', '', '', '']);
      setTimer(60); // Reset to 1 minutes (60 seconds) to match server expiry
      
      // Focus on first input
      inputsRef.current[0]?.focus();
      
      // Show success message
      setSuccessMessage(response.message || 'New OTP sent successfully!');
      
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Failed to resend OTP';
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  // Format timer display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full min-h-screen bg-[#101115] text-white font-poppins relative flex flex-col lg:flex-row items-center justify-center gap-6 px-4 py-8 overflow-x-hidden">
      <div className="absolute top-6 left-4 flex items-center gap-2">
        <img src={WieLogo} alt="Wie Logo" className="w-10 h-10" />
        <span className="text-xl font-semibold">Wie</span>
      </div>

      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 text-xs text-white">
        <span className="hidden sm:inline">Follow us on:</span>
        <button className="w-6 h-6 rounded-full bg-[#362c92] flex items-center justify-center font-bold">f</button>
        <button className="w-6 h-6 rounded-full bg-[#362c92] flex items-center justify-center font-bold">X</button>
        <button className="w-6 h-6 rounded-full bg-[#362c92] flex items-center justify-center font-bold">⧉</button>
      </div>

      <div
        className="hidden lg:flex w-[278px] h-[500px] rounded-[2.5rem] flex-col items-center justify-center p-6 bg-cover bg-center overflow-auto"
        style={{ backgroundImage: `url(${BG2})` }}
      >
        <img src={WieLogo} alt="Wie Center Logo" className="w-32 mb-4" />
        <span className="text-white text-2xl font-semibold">WIE</span>
      </div>

      <div
        className="w-full max-w-[625px] h-auto lg:h-[425px] rounded-xl px-4 sm:px-6 md:px-10 py-8 sm:py-10 flex flex-col justify-center items-center relative bg-cover bg-center overflow-visible"
        style={{ backgroundImage: `url(${BG1})` }}
      >
        <div className="absolute -top-10 w-full flex justify-center overflow-visible pointer-events-none">
          <img
            src={isVerified ? UnlockIcon : LockIcon}
            alt="Status Icon"
            className="w-12 h-12 md:w-20 md:h-20"
          />
        </div>

        <div className="w-full max-w-md text-center flex flex-col mt-[30px] pb-2 flex-grow">
          <h2 className="text-xl md:text-[28px] font-bold mb-2 leading-snug">OTP Verification</h2>
          <p className="text-sm text-gray-300 mb-6">
            Enter the 6-digit code sent to your {inputType}:{' '}
            <span className="font-bold">{userInput}</span>
          </p>

          {error && (
            <div className="text-sm text-red-500 mb-4 p-2 bg-red-100 bg-opacity-10 rounded">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="text-sm text-green-500 mb-4 p-2 bg-green-100 bg-opacity-10 rounded">
              {successMessage}
            </div>
          )}

          <div className="flex justify-center gap-3 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                placeholder="-"
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                ref={(el) => (inputsRef.current[index] = el)}
                disabled={isVerifying}
                className={`w-12 h-14 text-center rounded-md tracking-widest caret-white text-xl font-bold placeholder-white transition-all duration-200 ${
                  isVerifying ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{
                  background: '#101115',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 'bold',
                  boxShadow: `
                    inset 0 6px 12px rgba(0, 0, 0, 0.6),
                    inset 0 -1px 2px rgba(255, 255, 255, 0.1),
                    0 3px 8px rgba(255, 255, 255, 0.12)
                  `
                }}
              />
            ))}
          </div>

          <div className="flex justify-between items-center text-sm text-gray-400 mb-6 px-1">
            <span className="text-left">
              Time left: {formatTime(timer)}
            </span>
            <span>
              Didn't receive the OTP?{' '}
              <button
                className={`text-white font-semibold transition-all duration-200 ${
                  timer > 0 || isResending ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-300'
                }`}
                disabled={timer > 0 || isResending}
                onClick={handleResend}
              >
                {isResending ? 'Resending...' : 'Resend'}
              </button>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center w-full mt-auto gap-4 sm:gap-0">
            <span
              className="text-white font-bold cursor-pointer text-base hover:text-gray-300 transition-colors duration-200"
              onClick={() => navigate(-1)}
            >
              back
            </span>

            <button
              onClick={handleSubmit}
              disabled={isVerifying || otp.some((digit) => digit === '')}
              className={`text-white font-bold rounded-full transition-all duration-300 hover:scale-105 shadow-md text-sm px-6 py-2 ${
                isVerifying || otp.some((digit) => digit === '') 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-105'
              }`}
              style={{
                width: '150px',
                background: 'linear-gradient(to bottom, #1e1b4b, #8b5cf6)'
              }}
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/login')}
        className="absolute top-6 right-4 font-bold flex items-center gap-2 px-4 py-1 text-white text-sm rounded-full transition-all duration-300 hover:scale-105 shadow-md"
        style={{
          background: 'linear-gradient(to bottom, #1e1b4b, #8b5cf6)'
        }}
      >
        <img src={LoginIcon} alt="Login Icon" className="w-4 h-4" />
        Login
      </button>
    </div>
  );
};

export default VerifyUser;