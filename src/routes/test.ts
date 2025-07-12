import { Hono } from 'hono';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';

const test = new Hono();

// Test email sending (development only)
test.post('/send-verification', async (c) => {
  if (process.env.NODE_ENV === 'production') {
    return c.json({ status: false, error: 'Test endpoints not available in production' }, 403);
  }

  const { email } = await c.req.json();
  if (!email) {
    return c.json({ status: false, error: 'Email is required' }, 400);
  }

  try {
    const verificationUrl = 'http://localhost:3000/verify-email?token=test-token-123';
    const success = await sendVerificationEmail(email, verificationUrl);
    
    if (success) {
      return c.json({ status: true, message: 'Test verification email sent successfully' });
    } else {
      return c.json({ status: false, error: 'Failed to send test email' }, 500);
    }
  } catch (error) {
    console.error('Test email error:', error);
    return c.json({ status: false, error: 'Email sending failed' }, 500);
  }
});

test.post('/send-password-reset', async (c) => {
  if (process.env.NODE_ENV === 'production') {
    return c.json({ status: false, error: 'Test endpoints not available in production' }, 403);
  }

  const { email } = await c.req.json();
  if (!email) {
    return c.json({ status: false, error: 'Email is required' }, 400);
  }

  try {
    const otp = '123456';
    const success = await sendPasswordResetEmail(email, otp);
    
    if (success) {
      return c.json({ status: true, message: 'Test password reset email sent successfully' });
    } else {
      return c.json({ status: false, error: 'Failed to send test email' }, 500);
    }
  } catch (error) {
    console.error('Test email error:', error);
    return c.json({ status: false, error: 'Email sending failed' }, 500);
  }
});

export default test; 