# 🚀 Quick Email Setup for Unimate.AI

## Step 1: Get Gmail App Password

### Option A: Gmail (Recommended)
1. **Enable 2-Factor Authentication:**
   - Go to [Google Account](https://myaccount.google.com/)
   - Security → 2-Step Verification → Turn On

2. **Generate App Password:**
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Unimate.AI"
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Option B: Outlook
1. Go to [Outlook Security](https://account.live.com/proofs/Manage)
2. Enable 2-factor authentication
3. Generate app password for "Mail"

## Step 2: Update Your .env File

Edit `backend/.env` and replace these lines:

```bash
# Replace with your actual email
EMAIL_USER=your-actual-email@gmail.com

# Replace with your 16-character app password (no spaces)
EMAIL_PASSWORD=abcdefghijklmnop
```

## Step 3: Test the Configuration

1. **Save the .env file**
2. **Restart your backend server:**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart:
   cd backend
   npm run dev
   ```

3. **Check logs** - you should see:
   ```
   ✅ Email service initialized successfully
   ```

4. **Test in browser:**
   - Go to http://localhost:3000
   - Navigate to Schedule section
   - Click "🧪 Test" button
   - Check your email inbox!

## Step 4: Example Working Configuration

```bash
# Working example (replace with your details):
EMAIL_SERVICE=gmail
EMAIL_USER=yourname@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=noreply@unimate.ai
FRONTEND_URL=http://localhost:3000
```

## 🔒 Security Tips

- ✅ Use App Passwords, never your regular password
- ✅ Keep .env files private (already in .gitignore)
- ✅ Enable 2-Factor Authentication first
- ❌ Never commit real credentials to git

## 🐛 Troubleshooting

**"Email configuration not found"**
→ Check .env file has EMAIL_USER and EMAIL_PASSWORD

**"Authentication failed"**
→ Use App Password, not regular password
→ Remove any spaces from the password

**"Connection timeout"**
→ Check internet connection
→ Try different email service

## 🎯 Next Steps

Once configured, you'll have:
- ✅ Beautiful HTML email alerts
- ✅ Automatic deadline notifications
- ✅ Manual "Email Me" buttons
- ✅ Professional email templates

Ready to never miss a deadline again! 🎓📧
