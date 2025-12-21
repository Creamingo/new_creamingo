# Email Service Setup Guide

The Refer & Earn system includes email functionality for sending referral invitations and milestone achievement notifications.

## Installation

To enable email functionality, install the `nodemailer` package:

```bash
cd backend
npm install nodemailer
```

## Configuration

Add the following environment variables to your `backend/.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

### Gmail Setup

If using Gmail, you'll need to:

1. Enable 2-Step Verification on your Google Account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in `SMTP_PASSWORD`

### Other Email Providers

For other email providers, adjust the SMTP settings:

- **Outlook/Hotmail**: `smtp-mail.outlook.com`, port `587`
- **Yahoo**: `smtp.mail.yahoo.com`, port `587`
- **Custom SMTP**: Use your provider's SMTP settings

## Email Templates

The system includes two email templates:

1. **Referral Email**: Sent when a user shares their referral code via email
   - Includes referral code and signup link
   - Highlights the ₹75 welcome bonus offer

2. **Milestone Achievement Email**: Sent when a user reaches a referral milestone
   - Congratulates the user
   - Shows milestone details and bonus amount
   - Includes link to wallet page

## Features

- ✅ Automatic milestone detection and email sending
- ✅ Branded HTML email templates
- ✅ Graceful fallback if email service is not configured
- ✅ Error handling that doesn't break referral functionality

## Testing

The email service will gracefully handle missing configuration:
- If `nodemailer` is not installed, emails are skipped (logged to console)
- If SMTP credentials are missing, emails are skipped (logged to console)
- Referral and milestone functionality continues to work without emails

## Notes

- Email sending is asynchronous and won't block referral/milestone processing
- Email failures are logged but don't affect the main functionality
- Templates are HTML-based and mobile-responsive

