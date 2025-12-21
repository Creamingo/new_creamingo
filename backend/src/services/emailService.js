// Email service for sending referral and milestone emails
// Note: Requires nodemailer package - install with: npm install nodemailer

let nodemailer = null;
let emailConfigured = false;

// Try to load nodemailer (optional dependency)
try {
  nodemailer = require('nodemailer');
  emailConfigured = true;
} catch (error) {
  console.log('Nodemailer not installed. Email functionality will be disabled.');
  console.log('To enable emails, install: npm install nodemailer');
  emailConfigured = false;
}

// Email configuration (from environment variables)
const getEmailConfig = () => {
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || ''
    }
  };
};

// Create email transporter
const createTransporter = () => {
  if (!emailConfigured || !nodemailer) {
    return null;
  }

  const config = getEmailConfig();
  
  if (!config.auth.user || !config.auth.pass) {
    console.log('Email not configured. Set SMTP_USER and SMTP_PASSWORD environment variables.');
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth
  });
};

// Generate referral email HTML template
const generateReferralEmailTemplate = (referrerName, referralCode, referralLink) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join Creamingo with My Referral Code!</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎉 Join Creamingo!</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Get ₹50 Welcome Bonus + ₹25 Extra!</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi there!
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                <strong>${referrerName}</strong> has invited you to join <strong>Creamingo</strong> - your favorite cake ordering platform!
              </p>
              
              <div style="background-color: #fef3f2; border-left: 4px solid #ec4899; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="color: #333333; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">✨ Special Offer for You:</p>
                <ul style="color: #333333; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>₹50 Welcome Bonus when you sign up</li>
                  <li>₹25 Extra Bonus for using the referral code</li>
                  <li>Total: <strong>₹75</strong> in your wallet!</li>
                </ul>
              </div>
              
              <div style="background-color: #f9fafb; border: 2px solid #ec4899; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
                <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Referral Code</p>
                <p style="color: #ec4899; font-size: 32px; font-weight: bold; font-family: monospace; margin: 0; letter-spacing: 3px;">
                  ${referralCode}
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${referralLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);">
                  Sign Up Now & Claim Your Bonus
                </a>
              </div>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                <strong>How it works:</strong><br>
                1. Click the button above or use the referral code: <strong>${referralCode}</strong><br>
                2. Sign up for a new account<br>
                3. Get ₹75 instantly in your wallet!<br>
                4. When you complete your first order, ${referrerName} will also get ₹50!
              </p>
              
              <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                This referral link is valid and can be used by anyone you share it with.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                <strong>Creamingo</strong> - Delicious Cakes Delivered to Your Door
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Asuran Chowk, Gorakhpur, UP | info@creamingo.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

// Generate milestone achievement email HTML template
const generateMilestoneEmailTemplate = (customerName, milestone, totalEarned) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Milestone Achieved - ${milestone.name}!</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎉 Milestone Achieved!</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">${milestone.name}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Congratulations <strong>${customerName}</strong>! 🎊
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                You've reached an amazing milestone: <strong>${milestone.name}</strong>!
              </p>
              
              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="color: #333333; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">🏆 Your Achievement:</p>
                <ul style="color: #333333; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Completed <strong>${milestone.referrals} referrals</strong></li>
                  <li>Milestone Reward: <strong>₹${milestone.bonus}</strong></li>
                  <li>Total Milestone Earnings: <strong>₹${totalEarned}</strong></li>
                </ul>
              </div>
              
              <div style="background-color: #f9fafb; border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
                <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Bonus Credited</p>
                <p style="color: #10b981; font-size: 36px; font-weight: bold; margin: 0;">
                  ₹${milestone.bonus}
                </p>
                <p style="color: #666666; font-size: 14px; margin: 10px 0 0 0;">
                  Added to your wallet balance
                </p>
              </div>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                Keep sharing and earning! Your next milestone is just around the corner. 🚀
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet" 
                   style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                  View Your Wallet
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                <strong>Creamingo</strong> - Delicious Cakes Delivered to Your Door
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Asuran Chowk, Gorakhpur, UP | info@creamingo.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

// Send referral email
const sendReferralEmail = async (toEmail, referrerName, referralCode, referralLink) => {
  if (!emailConfigured) {
    console.log('Email service not configured. Skipping referral email to:', toEmail);
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, message: 'Email transporter not available' };
    }

    const mailOptions = {
      from: `"Creamingo" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `${referrerName} invited you to join Creamingo - Get ₹75 Bonus!`,
      html: generateReferralEmailTemplate(referrerName, referralCode, referralLink),
      text: `${referrerName} has invited you to join Creamingo! Use referral code ${referralCode} to get ₹50 welcome bonus + ₹25 extra. Sign up here: ${referralLink}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Referral email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Send referral email error:', error);
    return { success: false, message: error.message };
  }
};

// Send milestone achievement email
const sendMilestoneEmail = async (toEmail, customerName, milestone, totalEarned) => {
  if (!emailConfigured) {
    console.log('Email service not configured. Skipping milestone email to:', toEmail);
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, message: 'Email transporter not available' };
    }

    const mailOptions = {
      from: `"Creamingo" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `🎉 Milestone Achieved: ${milestone.name} - ₹${milestone.bonus} Bonus!`,
      html: generateMilestoneEmailTemplate(customerName, milestone, totalEarned),
      text: `Congratulations ${customerName}! You've achieved the ${milestone.name} milestone and earned ₹${milestone.bonus} bonus! Total milestone earnings: ₹${totalEarned}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Milestone email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Send milestone email error:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  sendReferralEmail,
  sendMilestoneEmail,
  emailConfigured
};

