import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the service root
dotenv.config({ path: path.join(__dirname, "../../.env") });

const requiredEnvVars = ["MONGODB_URI"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  WARNING: ${envVar} is not defined in .env`);
  }
}

export default process.env;
