import React, { useState, useEffect } from "react";
import { getMe } from "../../services/userService.js";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../services/authService.js";
import SideBar from "../../components/HomePage/SideBar.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import SettingsNavigation from "../../components/settings/SettingsNavigation.jsx";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import NotificationIcon from "../../assets/HomePage/NotificationIcon.svg";
import HandBurgerIcon from "../../assets/HomePage/HandBurgerIcon.svg";
import ChangPasswordIcon from "../../assets/Settings/changePasswordIcon.png";
import {
  KeyRound,
  ShieldCheck,
  Smartphone,
  Bell,
  History,
  Shield,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

const HEADER_HEIGHT = 72;

const ContentItem = ({ icon, text, subtext, hasChevron = true, border = true, theme }) => (
  <div className="relative">
    <div className={`flex items-center px-4 py-4 w-full`}>
      <div className="min-w-0 flex-1">
        <p className={`${theme.text} text-sm sm:text-base truncate`}>{text}</p>
        {subtext && <p className={`text-xs ${theme.text} opacity-70 truncate`}>{subtext}</p>}
      </div>
      <div className="flex items-center gap-2 ml-4">
        <div className="w-6 h-6 flex items-center justify-center">
          {icon}
        </div>
        {hasChevron && (
          <div className="w-6 h-6 flex items-center justify-center">
            <ChevronRight className={`h-6 w-6 ${theme.text}`} />
          </div>
        )}
      </div>
    </div>
    {border && <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>}
  </div>
);

// Alert Component
const Alert = ({ type, message, theme }) => {
  const bgColor = type === "error" ? "bg-red-900/30" : "bg-green-900/30";
  const textColor = type === "error" ? "text-red-200" : "text-green-200";
  const borderColor = type === "error" ? "border-red-700" : "border-green-700";
  const iconColor = type === "error" ? "text-red-400" : "text-green-400";

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 flex items-center gap-3 mb-6`}>
      <AlertCircle className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
      <p className={`${textColor} text-sm`}>{message}</p>
    </div>
  );
};

const ChangePasswordContent = ({ theme, handleGoBack }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Password validation rules
  const validatePasswordStrength = (password) => {
    const rules = {
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasMinLength: password.length >= 6,
    };
    return rules;
  };

  const getPasswordValidationMessage = (password) => {
    const rules = validatePasswordStrength(password);
    const messages = [];
    
    if (!rules.hasUppercase) messages.push("At least one uppercase letter");
    if (!rules.hasLowercase) messages.push("At least one lowercase letter");
    if (!rules.hasMinLength) messages.push("At least 6 characters");
    
    return messages;
  };

  const isPasswordValid = (password) => {
    const rules = validatePasswordStrength(password);
    return rules.hasUppercase && rules.hasLowercase && rules.hasMinLength;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setAlert(null);
    let hasErrors = false;

    // Validation checks
    if (!currentPassword.trim()) {
      setErrors((prev) => ({
        ...prev,
        currentPassword: "Current password is required",
      }));
      hasErrors = true;
    }

    if (!newPassword.trim()) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "New password is required",
      }));
      hasErrors = true;
    } else if (!isPasswordValid(newPassword)) {
      const messages = getPasswordValidationMessage(newPassword);
      setErrors((prev) => ({
        ...prev,
        newPassword: messages.join(", "),
      }));
      hasErrors = true;
    }

    if (!confirmPassword.trim()) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Confirm password is required",
      }));
      hasErrors = true;
    } else if (newPassword !== confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
      hasErrors = true;
    }

    if (currentPassword === newPassword) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "New password must be different from current password",
      }));
      hasErrors = true;
    }

    if (hasErrors) return;

    setLoading(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setAlert({
        type: "success",
        message: "Password changed successfully!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => handleGoBack(), 2000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to change password";
      setAlert({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center justify-start text-center w-full h-full pt-8">
      {/* Icon in center */}
      <div
        className={`flex items-center justify-center ${theme.bg}`}
        style={{
          width: "58px",
          height: "58px",
          borderRadius: "12px",
          opacity: 1,
          padding: "15px",
          boxShadow:
            "inset 2px 2px 4px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(255,255,255,0.1)",
        }}
      >
        <img
          src={ChangPasswordIcon}
          alt="Change Password Icon"
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Heading */}
      <h1
        className={`${theme.text} mt-6`}
        style={{
          fontFamily: "Urbanist, sans-serif",
          fontWeight: 500,
          fontSize: "20px",
          lineHeight: "100%",
          letterSpacing: "0%",
        }}
      >
        Change password
      </h1>
      <p
        style={{
          fontFamily: "Urbanist, sans-serif",
          fontWeight: 400,
          fontSize: "14px",
          lineHeight: "17px",
          whiteSpace: "nowrap",
          display: "inline-block",
          position: "relative",
          left: "2px",
          top: "15px",
          color: "#777777",
          opacity: 1,
        }}
      >
        Choose a new password to enhance your account's protection.
      </p>

      {/* Alert Section */}
      <div className="mt-8 w-full max-w-md px-4">
        {alert && <Alert type={alert.type} message={alert.message} theme={theme} />}
      </div>

      {/* Current Password */}
      <div
  className="mt-6 w-full flex flex-col items-center"
  style={{ marginLeft: "-45px" }} // moved more to the left
>
  <div
    className="flex items-center justify-center"
    style={{
      width: "572px",
      maxWidth: "90vw",
      height: "50px",
      gap: "24px",
      opacity: 1,
    }}
  >
    <label
      htmlFor="currentPassword"
      className={`${theme.text}`}
      style={{
        whiteSpace: "nowrap",
        fontFamily: "Urbanist, sans-serif",
        fontWeight: 400,
        fontSize: "16px",
        lineHeight: "100%",
        display: "flex",
        alignItems: "center",
        marginRight: "25px",
        minWidth: "150px",
      }}
    >
      Current password
    </label>
    <div className="relative flex-1">
      <input
        type={showPasswords.current ? "text" : "password"}
        id="currentPassword"
        placeholder="Enter your current password"
        value={currentPassword}
        onChange={(e) => {
          setCurrentPassword(e.target.value);
          setErrors((prev) => ({ ...prev, currentPassword: "" }));
        }}
        className={`w-full border rounded-md ${theme.inputBg} ${theme.text} text-sm px-[20px] py-[10px] pr-10 ${
          errors.currentPassword ? "border-red-500" : "border-gray-400"
        }`}
        style={{
          borderWidth: "0.5px",
          fontFamily: "Urbanist, sans-serif",
          fontSize: "14px",
          fontWeight: 400,
          lineHeight: "100%",
        }}
      />
      <button
        type="button"
        onClick={() =>
          setShowPasswords((prev) => ({
            ...prev,
            current: !prev.current,
          }))
        }
        className="absolute right-3 top-1/2 -translate-y-1/2"
      >
        {showPasswords.current ? "👁️" : "👁️‍🗨️"}
      </button>
    </div>
  </div>
  {errors.currentPassword && (
    <p className="text-red-400 text-sm mt-2">{errors.currentPassword}</p>
  )}
  <button
  type="button"
  className="mt-2 text-[14px] opacity-90 text-blue-400 hover:text-blue-300"
  style={{
    fontFamily: "Urbanist, sans-serif",
    fontWeight: 400,
    lineHeight: "100%",
    marginLeft: "-59px",
    color: "#777777",
    opacity: 1,
  }}
>
  Forget password?
</button>

</div>


      {/* New Password */}
      <div className="mt-8 w-full flex flex-col items-center">
        <div
          className="flex items-center justify-center"
          style={{
            width: "572px",
            maxWidth: "90vw",
            height: "50px",
            gap: "24px",
            opacity: 1,
          }}
        >
          <label
            htmlFor="newPassword"
            className={`${theme.text}`}
            style={{
              whiteSpace: "nowrap",
              fontFamily: "Urbanist, sans-serif",
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "100%",
              display: "flex",
              alignItems: "center",
              minWidth: "150px",
            }}
          >
            New password
          </label>
          <div className="relative flex-1">
            <input
              type={showPasswords.new ? "text" : "password"}
              id="newPassword"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors((prev) => ({ ...prev, newPassword: "" }));
              }}
              className={`w-full border rounded-md ${theme.inputBg} ${theme.text} text-sm px-[20px] py-[10px] pr-10 ${
                errors.newPassword ? "border-red-500" : "border-gray-400"
              }`}
              style={{
                borderWidth: "0.5px",
                fontFamily: "Urbanist, sans-serif",
                fontSize: "14px",
                fontWeight: 400,
                lineHeight: "100%",
              }}
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswords((prev) => ({
                  ...prev,
                  new: !prev.new,
                }))
              }
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPasswords.new ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>
        {errors.newPassword && (
          <p className="text-red-400 text-sm mt-2">{errors.newPassword}</p>
        )}
        {newPassword && !errors.newPassword && (
          <div className="mt-2 text-left text-sm w-full max-w-md px-4">
            <p className="text-green-400 font-medium mb-1">Password requirements:</p>
            <ul className="text-xs space-y-1">
              <li className={validatePasswordStrength(newPassword).hasUppercase ? "text-green-400" : "text-gray-500"}>
                ✓ At least one uppercase letter
              </li>
              <li className={validatePasswordStrength(newPassword).hasLowercase ? "text-green-400" : "text-gray-500"}>
                ✓ At least one lowercase letter
              </li>
              <li className={validatePasswordStrength(newPassword).hasMinLength ? "text-green-400" : "text-gray-500"}>
                ✓ At least 6 characters
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="mt-8 w-full flex flex-col items-center">
        <div
          className="flex items-center justify-center"
          style={{
            width: "572px",
            maxWidth: "90vw",
            height: "50px",
            gap: "24px",
            opacity: 1,
          }}
        >
          <label
            htmlFor="confirmPassword"
            className={`${theme.text}`}
            style={{
              whiteSpace: "nowrap",
              fontFamily: "Urbanist, sans-serif",
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "100%",
              display: "flex",
              alignItems: "center",
              minWidth: "150px",
            }}
          >
            Confirm password
          </label>
          <div className="relative flex-1">
            <input
              type={showPasswords.confirm ? "text" : "password"}
              id="confirmPassword"
              placeholder="Re-enter the new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              className={`w-full border rounded-md ${theme.inputBg} ${theme.text} text-sm px-[20px] py-[10px] pr-10 ${
                errors.confirmPassword ? "border-red-500" : "border-gray-400"
              }`}
              style={{
                borderWidth: "0.5px",
                fontFamily: "Urbanist, sans-serif",
                fontSize: "14px",
                fontWeight: 400,
                lineHeight: "100%",
              }}
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswords((prev) => ({
                  ...prev,
                  confirm: !prev.confirm,
                }))
              }
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPasswords.confirm ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-400 text-sm mt-2">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Buttons Section */}
      <div
        className="flex justify-center mt-10"
        style={{ width: "100%", gap: "20px" }}
      >
        <button
          type="button"
          onClick={handleGoBack}
          disabled={loading}
          style={{
            width: "165px",
            height: "45px",
            borderRadius: "50px",
            background: "#44444D",
            boxShadow:
              "0px 0px 0px 1px rgba(8, 8, 8, 0.74), 0px 4px 6px 0px hsla(0, 21%, 6%, 0.53), inset 0px 9px 14px -5px rgba(36, 33, 33, 0.3)",
            color: "#eee7e7ff",
            fontFamily: "Urbanist, sans-serif",
            fontWeight: 400,
            cursor: loading ? "not-allowed" : "pointer",
            border: "none",
            opacity: loading ? 0.6 : 1,
          }}
        >
          Go Back
        </button>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "165px",
            height: "45px",
            borderRadius: "50px",
            background: loading ? "#8b8b96" : "var(--SecondaryBtnColor, #5E5CE6)",
            boxShadow:
              "0px 0px 0px 1px rgba(8, 8, 8, 0.74), 0px 4px 6px 0px hsla(0, 21%, 6%, 0.53), inset 0px 9px 14px -5px rgba(36, 33, 33, 0.3)",
            color: "#eee7e7ff",
            fontFamily: "Urbanist, sans-serif",
            fontWeight: 400,
            cursor: loading ? "not-allowed" : "pointer",
            border: "none",
          }}
        >
          {loading ? "Updating..." : "Change Password"}
        </button>
      </div>
    </form>
  );
};

const ChangeUserPassword = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleGoBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const theme = isDark
    ? {
        bg: "bg-[#212426]",
        text: "text-white",
        notificationShadow:
          "inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)",
        cardShadow:
          "inset 8px 8px 16px rgba(0,0,0,0.4), inset -8px -8px 16px rgba(60,60,60,0.1)",
        inputShadow:
          "inset 4px 4px 8px rgba(0,0,0,0.3), inset -4px -4px 8px rgba(60,60,60,0.1)",
        buttonShadow:
          "4px 4px 8px rgba(0,0,0,0.3), -4px -4px 8px rgba(60,60,60,0.1)",
        sidebarBg: "bg-[#1a1c1e]",
        inputBg: "bg-[#2a2d30]",
        borderColor: "border-slate-700",
        separatorColor: "rgba(255,255,255,0.3)",
      }
    : {
        bg: "bg-[#f0f2f5]",
        text: "text-gray-900",
        notificationShadow:
          "inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)",
        cardShadow:
          "inset 8px 8px 16px rgba(0,0,0,0.1), inset -8px -8px 16px rgba(255,255,255,0.8)",
        inputShadow:
          "inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.8)",
        buttonShadow:
          "4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.8)",
        sidebarBg: "bg-gray-50",
        inputBg: "bg-gray-50",
        borderColor: "border-gray-200",
        separatorColor: "rgba(255,255,255,0.3)",
      };

  return (
    <div
      className={`${theme.bg} ${theme.text} min-h-screen flex overflow-hidden transition-colors duration-300`}
    >
      <div
        className={`hidden lg:flex flex-col flex-shrink-0 ${theme.bg} transition-colors duration-300`}
      >
        <div
          className="flex items-center justify-center"
          style={{ height: HEADER_HEIGHT }}
        >
          <img src={WieLogo} alt="Wie Logo" className="w-10 h-10 lg:w-12 lg:h-12" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SideBar user={user} theme={theme} />
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <header
          className="flex items-center justify-between px-4 md:px-6"
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="flex items-center justify-between w-full lg:hidden">
            <button onClick={() => setIsMobileSidebarOpen(true)}>
              <img
                src={HandBurgerIcon}
                alt="Menu"
                className={`w-6 h-6 ${
                  isDark ? "filter brightness-0 invert" : ""
                }`}
              />
            </button>
            <img src={WieLogo} alt="Wie Logo" className="w-8 h-8" />
            <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
          </div>
          <div className="hidden lg:flex items-center gap-4 w-full">
            <div className="flex-1 min-w-0">
              <SearchBar
                theme={theme}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  style={{ boxShadow: theme.notificationShadow }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${theme.bg} transition-colors duration-300`}
                >
                  <img
                    src={NotificationIcon}
                    alt="Notification"
                    className={`w-4 h-4 ${
                      isDark
                        ? "filter brightness-0 invert"
                        : "filter brightness-0"
                    }`}
                  />
                </div>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  12
                </span>
              </div>
              <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-[1560px] mx-auto">
            <div
              className={`${theme.bg} transition-colors duration-300 flex flex-col lg:flex-row overflow-hidden`}
              style={{
                borderRadius: "50px",
                boxShadow:
                  "6px 6px 12px 0px rgba(0, 0, 0, 0.18) inset, -6px -6px 12px 0px rgba(255, 255, 255, 0.08) inset",
                minHeight: "808px",
              }}
            >
              <SettingsNavigation
                theme={theme}
                isDark={isDark}
                isMobile={isMobile}
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
              />

              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <ChangePasswordContent theme={theme} handleGoBack={handleGoBack} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
export default ChangeUserPassword;