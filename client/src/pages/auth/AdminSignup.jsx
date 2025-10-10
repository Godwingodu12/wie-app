import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerAdmin } from "../../services/authService";

// --- Icon Imports ---
import UserTopIcon from "../../assets/auth/user_top.svg";
import FullnameIcon from "../../assets/auth/user.svg";
import EmailIcon from "../../assets/auth/email.svg";
import PhoneIcon from "../../assets/auth/phone.svg";
import PasswordInputIcon from "../../assets/auth/password.svg";
import Logo from "../../assets/wie_logo.svg";
import bg from "../../assets/background.png";
import { FaFacebookF, FaXTwitter } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";
import Alert from '../../components/Alert'; // <-- ADD THIS LINE

const RegisterPage = () => {
  // --- Component State and Logic ---
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact_no: "",
    password: "",
    confirm: "",
    image: null,
  });
const [preview, setPreview] = useState(null);
const [alert, setAlert] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);

const showAlert = (data) => setAlert({ ...data, show: true });
const hideAlert = () => setAlert(null);


const validateForm = () => {
    const { name, email, contact_no, password, confirm } = formData;

    if (!name.trim() || !email.trim() || !contact_no.trim() || !password || !confirm) {
        showAlert({ type: 'error', message: 'All Fields Required', description: 'Please fill in all the required fields.' });
        return false;
    }
    if (password !== confirm) {
        showAlert({ type: 'error', message: 'Validation Error', description: 'Passwords do not match.' });
        return false;
    }
    return true; // All checks passed
};

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setFormData({ ...formData, image: file });
      if (file) {
        setPreview(URL.createObjectURL(file));
      } else {
        setPreview(null);
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleClear = () => {
    setFormData({
      name: "",
      email: "",
      contact_no: "",
      password: "",
      confirm: "",
      image: null,
    });
    setPreview(null);
  };

const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return; // Stop if validation fails
    }

    setIsLoading(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("contact_no", formData.contact_no);
    data.append("password", formData.password);
    if (formData.image) {
        data.append("image", formData.image);
    }

    try {
        await registerAdmin(data);

        showAlert({
            type: 'success',
            message: 'Registration Successful!',
            description: 'Redirecting you to the OTP verification page.'
        });

        setTimeout(() => {
            navigate("/otp", {
                state: { email: formData.email, contact_no: formData.contact_no },
            });
        }, 1500); // 1.5-second delay

    } catch (err) {
        const errorMessage = err.response?.data?.message || "Registration failed";
        showAlert({ type: 'error', message: 'Registration Failed', description: errorMessage });
        setIsLoading(false); // Stop loading ONLY if there's an error
    }
};

  return (
    <div
      className="min-h-screen w-full font-sans text-white bg-cover bg-center"
      style={{
        backgroundImage: `url(${bg})`,
      }}
    >    <Alert alert={alert} onClose={hideAlert} /> {/* <-- ADD THIS LINE */}

      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-text-fill-color: #FFFFFF !important; /* Sets the autofilled text color to white */
          -webkit-box-shadow: 0 0 0 30px #1a1a1a inset !important; /* Creates a dark background */
          transition: background-color 5000s ease-in-out 0s; /* A trick to delay the browser's style override */
        }
      `}</style>
      <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-black/60">

        <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center md:px-12">
          <img src={Logo} alt="Wie Logo" className="h-8" />
          <Link
            to="/login"
            className="text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            Login
          </Link>
        </header>

        <main className="w-full max-w-lg bg-black/40 backdrop-blur-xl mt-16 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-block p-3 rounded-full">
                <img src={UserTopIcon} alt="User" className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold mt-4">
                Let’s create your account today!
              </h2>
              <p className="text-white/60 mt-2 text-sm">
                Join us and get started in seconds!
              </p>
            </div>

            

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Input */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  
                  placeholder="Full Name"
                  className="w-full bg-white/5 border border-white/20 rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-white/40"
                />
                <img
                  src={FullnameIcon}
                  alt="Fullname Icon"
                  className="w-4 h-4 absolute right-4 pointer-events-none"
                />
              </div>

              {/* Email Input */}
              <div className="relative flex items-center">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  
                  placeholder="Email ID"
                  className="w-full bg-white/5 border border-white/20 rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-white/40"
                />
                <img
                  src={EmailIcon}
                  alt="Email Icon"
                  className="w-4 h-4 absolute right-4 pointer-events-none"
                />
              </div>

              {/* Contact Input */}
              <div className="relative flex items-center">
                <input
                  type="tel"
                  name="contact_no"
                  value={formData.contact_no}
                  onChange={handleChange}
                  
                  placeholder="Contact number"
                  className="w-full bg-white/5 border border-white/20 rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-white/40"
                />
                <img
                  src={PhoneIcon}
                  alt="Contact Icon"
                  className="w-4 h-4 absolute right-4 pointer-events-none"
                />
              </div>

              {/* Password Input */}
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  
                  placeholder="Password"
                  className="w-full bg-white/5 border border-white/20 rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-white/40"
                />
                <img
                  src={PasswordInputIcon}
                  alt="Password Icon"
                  className="w-4 h-4 absolute right-4 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>

              {/* Confirm Password Input */}
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirm"
                  value={formData.confirm}
                  onChange={handleChange}
                  
                  placeholder="Confirm Password"
                  className="w-full bg-white/5 border border-white/20 rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-white/40"
                />
                <img
                  src={PasswordInputIcon}
                  alt="Password Icon"
                  className="w-4 h-4 absolute right-4 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>

              {/* Terms Checkbox */}
              <div className="flex justify-start items-center text-xs sm:text-sm text-white/60">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    
                    className="h-4 w-4 bg-transparent border-white/30 rounded text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                  />
                  I agree to the Terms of Services and Privacy Policy
                </label>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full bg-black/20 border border-white/20 rounded-full py-3 font-semibold hover:bg-black/40 transition-colors duration-300 disabled:opacity-50"
                  disabled={isLoading}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="w-full bg-[#6c56f8] rounded-full py-3 font-semibold hover:bg-[#5844d1] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Signup"
                  )}
                </button>
              </div>
            </form>
          </div>
          {/* Footer Link */}
          <div className="py-4 px-8 text-center text-sm">
            <p className="text-white/60">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-purple-400 hover:text-purple-300 "
              >
                Login
              </Link>
            </p>
          </div>
        </main>

        <footer className=" bottom-0 left-0 w-full p-6 py-2 flex justify-center md:justify-start md:px-12 items-center gap-4 text-white/80">
          <span className="text-sm">Follow us on:</span>
          <div className="flex gap-3">
            <Link
              to="#"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#5E5CE6] hover:bg-opacity-80 text-white transition-colors"
            >
              <FaXTwitter />
            </Link>
            <Link
              to="#"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#5E5CE6] hover:bg-opacity-80 text-white transition-colors"
            >
              <FaFacebookF />
            </Link>
            <Link
              to="https://www.instagram.com/sqaris.in?igsh=c2d1NTRpamQyYTJ6"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#5E5CE6] hover:bg-opacity-80 text-white transition-colors"
            >
              <RiInstagramFill />
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
};
export default RegisterPage;
