import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerOrganisation } from "../../services/authService";

// --- Icon Imports ---
import FullnameIcon from "../../assets/auth/user.svg";
import EmailIcon from "../../assets/auth/email.svg";
import PhoneIcon from "../../assets/auth/phone.svg";
import AddressIcon from "../../assets/auth/address.svg";
import PasswordInputIcon from "../../assets/auth/password.svg";
import Top from "../../assets/auth/org_top.svg";
import Logo from "../../assets/wie_logo.svg";
import bg from "../../assets/background.png";
import { FaFacebookF, FaXTwitter } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";
import CustomSelectStyles from "../../components/CreateGroup/CustomSelectStyles";
import Alert from '../../components/Alert';
import Select from "react-select";
const organisationTypeOptions = [
  { value: 'Private', label: 'Private Limited' },
  { value: 'Government', label: 'Public Limited' },
  { value: 'Partnership', label: 'Partnership' },
  { value: 'Proprietorship', label: 'Proprietorship' },
  { value: 'LLP', label: 'LLP' },
  { value: 'NGO', label: 'NGO' },
  { value: 'Educational', label: 'Educational' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Non-profit', label: 'Non-profit' },
  { value: 'Non-profit', label: 'Trust' },
  { value: 'Non-profit', label: 'Society' },
  { value: 'Other', label: 'Other' }
];
const OrganisationSignup = () => {
  // --- Component State and Logic ---
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact_no: "",
    organisation_type: "",
    address: "",
    password: "",
    confirm: "",
  });
  const [alert, setAlert] = useState(null); // <-- ADD THIS
const [isLoading, setIsLoading] = useState(false);
const [errors, setErrors] = useState({});

const showAlert = (data) => setAlert({ ...data, show: true });
const hideAlert = () => setAlert(null);
 const handleSelectChange = (selectedOption, { name }) => {
        setFormData(prev => ({
            ...prev,
            [name]: selectedOption ? selectedOption.value : ''
        }));
    };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleClear = () => {
    setFormData({
      name: "",
      email: "",
      contact_no: "",
      organisation_type: "",
      address: "",
      password: "",
      confirm: "",
    });
        setErrors({}); // <-- Update this line

    
  };
  const validateForm = () => {
    const { name, email, contact_no, organisation_type, address, password, confirm } = formData;

    if (!name.trim()) {
        showAlert({ type: 'error', message: 'Validation Error', description: 'Organisation name is required.' });
        return false;
    }
    if (!organisation_type) {
        showAlert({ type: 'error', message: 'Validation Error', description: 'Please select an organisation type.' });
        return false;
    }
    if (!address.trim()) {
        showAlert({ type: 'error', message: 'Validation Error', description: 'Official address is required.' });
        return false;
    }
    if (!contact_no.trim()) {
        showAlert({ type: 'error', message: 'Validation Error', description: 'Contact number is required.' });
        return false;
    }
    if (!email.trim()) {
        showAlert({ type: 'error', message: 'Validation Error', description: 'Email ID is required.' });
        return false;
    }
    if (!password) {
        showAlert({ type: 'error', message: 'Validation Error', description: 'Password is required.' });
        return false;
    }
    if (password !== confirm) {
        showAlert({ type: 'error', message: 'Validation Error', description: 'Passwords do not match.' });
        return false;
    }

    return true; // All checks passed
};

const handleSubmit = async (e) => {
    e.preventDefault();

    // The validation function you added
    if (!validateForm()) {
        return;
    }
    
    setIsLoading(true);
    const data = {
        name: formData.name,
        email: formData.email,
        contact_no: formData.contact_no,
        organisation_type: formData.organisation_type,
        address: formData.address,
        password: formData.password,
    };

    try {
        // This is your successful API call
        await registerOrganisation(data);
        
        // --- ADD THIS SUCCESS ALERT ---
        showAlert({
            type: 'success',
            message: 'Registration Successful!',
            description: 'Redirecting you to the OTP verification page.'
        });

        // --- ADD A DELAY BEFORE NAVIGATING ---
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
    // Note: We remove setIsLoading(false) from a 'finally' block because
    // on success, the component will navigate away anyway.
};

  return (
    <div
      className="min-h-screen w-full font-sans text-white bg-cover bg-center"
      style={{
        backgroundImage: `url(${bg})`,
      }}
      
    >
          <Alert alert={alert} onClose={hideAlert} /> {/* <-- ADD THIS LINE */}

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
            to="/register"
            className="text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            SignUp
          </Link>
        </header>

        <main className="w-full max-w-lg bg-black/40 backdrop-blur-xl mt-16 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-block p-3 rounded-full">
                <img src={Top} alt="Organisation Icon" className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold mt-4">
                Let’s create your account today!
              </h2>
              <p className="text-white/60 mt-2 text-sm">
                Join us and get started in seconds!
              </p>
            </div>

            

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Organisation Name Input */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Organisation Name"
                  className="w-full bg-white/5 border border-white/20 rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-white/40"
                />
                <img
                  src={FullnameIcon}
                  alt="Name Icon"
                  className="w-4 h-4 absolute right-4 pointer-events-none"
                />
              </div>

              {/* Organisation Type Select */}
              <div>

    <Select
        name="organisation_type"
        options={organisationTypeOptions}
        value={organisationTypeOptions.find(option => option.value === formData.organisation_type)}
        onChange={handleSelectChange}
        placeholder="Select your organization type"
styles={CustomSelectStyles(true, errors)}
        
    />
    {errors.organisation_type && <p className="text-red-500 text-sm mt-1">{errors.organisation_type}</p>}
</div>

              {/* Address Input */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Official Address"
                  className="w-full bg-white/5 border border-white/20 rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-white/40"
                />
                <img
                  src={AddressIcon}
                  alt="Address Icon"
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

              {/* Password Input */}
              <div className="relative flex items-center">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full bg-white/5 border border-white/20 rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-white/40"
                />
                <img
                  src={PasswordInputIcon}
                  alt="Password Icon"
                  className="w-4 h-4 absolute right-4 pointer-events-none"
                />
              </div>

              {/* Confirm Password Input */}
              <div className="relative flex items-center">
                <input
                  type="password"
                  name="confirm"
                  value={formData.confirm}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  className="w-full bg-white/5 border border-white/20 rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-white/40"
                />
                <img
                  src={PasswordInputIcon}
                  alt="Password Icon"
                  className="w-4 h-4 absolute right-4 pointer-events-none"
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

        <footer className=" bottom-0 left-0 w-full p-6 flex py-2 justify-center md:justify-start md:px-12 items-center gap-4 text-white/80">
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
export default OrganisationSignup;

