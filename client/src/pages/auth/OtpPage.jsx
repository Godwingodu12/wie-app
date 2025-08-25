// pages/OtpPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOtp, resendOtp } from '../../services/authService';

const OtpPage = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [timer, setTimer] = useState(60); // 1 minute = 60 seconds
  const [isResending, setIsResending] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const intervalRef = useRef(null);
  
  const email = location.state?.email;
  const contact_no = location.state?.contact_no;
  const userInput = email || contact_no;

  // Timer countdown effect
  useEffect(() => {
    if (timer > 0) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Cleanup interval on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer]);

  // Clear messages when user types
  useEffect(() => {
    if (otp) {
      setError('');
      setSuccessMessage('');
    }
  }, [otp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      await verifyOtp({ email, contact_no, otp });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    }
  };

  const handleResend = async () => {
    if (timer > 0 || isResending) return;
    
    setIsResending(true);
    setError('');
    setSuccessMessage('');

    try {
      const inputData = userInput.includes('@') 
        ? { email: userInput } 
        : { contact_no: userInput };

      const response = await resendOtp(inputData);
      
      // Reset OTP input and timer
      setOtp('');
      setTimer(60); // Reset to 1 minute
      
      // Show success message
      setSuccessMessage(response.data?.message || 'New OTP sent successfully!');
      
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
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-center text-blue-600">Verify OTP</h2>
        
        {error && (
          <div className="text-red-600 text-sm mb-4 text-center bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="text-green-600 text-sm mb-4 text-center bg-green-50 p-2 rounded">
            {successMessage}
          </div>
        )}
        
        <p className="text-sm text-gray-600 mb-4 text-center">
          Enter the OTP sent to <strong>{userInput}</strong>
        </p>
        
        <input
          type="text"
          value={otp}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, ''); // Only allow digits
            if (value.length <= 6) {
              setOtp(value);
            }
          }}
          placeholder="Enter 6-digit OTP"
          maxLength="6"
          className="w-full border rounded px-3 py-2 mb-4 focus:outline-blue-400 text-center text-lg tracking-widest"
        />
        
        <div className="flex justify-between items-center text-sm mb-6 px-1">
          <span className={`${timer > 0 ? 'text-gray-600' : 'text-red-500'}`}>
            {timer > 0 ? `Time left: ${formatTime(timer)}` : 'OTP Expired'}
          </span>
          
          <span className="text-gray-600">
            Didn't receive OTP?{' '}
            <button
              type="button"
              className={`font-semibold transition-all duration-200 ${
                timer > 0 || isResending 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:text-blue-800 cursor-pointer'
              }`}
              disabled={timer > 0 || isResending}
              onClick={handleResend}
            >
              {isResending ? 'Resending...' : 'Resend'}
            </button>
          </span>
        </div>
        
        <button 
          type="submit" 
          disabled={!otp || otp.length !== 6}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Verify OTP
        </button>
      </form>
    </div>
  );
};

export default OtpPage;
