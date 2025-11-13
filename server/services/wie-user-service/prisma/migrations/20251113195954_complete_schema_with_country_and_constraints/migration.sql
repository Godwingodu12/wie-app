
ALTER TABLE "otps" ADD COLUMN     "otp_type" VARCHAR(20) NOT NULL DEFAULT 'signup',
ADD COLUMN     "temp_id" VARCHAR(255),
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID;

-- AlterTable
ALTER TABLE "wie_users" ADD COLUMN     "country_id" UUID,
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "countries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "country_code" VARCHAR(10) NOT NULL,
    "country_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_country_code_key" ON "countries"("country_code");

-- CreateIndex
CREATE INDEX "idx_otps_user_id" ON "otps"("user_id");

-- CreateIndex
CREATE INDEX "idx_otps_temp_id" ON "otps"("temp_id");

-- AddForeignKey
ALTER TABLE "wie_users" ADD CONSTRAINT "wie_users_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "wie_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
