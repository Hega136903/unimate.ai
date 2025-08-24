import dotenv from 'dotenv';
import path from 'path';

console.log('🚀 Initializing Environment Variables...');
const envPath = path.resolve(__dirname, '../../.env');
console.log(`📂 Attempting to load .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
  // Non-fatal in production: rely on platform-provided env vars
  console.warn('⚠️ .env file not found. Continuing with existing environment variables.');
} else {
  console.log('✅ .env file loaded successfully.');
}

console.log(`🔑 OPENAI_API_KEY is ${process.env.OPENAI_API_KEY ? 'loaded' : 'MISSING'}.`);
console.log(`🔑 GEMINI_API_KEY is ${process.env.GEMINI_API_KEY ? 'loaded' : 'MISSING'}.`);

// Do not exit if OpenAI key is missing; we can use Gemini or fallbacks
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY not set. The system will use Google Gemini or fallbacks.');
}
