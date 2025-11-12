-- Migration: 001_init.sql
-- Description: Initial schema for WIE User Service
-- Date: 2025-01-XX

-- Drop existing objects in correct order
DROP TRIGGER IF EXISTS update_wie_users_updated_at ON wie_users;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS otps CASCADE;
DROP TABLE IF EXISTS wie_users CASCADE;

-- Create wie_users table
CREATE TABLE wie_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  contact_no VARCHAR(20) UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  profile_picture TEXT,
  role VARCHAR(50) DEFAULT 'user',
  is_blocked BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_email_or_contact CHECK (
    email IS NOT NULL OR contact_no IS NOT NULL
  )
);

-- Create otps table (user_id as VARCHAR to support temporary IDs)
CREATE TABLE otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  otp_value VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_otps_user_id ON otps(user_id);
CREATE INDEX idx_otps_expires_at ON otps(expires_at);
CREATE INDEX idx_users_email ON wie_users(email);
CREATE INDEX idx_users_contact_no ON wie_users(contact_no);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for wie_users
CREATE TRIGGER update_wie_users_updated_at 
  BEFORE UPDATE ON wie_users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE wie_users IS 'Main user table for WIE authentication system';
COMMENT ON TABLE otps IS 'OTP storage table - supports both temporary and real user IDs';
COMMENT ON COLUMN otps.user_id IS 'Can be UUID (real user) or string (temp user during signup)';