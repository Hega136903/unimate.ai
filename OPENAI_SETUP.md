# 🤖 OpenAI API Setup Guide for Unimate.AI

## Step 1: Get Your OpenAI API Key

1. **Go to OpenAI Platform**: https://platform.openai.com/api-keys
2. **Sign Up/Login**: Create an account or log in to your existing account
3. **Create API Key**: 
   - Click "Create new secret key"
   - Give it a name like "Unimate-AI-Development" 
   - Copy the API key (starts with `sk-...`)

## Step 2: Add API Key to Backend

1. **Open**: `backend/.env` file
2. **Replace**: `your-openai-api-key-here` with your actual API key
3. **Example**:
   ```
   OPENAI_API_KEY=sk-proj-abc123...your-actual-key-here
   ```

## Step 3: Restart Backend Server

```bash
cd backend
npm start
```

## Step 4: Test Real AI

1. Go to: http://localhost:3000
2. Click: "💬 AI Chat"
3. Ask: "Explain machine learning in simple terms"
4. You'll get real OpenAI-powered responses!

## 💰 OpenAI Pricing (Very Affordable for Testing)

- **GPT-3.5-turbo**: $0.50 per 1M input tokens, $1.50 per 1M output tokens
- **For testing**: A few dollars will last for thousands of conversations
- **Free tier**: New accounts often get free credits

## 🔒 Security Notes

- Never commit your API key to git
- The `.env` file is already in `.gitignore`
- Keep your API key secure and don't share it

## 📊 Usage Monitoring

- Monitor usage at: https://platform.openai.com/usage
- Set usage limits to control costs
- Start with a low limit for testing ($5-10)

## Alternative: Free Testing

If you don't want to use OpenAI yet, the system will use intelligent fallback responses that provide helpful study advice without API costs.
