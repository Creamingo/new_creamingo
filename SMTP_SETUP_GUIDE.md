# 📧 SMTP Configuration Guide - Complete Step-by-Step

## What is SMTP?

**SMTP** (Simple Mail Transfer Protocol) is the standard protocol used to send emails. Think of it as the "postal service" for emails - it's how your application communicates with email servers to send messages.

### Why Do We Need It?

Without SMTP configuration, your application cannot send emails. The Refer & Earn system needs SMTP to:
- Send referral invitation emails to friends
- Send milestone achievement notifications
- Send other automated emails

**Good News:** The system works perfectly fine without emails! Emails are optional. If SMTP is not configured, the system will just skip sending emails and continue working normally.

---

## 🚀 Quick Setup (Gmail - Recommended for Testing)

### Step 1: Install Nodemailer Package

```bash
cd backend
npm install nodemailer
```

### Step 2: Enable 2-Step Verification on Gmail

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on **Security** (left sidebar)
3. Under "Signing in to Google", find **2-Step Verification**
4. Click **Get Started** and follow the prompts to enable it
5. You'll need your phone to verify

### Step 3: Generate App Password

1. Go back to [Google Account Settings](https://myaccount.google.com/)
2. Click **Security** → **2-Step Verification**
3. Scroll down and click **App passwords**
4. You may need to sign in again
5. Under "Select app", choose **Mail**
6. Under "Select device", choose **Other (Custom name)**
7. Type: **Creamingo Backend**
8. Click **Generate**
9. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

⚠️ **Important:** This password is shown only once! Copy it immediately.

### Step 4: Update Your .env File

Open `backend/.env` (create it if it doesn't exist) and add:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

**Replace:**
- `your-email@gmail.com` with your actual Gmail address
- `abcd efgh ijkl mnop` with the app password you generated (remove spaces or keep them, both work)

### Step 5: Restart Your Backend Server

```bash
# Stop your server (Ctrl+C) and restart
npm run dev
```

### Step 6: Test It!

The system will automatically try to send emails when:
- A user reaches a milestone
- A user shares their referral code via email

Check your backend console logs - you should see:
- ✅ `Referral email sent: [message-id]` (if successful)
- ⚠️ `Email service not configured` (if not set up - this is OK!)

---

## 📋 Alternative Email Providers

### Option 1: Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

**Note:** For Outlook, you may need to enable "Less secure app access" or use an app password.

### Option 2: Yahoo Mail

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
```

**Note:** Yahoo also requires app password generation (similar to Gmail).

### Option 3: Custom SMTP Server

If you have your own email server or use a service like SendGrid, Mailgun, etc.:

```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASSWORD=your-password
```

---

## 🔍 Troubleshooting

### Problem: "Email service not configured"

**Solution:** This is normal if you haven't set up SMTP. The system will continue working without emails.

### Problem: "Authentication failed"

**Possible causes:**
1. ❌ Wrong email or password
2. ❌ Using regular password instead of app password (for Gmail)
3. ❌ 2-Step Verification not enabled (for Gmail)
4. ❌ App password not generated correctly

**Solution:**
- Double-check your credentials
- For Gmail: Make sure you're using an **App Password**, not your regular password
- Regenerate the app password if needed

### Problem: "Connection timeout"

**Possible causes:**
1. ❌ Wrong SMTP host
2. ❌ Wrong port number
3. ❌ Firewall blocking the connection

**Solution:**
- Verify SMTP settings for your email provider
- Check if port 587 is open
- Try port 465 with `SMTP_SECURE=true`

### Problem: Emails going to spam

**Solution:**
- This is normal for automated emails
- Use a professional email service (SendGrid, Mailgun) for production
- Add SPF/DKIM records to your domain

---

## ✅ Verification Checklist

- [ ] Nodemailer package installed (`npm install nodemailer`)
- [ ] `.env` file created in `backend/` directory
- [ ] SMTP credentials added to `.env`
- [ ] App password generated (for Gmail/Outlook/Yahoo)
- [ ] Backend server restarted
- [ ] No errors in console when server starts

---

## 🎯 What Happens Without SMTP?

**Don't worry!** If SMTP is not configured:
- ✅ Referral system works perfectly
- ✅ Milestones are tracked and bonuses are awarded
- ✅ All features function normally
- ⚠️ Only emails won't be sent (but you'll see logs in console)

The system is designed to work gracefully without email configuration.

---

## 📝 Example .env File

Here's a complete example of what your `backend/.env` should look like:

```env
# Database Configuration (SQLite)
DB_PATH=./database/creamingo.db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Email Configuration (SMTP) - OPTIONAL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password-here

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

---

## 🚨 Security Notes

1. **Never commit `.env` to Git** - It contains sensitive passwords
2. **Use App Passwords** - Don't use your main email password
3. **Keep App Passwords secret** - Treat them like passwords
4. **For Production** - Consider using professional email services like:
   - SendGrid (free tier: 100 emails/day)
   - Mailgun (free tier: 5,000 emails/month)
   - AWS SES (very affordable)

---

## 💡 Pro Tips

1. **For Development:** Gmail works great for testing
2. **For Production:** Use a professional email service (SendGrid, Mailgun)
3. **Testing:** Send a test email to yourself first
4. **Monitoring:** Check backend logs to see if emails are being sent
5. **Rate Limits:** Gmail has limits (~500 emails/day for free accounts)

---

## 📞 Need Help?

If you're stuck:
1. Check backend console logs for error messages
2. Verify all SMTP settings are correct
3. Test with a different email provider
4. Remember: Emails are optional - the system works without them!

---

**That's it!** Your SMTP configuration is now complete. The system will automatically send emails when milestones are achieved or when users share referral codes via email.

