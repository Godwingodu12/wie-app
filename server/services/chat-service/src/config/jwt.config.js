import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to .env
const envPath = path.resolve(__dirname, '../../.env');

// Load environment variables
const result = dotenv.config({ path: envPath });

// Optional debug (only if .env fails to load)
if (result.error) {
    console.error('❌ Failed to load .env file');
    console.error('📁 Expected path:', envPath);
    console.error(result.error);
}

// Validate JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET not found in environment variables');
    console.error('📁 Checked .env path:', envPath);
    console.error('💡 Make sure .env exists and contains: JWT_SECRET=your_secret');
    throw new Error('JWT_SECRET environment variable is not set');
}

// Export constant
export const JWT_SECRET = process.env.JWT_SECRET;