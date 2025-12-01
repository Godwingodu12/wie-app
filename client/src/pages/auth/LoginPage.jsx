import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginSuccess, setUser } from '../../features/auth/authSlice';
import { loginUser } from '../../services/authService';


import Alert from '../../components/Alert'; // <-- ADD THIS LINE

// --- Icon Imports ---
import UserTopIcon from '../../assets/auth/user_top.svg';
import UserInputIcon from '../../assets/auth/user.svg';
import Logo from '../../assets/wie_logo.svg';
import PasswordInputIcon from '../../assets/auth/password.svg';
import bg from "../../assets/background.png";
import { FaEye, FaEyeDropper, FaEyeLowVision, FaEyeSlash, FaFacebookF,FaXTwitter } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";



const LoginPage = () => {
  // --- Component State and Logic ---
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [alert, setAlert] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);

const showAlert = (data) => setAlert({ ...data, show: true });
const hideAlert = () => setAlert(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    if (!formData.identifier.trim()) {
        showAlert({ type: 'error', message: 'Input Required', description: 'Please enter your username, email, or contact number.' });
        return false;
    }
    if (!formData.password) {
        showAlert({ type: 'error', message: 'Input Required', description: 'Please enter your password.' });
        return false;
    }
    return true;
};

const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return; // Stop if validation fails
    }

    setIsLoading(true);

    try {
        const res = await loginUser(formData); 
          

        showAlert({
            type: 'success',
            message: 'Login Successful!',
            description: 'Redirecting you to your dashboard.'
        });

        setTimeout(() => {
            dispatch(loginSuccess(res.token)); // MOVED inside setTimeout
            dispatch(setUser(res.user));       // MOVED inside setTimeout
            navigate('/home');                  // Stays inside setTimeout
        }, 1500);

    } catch (err) {
        const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
        showAlert({ type: 'error', message: 'Login Failed', description: errorMessage });
        setIsLoading(false); // Stop loading only on error
    }
};

  const handleClear = () => {
    setFormData({ identifier: '', password: '' });
  }

  return (
    <div className="min-h-screen w-full font-sans text-white bg-cover" style={{ backgroundImage: `url(${bg})` }}>
          <Alert alert={alert} onClose={hideAlert} /> 

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
      <div className="min-h-screen w-full flex flex-col justify-center items-center p-2 bg-black/60">
        
        <header className="absolute top-0 left-0 w-full p-4 flex justify-between items-center md:px-8">
          <div>
            <img src={Logo} alt="Wie Logo" className="h-10"/>
          </div>
          <Link to="/login" className="text-white/80 hover:text-white transition-colors text-sm font-medium">Login</Link>
        </header>

        <main className="w-full max-w-lg bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-block p-3 rounded-full mb-4">
                <img src={UserTopIcon} alt="User" className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold">Login</h2>
              <p className="text-white/60 mt-2 text-sm">
                Log in to continue managing your events, your team, and your success.
              </p>
            </div>

            

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  
                  placeholder="Username, Email or Contact"
                  className="w-full bg-white/5 border border-white/20 rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-white/40"
                />
                 <img src={UserInputIcon} alt="User Icon" className="w-4 h-4 absolute right-4 pointer-events-none"/>
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
                <div 
        className="absolute right-4 cursor-pointer text-white/60 hover:text-white transition-colors"
        onClick={() => setShowPassword(!showPassword)}
    >
        {showPassword ? (
            <FaEye />
        ) : (
            <FaEyeSlash />
        )}
    </div>              </div>

              <div className="flex justify-between items-center text-xs sm:text-sm text-white/60">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="h-4 w-4 bg-transparent border-white/30 rounded text-purple-500 focus:ring-purple-500 focus:ring-offset-0" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="hover:underline hover:text-white">Forgot password?</Link>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full bg-black/20 border border-white/20 rounded-3xl py-3 font-semibold hover:bg-black/40 transition-colors duration-300 disabled:opacity-50"
                  disabled={isLoading}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="w-full bg-[#5E5CE6] rounded-3xl py-3 font-semibold hover:bg-[#5844d1] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Login'
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="bg-black/30 py-4 px-8 text-center text-sm">
            <p className="text-white/60">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-purple-400 hover:text-purple-300 hover:underline">
                Signup
              </Link>
            </p>
          </div>
        </main>
        
        <footer className="absolute bottom-0 left-0 w-full p-4 py-2 flex justify-center md:justify-start md:px-8 items-center gap-4 text-white/80">
            <span className="text-sm">Follow us on:</span>
            <div className="flex gap-3">
                 <Link to="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-[#5E5CE6] hover:bg-opacity-80 text-white transition-colors"><FaXTwitter/></Link>
                 <Link to="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-[#5E5CE6] hover:bg-opacity-80 text-white transition-colors"><FaFacebookF/></Link>
                 <Link to="https://www.instagram.com/sqaris.in?igsh=c2d1NTRpamQyYTJ6" className="w-8 h-8 flex items-center justify-center rounded-full bg-[#5E5CE6] hover:bg-opacity-80 text-white transition-colors"><RiInstagramFill/></Link>
            </div>
        </footer>
      </div>
    </div>
  );
};
export default LoginPage;
