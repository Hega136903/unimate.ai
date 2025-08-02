# 📧 Gmail Setup Instructions for Unimate.AI

## 🎯 **Your Mission: Get Gmail App Password**

### Step 1: Enable 2-Factor Authentication
1. **Open**: https://myaccount.google.com/
2. **Click**: "Security" (left sidebar)
3. **Find**: "2-Step Verification" 
4. **Click**: "Get started"
5. **Follow prompts** with your phone number
6. **Complete setup** ✅

### Step 2: Generate App Password
1. **Go back to**: "Security" → "2-Step Verification"
2. **Scroll down** to "App passwords"
3. **Click**: "App passwords"
4. **Select app**: "Mail"
5. **Select device**: "Other (Custom name)"
6. **Enter**: "Unimate.AI"
7. **Click**: "Generate"
8. **COPY the password**: Example: `abcd efgh ijkl mnop`

### Step 3: Update Your .env File
**Edit**: `backend/.env`

**Replace this line**:
```bash
EMAIL_PASSWORD=paste-your-16-character-app-password-here
```

**With your actual password** (remove spaces):
```bash
EMAIL_PASSWORD=abcdefghijklmnop
```

### Step 4: Restart Backend Server
1. **Stop server**: Press `Ctrl+C` in terminal
2. **Restart**: 
   ```bash
   cd backend
   npm run dev
   ```

### Step 5: Test Real Emails!
1. **Go to**: http://localhost:3000
2. **Login** with your account
3. **Go to Schedule** section
4. **Click**: "🧪 Test" button
5. **Check your Gmail inbox**! 📧

## 🔒 **Security Notes**
- ✅ **Use App Password** (16 characters), NOT your regular Gmail password
- ✅ **Never share** this password
- ✅ **Keep .env file private** (it's in .gitignore)
- ✅ **Enable 2FA first** before generating app password

## 🐛 **Troubleshooting**

### "Invalid credentials" error:
- ✅ Use app password, not regular password
- ✅ Remove spaces from password
- ✅ Enable 2FA first

### "Connection timeout":
- ✅ Check internet connection
- ✅ Try again in a few minutes

### Still not working?
- ✅ Generate a new app password
- ✅ Make sure EMAIL_USER matches your Gmail exactly
- ✅ Restart backend server after changes

## 🎉 **When It Works**

You'll see in backend logs:
```
✅ Email service initialized successfully
📧 Email sent successfully to user@email.com
```

And you'll receive beautiful HTML emails! 📧✨

---

**Need help?** Check the backend terminal for detailed error messages.
