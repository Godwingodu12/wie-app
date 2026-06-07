import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Startup verification
const cfg = cloudinary.config();
if (!cfg.api_key) {
  console.error('❌ Cloudinary NOT configured — check .env CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET');
} else {
  console.log(`✅ Cloudinary ready — cloud: ${cfg.cloud_name}`);
}

export default cloudinary;
