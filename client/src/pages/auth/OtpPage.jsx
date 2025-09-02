import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { verifyOtp, resendOtp } from "../../services/authService";
import { toast } from "react-toastify";
import { FaFacebookF, FaXTwitter } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";
import LightRays from "../../components/auth-model/LightRays";
import bg1 from "../../assets/auth/img_mob.jpg";
import bg2 from "../../assets/auth/img_bg.jpeg";

const OtpPage = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [timer, setTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputsRef = useRef([]);
  const intervalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) setEmail(storedEmail);
  }, []);

  useEffect(() => {
    if (timer > 0) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, [timer]);

  useEffect(() => {
    if (otp.join("")) {
      setError("");
      setSuccessMessage("");
    }
  }, [otp]);

  const handleChange = (element, index) => {
    if (element.value && isNaN(Number(element.value))) return;
    const newOtp = [...otp];
    newOtp[index] = element.value.slice(-1);
    setOtp(newOtp);
    if (element.value && index < otp.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    const key = e.key;
    if (key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (key === "ArrowRight" && index < otp.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      setIsLoading(false);
      return;
    }

    try {
      await verifyOtp({ email, otp: otpCode });
      toast.success("OTP verified successfully!");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await resendOtp({ email });
      setOtp(new Array(6).fill(""));
      setTimer(60);
      setSuccessMessage(response.data?.message || "New OTP sent successfully!");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans">
      {/* Background */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={isMobile ? bg1 : bg2}
          alt="Background"
          className="w-full h-full object-cover"
          style={{ 
            zIndex: 0,
            objectPosition: 'center center',
            minHeight: '100vh',
            minWidth: '100vw'
          }}
        />
      </div>

      {/* Light rays overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <LightRays
          raysOrigin="top-center"
          raysColor="#5a5cff"
          raysSpeed={1.1}
          lightSpread={0.95}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.06}
          distortion={0.02}
          className="fullpage-rays"
        />
      </div>

      {/* Header - Fixed height with login button always visible */}
      <header className="absolute top-0 left-0 right-0 z-30 w-full flex justify-between items-center pointer-events-auto p-4 sm:p-6 md:p-8 lg:p-10"
        style={{ 
          paddingTop: 'max(env(safe-area-inset-top, 16px), 16px)',
          paddingRight: 'max(env(safe-area-inset-right, 16px), 16px)',
          height: 'auto',
          minHeight: '60px'
        }}
      >
        <img
          src="/src/assets/auth/logo.png"
          alt="Wie Logo"
          className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 hidden md:block"
          style={{ 
            filter: 'none !important', 
            boxShadow: 'none !important',
            dropShadow: 'none !important',
            WebkitFilter: 'none !important',
            textShadow: 'none !important'
          }}
        />
        
        {/* Login button - Always visible on all devices */}
        <button 
          className="px-3 py-2 sm:px-4 sm:py-2 md:px-5 md:py-2.5 text-xs sm:text-sm md:text-base font-semibold rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all whitespace-nowrap"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </header>

      {/* Main content area - Centered without scroll */}
      <div className="absolute inset-0 z-20 flex items-center justify-center"
        style={{ 
          paddingTop: '80px', // Space for header
          paddingBottom: '80px', // Space for footer
          paddingLeft: 'max(env(safe-area-inset-left, 16px), 16px)',
          paddingRight: 'max(env(safe-area-inset-right, 16px), 16px)'
        }}
      >
        <div className="w-full max-w-[85vw] sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto">
          
          {/* Mobile logo - no shadow, compact design */}
          <div className="flex md:hidden items-center justify-center mb-4 sm:mb-6 p-2 sm:p-3 rounded-xl bg-white/10 backdrop-blur-md mx-auto w-fit">
            <img
              src="/src/assets/auth/logo.png"
              alt="Wie Logo"
              className="h-8 w-8 sm:h-10 sm:w-10"
              style={{ 
                filter: 'none !important', 
                boxShadow: 'none !important',
                dropShadow: 'none !important',
                WebkitFilter: 'none !important',
                textShadow: 'none !important'
              }}
            />
          </div>

          {/* OTP Container - Responsive height with proper containment */}
          <div
            className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 md:py-8 lg:py-10 pointer-events-auto rounded-2xl sm:rounded-3xl flex flex-col items-center text-center relative"
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.05))",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
              minHeight: 'auto',
              maxHeight: 'none',
              overflow: 'visible'
            }}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center mb-3 sm:mb-4 md:mb-6">
              <img
                src={"/src/assets/auth/shield.png"}
                alt="Shield"
                className="h-full w-full"
              />
            </div>

            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white mb-2">
              Account Verification
            </h1>

            {error && (
              <p className="text-red-400 text-xs sm:text-sm mt-2 px-2">{error}</p>
            )}
            {successMessage && (
              <p className="text-green-400 text-xs sm:text-sm mt-2 px-2">
                {successMessage}
              </p>
            )}

            <p className="text-xs sm:text-sm md:text-base text-white/60 mb-4 sm:mb-5 md:mb-6 max-w-sm px-2">
              Enter the code we sent to {email}.
            </p>

            <div className="w-full mb-4 sm:mb-5 md:mb-6">
              <div className="grid grid-cols-6 gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 max-w-[280px] sm:max-w-xs md:max-w-sm mx-auto">
                {otp.map((data, index) => {
                  const filled = Boolean(data);
                  return (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      aria-label={`OTP digit ${index + 1}`}
                      placeholder={filled ? undefined : "-"}
                      className={
                        `aspect-square w-full rounded-lg text-center text-white font-semibold outline-none transition-all duration-200 ` +
                        `text-sm sm:text-base md:text-lg lg:text-xl ` +
                        (filled
                          ? "bg-[rgba(8,10,12,0.9)] shadow-[0_4px_12px_rgba(0,0,0,0.6)] scale-105"
                          : "bg-[rgba(50,40,150,0.16)] border border-[rgba(80,70,180,0.18)] backdrop-blur-sm shadow-[0_3px_8px_rgba(40,40,120,0.12)] hover:border-[rgba(80,70,180,0.3)] focus:border-[rgba(109,98,255,0.5)]")
                      }
                      style={{
                        border: filled
                          ? "none"
                          : "1px solid rgba(80,70,180,0.18)",
                        boxSizing: "border-box",
                      }}
                      value={data}
                      onChange={(e) => handleChange(e.target, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onFocus={(e) => e.target.select()}
                      ref={(el) => {
                        inputsRef.current[index] = el;
                      }}
                      maxLength={1}
                    />
                  );
                })}
              </div>
            </div>

            <p
              className="text-white/80 mb-2 text-xs sm:text-sm md:text-base"
              aria-live="polite"
            >
              {timer > 0 ? `Time left: ${timer}s` : "OTP Expired"}
            </p>

            <p className="text-xs sm:text-sm md:text-base text-white/60 mb-4 sm:mb-6 md:mb-8">
              Didn't receive OTP?{" "}
              <button
                className={`font-semibold text-white hover:text-white/80 transition-colors ${
                  timer > 0 || isResending
                    ? "cursor-not-allowed text-gray-400"
                    : ""
                }`}
                onClick={handleResend}
                disabled={timer > 0 || isResending}
              >
                {isResending ? "Resending..." : "Resend"}
              </button>
            </p>

            {/* Action buttons - Always inside container */}
            <div className="w-full mt-2 sm:mt-4">
              {/* Desktop layout */}
              <div className="hidden sm:flex items-center justify-center gap-3 md:gap-4">
                <button
                  className="flex-1 max-w-[140px] md:max-w-[160px] lg:max-w-[180px] py-2.5 md:py-3 lg:py-4 border border-white/16 bg-transparent hover:bg-white/5 rounded-lg text-white/80 font-medium transition-all text-xs md:text-sm lg:text-base"
                  onClick={() => navigate(-1)}
                >
                  Go back
                </button>
                <button
                  className="flex-1 max-w-[140px] md:max-w-[160px] lg:max-w-[180px] py-2.5 md:py-3 lg:py-4 bg-[#6d62ff] hover:bg-[#5a52f0] rounded-lg text-white font-medium transition-all shadow-lg text-xs md:text-sm lg:text-base"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify"}
                </button>
              </div>

              {/* Mobile layout - Always visible and contained */}
              <div className="flex sm:hidden flex-col gap-2.5 w-full">
                <button
                  className="w-full py-2.5 bg-[#6d62ff] hover:bg-[#5a52f0] rounded-full text-white font-medium transition-all shadow-lg text-sm"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify"}
                </button>
                <button
                  className="w-full py-2.5 border border-white/16 bg-transparent hover:bg-white/5 rounded-full text-white/80 font-medium transition-all text-sm"
                  onClick={() => navigate(-1)}
                >
                  Go back
                </button>
              </div>
            </div>
          </div>

          {/* Mobile social media buttons - Under OTP container, horizontal layout */}
          <div className="block lg:hidden w-full mt-4 sm:mt-6">
            <div className="flex items-center justify-center space-x-4">
              <button 
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#6d62ff]/80 hover:bg-[#6d62ff] backdrop-blur-sm transition-all duration-200"
                aria-label="Follow us on Twitter"
              >
                <FaXTwitter size={12} className="text-white" />
              </button>
              <button 
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#6d62ff]/80 hover:bg-[#6d62ff] backdrop-blur-sm transition-all duration-200"
                aria-label="Follow us on Facebook"
              >
                <FaFacebookF size={12} className="text-white" />
              </button>
              <button 
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#6d62ff]/80 hover:bg-[#6d62ff] backdrop-blur-sm transition-all duration-200"
                aria-label="Follow us on Instagram"
              >
                <RiInstagramFill size={12} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Social media buttons - Desktop: Bottom left corner only */}
      <div className="hidden lg:block absolute bottom-0 left-0 z-30 pointer-events-auto p-3 sm:p-4 md:p-6"
        style={{ 
          paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)',
          paddingLeft: 'max(env(safe-area-inset-left, 12px), 12px)'
        }}
      >
        {/* Desktop layout with label */}
        <div className="flex items-center space-x-3">
          <span className="text-white/60 text-sm font-medium">
            Follow us:
          </span>
          <div className="flex space-x-2">
            <button 
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6d62ff]/80 hover:bg-[#6d62ff] backdrop-blur-sm transition-all duration-200"
              aria-label="Follow us on Twitter"
            >
              <FaXTwitter size={12} className="text-white" />
            </button>
            <button 
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6d62ff]/80 hover:bg-[#6d62ff] backdrop-blur-sm transition-all duration-200"
              aria-label="Follow us on Facebook"
            >
              <FaFacebookF size={12} className="text-white" />
            </button>
            <button className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6d62ff]/80 hover:bg-[#6d62ff] backdrop-blur-sm transition-all duration-200"
            aria-label="Follow us on Instagram">
                <RiInstagramFill size={12} className="text-white" />
              </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default OtpPage;
