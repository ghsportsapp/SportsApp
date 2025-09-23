import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email template interface
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private fromAddress: string;

  constructor() {
    this.fromAddress = process.env.EMAIL_USER || 'noreply@sportsapp.com';
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Check if email is configured
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email service not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS environment variables.');
      return;
    }

    const config: EmailConfig = {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };

    this.transporter = nodemailer.createTransport(config);

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Email service configuration error:', error);
      } else {
        console.log('✅ Email service is ready to send messages');
      }
    });
  }

  // Password reset email template
  private getPasswordResetTemplate(resetLink: string, userEmail: string): EmailTemplate {
    const appName = 'SportsApp';
    const subject = `${appName} - Password Reset Request`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset - ${appName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background: #2563eb; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
              font-weight: bold;
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
            .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 ${appName}</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello,</p>
              <p>We received a request to reset the password for your ${appName} account associated with <strong>${userEmail}</strong>.</p>
              
              <p>Click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset My Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
                ${resetLink}
              </p>
              
              <div class="warning">
                <p><strong>⚠️ Important Security Information:</strong></p>
                <ul>
                  <li>This link will expire in <strong>1 hour</strong></li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>For your security, never share this link with anyone</li>
                </ul>
              </div>
              
              <div class="footer">
                <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
                <p>This is an automated email from ${appName}. Please do not reply to this email.</p>
                <p><strong>Need help?</strong> Contact our support team if you didn't request this password reset.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Password Reset Request - ${appName}

Hello,

We received a request to reset the password for your ${appName} account associated with ${userEmail}.

To reset your password, please visit the following link:
${resetLink}

IMPORTANT:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- For your security, never share this link with anyone

If you're having trouble with the link, copy and paste the entire URL into your web browser.

This is an automated email from ${appName}. Please do not reply to this email.

Need help? Contact our support team if you didn't request this password reset.
    `;

    return { subject, html, text };
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail: string, resetToken: string, baseUrl?: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not configured');
      return false;
    }

    try {
      // Use the provided baseUrl (from request) or fallback to localhost for development
      const appBaseUrl = baseUrl || 'http://localhost:5000';
      
      const resetLink = `${appBaseUrl}/reset-password?token=${resetToken}`;
      
      const template = this.getPasswordResetTemplate(resetLink, userEmail);

      const mailOptions = {
        from: `"SportsApp" <${this.fromAddress}>`,
        to: userEmail,
        subject: template.subject,
        text: template.text,
        html: template.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent successfully:', result.messageId);
      console.log(`🔗 Reset link: ${resetLink}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return false;
    }
  }

  // Test email configuration
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Email service connection test failed:', error);
      return false;
    }
  }

  // Send test email
  async sendTestEmail(toEmail: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: `"SportsApp Test" <${this.fromAddress}>`,
        to: toEmail,
        subject: 'SportsApp Email Service Test',
        text: 'This is a test email from SportsApp. If you received this, the email service is working correctly!',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>🏆 SportsApp Email Test</h2>
            <p>This is a test email from SportsApp.</p>
            <p>If you received this, the email service is working correctly! ✅</p>
            <p><em>Sent at: ${new Date().toLocaleString()}</em></p>
          </div>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully:', result.messageId);
      return true;

    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      return false;
    }
  }
}

// Create singleton instance
export const emailService = new EmailService();

// Export types for use in other modules
export type { EmailConfig, EmailTemplate };