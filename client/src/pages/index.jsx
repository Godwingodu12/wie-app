import React from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

const index = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/register');
  };
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">Welcome to WIE Creators</h1>
        <p className="hero-subtitle">Your creative platform for amazing content</p>
        
        <div className="auth-buttons">
          <button className="btn btn-primary" onClick={handleLogin}>
            Login
          </button>
          <button className="btn btn-secondary" onClick={handleSignup}>
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};
export default index;