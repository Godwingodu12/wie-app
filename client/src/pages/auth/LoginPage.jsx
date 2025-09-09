import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginSuccess, setUser } from '../../features/auth/authSlice';
import { loginUser } from '../../services/authService';

// --- Icon Imports ---
import UserTopIcon from '../../assets/auth/user_top.svg';
import UserInputIcon from '../../assets/auth/user.svg';
import Logo from '../../assets/wie_logo.svg';
import PasswordInputIcon from '../../assets/auth/password.svg';
import bg from "../../assets/background.png";
import { FaFacebookF,FaXTwitter } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";

const LoginPage = () => {
  // --- Component State and Logic ---
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // This now calls the real loginUser service which makes an API request
      const res = await loginUser(formData); 
      dispatch(loginSuccess(res.token));
      dispatch(setUser(res.user));
      navigate('/home'); // or wherever you want to redirect after login
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ identifier: '', password: '' });
    setError('');
  }

  return (
    <div className="min-h-screen w-full font-sans text-white bg-cover" style={{ backgroundImage: `url(${bg})` }}>
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

            {error && (
              <div className="text-red-300 bg-red-500/20 border border-red-500/30 p-3 rounded-lg mb-4 text-center text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  required
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
                  required
                  placeholder="Password"
                  className="w-full bg-white/5 border border-white/20 rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-white/40"
                />
                <img src={PasswordInputIcon} alt="Password Icon" className="w-4 h-4 absolute right-4 cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
              </div>

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
                 <Link to="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-[#5E5CE6] hover:bg-opacity-80 text-white transition-colors"><RiInstagramFill/></Link>
            </div>
        </footer>
      </div>
    </div>
  );
};
export default LoginPage;
