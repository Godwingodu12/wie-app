import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFacebookF, FaXTwitter } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";
import LightRays from "../../components/auth-model/LightRays";
import bg1 from "../../assets/auth/img_mob.jpg";
import bg2 from "../../assets/auth/img_bg.jpeg";
import userTopIcon from "../../assets/auth/user_top.svg";

const RegisterPage = () => {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleAdminSignup = () => {
    navigate("/adminsignup");
  };

  const handleOrganisationSignup = () => {
    navigate("/organisationsignup");
  };

  return (
    <div className="relative min-h-screen w-full font-sans text-white bg-black">
      {/* Background */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={isMobile ? bg1 : bg2}
          alt="Background"
          className="w-full h-full object-cover"
          style={{
            zIndex: 0,
            objectPosition: "center center",
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

      {/* Centering container */}
      <div className="relative min-h-screen w-full flex flex-col justify-center items-center p-2 z-20">
        
        {/* Header */}
        <header
          className="absolute top-0 left-0 right-0 z-30 w-full flex justify-between items-center pointer-events-auto p-4 sm:p-6 md:p-8 lg:p-10"
          style={{
            paddingTop: "max(env(safe-area-inset-top, 16px), 16px)",
            paddingRight: "max(env(safe-area-inset-right, 16px), 16px)",
            height: "auto",
            minHeight: "60px",
          }}
        >
          <div className="md:hidden"></div>
          <div className="hidden md:flex items-center">
            <img
              src="/src/assets/auth/logo.png"
              alt="Wie Logo"
              className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12"
            />
            <span className="ml-2 text-white text-base sm:text-lg md:text-xl lg:text-2xl wie-font">
              Wie
            </span>
          </div>
          <button
            className="px-3 py-2 sm:px-4 sm:py-2 md:px-5 md:py-2.5 text-xs sm:text-sm md:text-base font-semibold transition-all whitespace-nowrap"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </header>

        {/* Main content area */}
        <main className="w-full max-w-[85vw] sm:max-w-xl lg:max-w-2xl mx-auto">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center justify-center mb-4 sm:mb-6 p-2 sm:p-3 rounded-xl bg-white/10 backdrop-blur-md mx-auto w-fit">
            <img
              src="/src/assets/auth/logo.png"
              alt="Wie Logo"
              className="h-7 w-7 sm:h-9 sm:w-9"
            />
          </div>

          {/* Signup Container */}
          <div
            className="w-full px-8 py-16 pointer-events-auto rounded-[2rem] flex flex-col items-center justify-center text-center relative max-w-[600px] mx-auto"
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.05))",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
            }}
          >
            {/* Top Section */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center mb-4">
                <img src={userTopIcon} alt="Signup Icon" />
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white mb-6">
                Signup
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-white/60 max-w-sm px-2 font-semibold">
                You can create events as an admin or organisation
              </p>
            </div>

            {/* Middle Section - Buttons */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-10 mt-8 mb-8">
              <button
                className="w-full sm:w-[260px] py-4 border border-white/20 bg-transparent hover:bg-white/5 text-white font-medium transition-all text-lg rounded-full"
                onClick={handleAdminSignup}
              >
                Admin
              </button>
              <button
                className="w-full sm:w-[260px] py-4 bg-[#6d62ff] hover:bg-[#5a52f0] text-white font-medium transition-all shadow-lg text-lg rounded-full"
                onClick={handleOrganisationSignup}
              >
                Organization
              </button>
            </div>

            {/* Bottom Section - Login Link */}
            <p className="text-sm text-white/60">
              Already have an account?{' '}
              <button 
                className="text-white font-bold hover:text-white/80 transition-colors"
                onClick={() => navigate('/login')}
              >
                Login
              </button>
            </p>
          </div>

          {/* Mobile social media buttons */}
          <div className="block lg:hidden w-full mt-4 sm:mt-6">
            <div className="flex items-center justify-center space-x-4">
              <button className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#6d62ff]/80 hover:bg-[#6d62ff] backdrop-blur-sm transition-all duration-200">
                <FaXTwitter size={12} className="text-white" />
              </button>
              <button className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#6d62ff]/80 hover:bg-[#6d62ff] backdrop-blur-sm transition-all duration-200">
                <FaFacebookF size={12} className="text-white" />
              </button>
              <button className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#6d62ff]/80 hover:bg-[#6d62ff] backdrop-blur-sm transition-all duration-200">
                <RiInstagramFill size={12} className="text-white" />
              </button>
            </div>
          </div>
        </main>

        {/* Desktop social media buttons */}
        <footer
          className="hidden lg:block absolute bottom-0 left-0 z-30 pointer-events-auto p-3 sm:p-4 md:p-6"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom, 12px), 12px)",
            paddingLeft: "max(env(safe-area-inset-left, 12px), 12px)",
          }}
        >
          <div className="flex items-center space-x-3">
            <span className="text-white/60 text-sm font-medium">Follow us:</span>
            <div className="flex space-x-2">
              <button className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6d62ff]/80 hover:bg-[#6d62ff] backdrop-blur-sm transition-all duration-200">
                <FaXTwitter size={12} className="text-white" />
              </button>
              <button className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6d62ff]/80 hover:bg-[#6d62ff] backdrop-blur-sm transition-all duration-200">
                <FaFacebookF size={12} className="text-white" />
              </button>
              <button className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6d62ff]/80 hover:bg-[#6d62ff] backdrop-blur-sm transition-all duration-200">
                <RiInstagramFill size={12} className="text-white" />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
export default RegisterPage;
