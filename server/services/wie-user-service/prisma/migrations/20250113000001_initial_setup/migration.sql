-- CreateTable
CREATE TABLE "wie_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255),
    "contact_no" VARCHAR(20),
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "profile_picture" TEXT,
    "role" VARCHAR(50) NOT NULL DEFAULT 'user',
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wie_users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "check_email_or_contact" CHECK (email IS NOT NULL OR contact_no IS NOT NULL)
);

-- CreateTable
CREATE TABLE "otps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR(255) NOT NULL,
    "otp_value" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wie_users_email_key" ON "wie_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wie_users_contact_no_key" ON "wie_users"("contact_no");

-- CreateIndex
CREATE INDEX "idx_otps_user_id" ON "otps"("user_id");

-- CreateIndex
CREATE INDEX "idx_otps_expires_at" ON "otps"("expires_at");

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