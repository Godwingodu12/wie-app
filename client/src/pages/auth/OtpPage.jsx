import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOtp, resendOtp } from "../../services/authService";
import VerifyIcon from "../../assets/auth/acc_verification_icon.svg";

// --- Helper Components ---
import Logo from "../../assets/wie_logo.svg";
import bg from "../../assets/background.png";
// --- Main Component ---
const OTP_TIMER_DURATION = 59;

const OtpPage = () => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef([]);

  const [identifier] = useState(
    location.state?.email ||
      location.state?.contact_no ||
      sessionStorage.getItem("otpIdentifier")
  );

  const [timer, setTimer] = useState(() => {
    const expiryTimestamp = sessionStorage.getItem("otpTimerExpiry");
    if (!expiryTimestamp) return 0;
    const remainingTime = Math.round((expiryTimestamp - Date.now()) / 1000);
    return remainingTime > 0 ? remainingTime : 0;
  });

  useEffect(() => {
    if (identifier) {
      sessionStorage.setItem("otpIdentifier", identifier);
    }
  }, [identifier]);

  // **FIX**: Starts the timer ONLY on the first visit, not on refresh if expired.
  useEffect(() => {
    if (!identifier) return;
    const expiryTimestamp = sessionStorage.getItem("otpTimerExpiry");

    // Only set a new timer if one has NEVER been set before for this session.
    if (!expiryTimestamp) {
      const newExpiry = Date.now() + OTP_TIMER_DURATION * 1000;
      sessionStorage.setItem("otpTimerExpiry", newExpiry);
      setTimer(OTP_TIMER_DURATION);
    }
  }, [identifier]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prevTimer) => prevTimer - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.value !== "" && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const value = e.clipboardData.getData("text");
    if (isNaN(value) || value.length !== 6) return;
    setOtp(value.split(""));
    inputRefs.current[5].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier) {
      setError("Your session has expired. Please start the process again.");
      return;
    }
    setLoading(true);
    const finalOtp = otp.join("");
    if (finalOtp.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      setLoading(false);
      return;
    }
    try {
      const isEmail = identifier.includes("@");
      const payload = isEmail
        ? { email: identifier, otp: finalOtp }
        : { contact_no: identifier, otp: finalOtp };
      await verifyOtp(payload);
      sessionStorage.removeItem("otpIdentifier");
      sessionStorage.removeItem("otpTimerExpiry");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || !identifier) return;
    try {
      const isEmail = identifier.includes("@");
      const payload = isEmail
        ? { email: identifier }
        : { contact_no: identifier };
      await resendOtp(payload);

      const newExpiry = Date.now() + OTP_TIMER_DURATION * 1000;
      sessionStorage.setItem("otpTimerExpiry", newExpiry);
      setTimer(OTP_TIMER_DURATION);

      setOtp(new Array(6).fill(""));
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    }
  };

  if (!identifier) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Verification Session Expired
        </h1>
        <p className="text-gray-400 mb-6 text-center">
          Your session details were not found. Please return to the login or
          signup page.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundImage: `url(${bg})`,
      }}
      className="font-sans text-white bg-cover bg-center relative min-h-screen w-full flex flex-col items-center justify-center bg-black  overflow-hidden"
    >
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center md:px-12">
        <img src={Logo} alt="Wie Logo" className="h-10" />
        SignUp
      </header>
      <main className="relative w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 z-10">
        <form onSubmit={handleSubmit}>
          <img src={VerifyIcon} alt="" className="mx-auto py-4" />
          <h1 className="text-2xl font-bold text-center text-white mb-2">
            Account Verification
          </h1>
          <p className="text-sm text-center text-gray-400 mb-6">
            Enter the code we sent to your email or phone.
          </p>
          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => handleKeyDown(e, index)}
                ref={(el) => (inputRefs.current[index] = el)}
                className={`w-12 h-14 text-center text-2xl font-semibold bg-gray-500/20 border-2 rounded-lg outline-none transition-all duration-200
                  ${
                    error
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-gray-500/30 focus:border-violet-500"
                  }
                `}
              />
            ))}
          </div>
          <div className="text-center text-sm text-gray-400 mb-8">
            {timer > 0 ? (
              <div>
                <div className="py-1">{`00:${timer
                  .toString()
                  .padStart(2, "0")}`}</div>
                <div>
                  Didn't receive OTP?{" "}
                  <span className="font-semibold text-gray-500 cursor-not-allowed">
                    Resend
                  </span>
                </div>
              </div>
            ) : (
              <span>
                Didn't receive OTP?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-semibold text-violet-400 hover:text-violet-300"
                >
                  Resend
                </button>
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full px-6 py-3 bg-gray-500/20 text-white font-semibold rounded-lg hover:bg-gray-500/40 transition-colors"
            >
              Go back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 disabled:bg-violet-800 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
          )}
        </form>
      </main>
    </div>
  );
};

export default OtpPage;
