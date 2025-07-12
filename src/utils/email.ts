import nodemailer from 'nodemailer';

// Create transporter for email sending (works with both Bun and Wrangler)
const createTransporter = () => {
  // Debug: Print environment variables

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials are not set in environment variables. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in wrangler.jsonc for Wrangler or .env for Bun.');
  }
  
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };
  
  console.log('SMTP Config:', { ...config, auth: { user: config.auth.user, pass: '[HIDDEN]' } });
  
  return nodemailer.createTransport(config);
};

export const sendEmail = async (to: string, subject: string, content: string, htmlContent?: string) => {
  try {
    console.log('Attempting to send email to:', to);
    console.log('Subject:', subject);
    
    const transporter = createTransporter();
    console.log('Transporter created successfully');
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@mob-esports.com',
      to,
      subject,
      text: content,
      html: htmlContent || content
    };

    console.log('Mail options prepared:', { to, subject, from: mailOptions.from });
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    return true;
  } catch (error: any) {
    console.error('Email sending failed with error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      command: error?.command
    });
    return false;
  }
};

export const sendVerificationEmail = async (to: string, verificationUrl: string) => {
  const subject = 'Verify Your Email - MOB Esports';
  const content = `Please click this link to verify your email: ${verificationUrl}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f34024;">MOB Esports - Email Verification</h2>
      <p>Hello!</p>
      <p>Please click the button below to verify your email address:</p>
      <a href="${verificationUrl}" 
         style="display: inline-block; background-color: #f34024; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
        Verify Email
      </a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>Best regards,<br>MOB Esports Team</p>
    </div>
  `;
  
  return sendEmail(to, subject, content, htmlContent);
};

export const sendPasswordResetEmail = async (to: string, otp: string) => {
  const subject = 'Password Reset - MOB Esports';
  const content = `Your OTP is: ${otp}. This will expire in 15 minutes.`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f34024;">MOB Esports - Password Reset</h2>
      <p>Hello!</p>
      <p>You requested a password reset. Use the following OTP to reset your password:</p>
      <div style="background-color: #f5f5f5; padding: 16px; text-align: center; border-radius: 4px; margin: 16px 0;">
        <h1 style="color: #f34024; margin: 0; font-size: 32px; letter-spacing: 4px;">${otp}</h1>
      </div>
      <p><strong>This OTP will expire in 15 minutes.</strong></p>
      <p>If you didn't request this password reset, please ignore this email.</p>
      <p>Best regards,<br>MOB Esports Team</p>
    </div>
  `;
  
  return sendEmail(to, subject, content, htmlContent);
}; 