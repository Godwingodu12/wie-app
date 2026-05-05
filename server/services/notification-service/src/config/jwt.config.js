import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from notification-service root
dotenv.config({
    path: path.resolve(__dirname, '../../.env')
});

// Debug (remove after confirming)
if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET not found');
    console.error('📁 Expected .env at:', path.resolve(__dirname, '../../.env'));
    console.error('🔍 Current value:', process.env.JWT_SECRET);
    throw new Error('JWT_SECRET environment variable is not set');
}

// Export constant
export const JWT_SECRET = process.env.JWT_SECRET;