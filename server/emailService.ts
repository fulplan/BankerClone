import { storage } from "./storage";
import type { InsertEmailNotification } from "@shared/schema";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  userId?: string;
}

export class EmailService {
  private apiKey: string;
  private baseUrl = 'https://api.resend.com';

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || '';
    if (!this.apiKey) {
      console.warn('No email API key provided. Email notifications will be logged but not sent.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Log email notification to database
      if (options.userId) {
        await storage.createEmailNotification({
          userId: options.userId,
          subject: options.subject,
          body: options.html,
          status: this.apiKey ? 'sent' : 'not_configured',
        });
      }

      // If no API key, just log and return success
      if (!this.apiKey) {
        console.log(`Email would be sent to ${options.to}: ${options.subject}`);
        return true;
      }

      // Send actual email via Resend
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Santander Bank <noreply@santanderbank.com>',
          to: [options.to],
          subject: options.subject,
          html: options.html,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      
      // Update email notification status to failed
      if (options.userId) {
        await storage.createEmailNotification({
          userId: options.userId,
          subject: options.subject,
          body: options.html,
          status: 'failed',
        });
      }
      
      return false;
    }
  }

  async sendTransferNotification(
    userEmail: string,
    userId: string,
    transferAmount: string,
    transferStatus: string,
    transferId: string
  ): Promise<boolean> {
    const subject = `Transfer ${transferStatus.charAt(0).toUpperCase() + transferStatus.slice(1)} - $${transferAmount}`;
    
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #EC0000; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Santander Bank</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827; margin: 0 0 20px 0;">Transfer Update</h2>
          
          <p style="color: #374151; margin: 0 0 15px 0;">
            Your transfer of <strong>$${transferAmount}</strong> is now <strong>${transferStatus}</strong>.
          </p>
          
          <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280;"><strong>Transfer ID:</strong> ${transferId}</p>
            <p style="margin: 5px 0 0 0; color: #6b7280;"><strong>Status:</strong> ${transferStatus}</p>
          </div>
          
          <p style="color: #374151; margin: 20px 0 0 0;">
            Thank you for banking with Santander.
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      userId,
    });
  }

  async sendAccountStatusNotification(
    userEmail: string,
    userId: string,
    accountNumber: string,
    newStatus: string,
    reason?: string
  ): Promise<boolean> {
    const subject = `Account Status Update - ${accountNumber}`;
    
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #EC0000; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Santander Bank</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827; margin: 0 0 20px 0;">Account Status Update</h2>
          
          <p style="color: #374151; margin: 0 0 15px 0;">
            The status of your account <strong>${accountNumber}</strong> has been updated to <strong>${newStatus}</strong>.
          </p>
          
          ${reason ? `
            <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #6b7280;"><strong>Reason:</strong> ${reason}</p>
            </div>
          ` : ''}
          
          <p style="color: #374151; margin: 20px 0 0 0;">
            If you have any questions, please contact customer service at 1-877-768-2265.
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      userId,
    });
  }

  async sendBalanceChangeNotification(
    userEmail: string,
    userId: string,
    accountNumber: string,
    changeType: 'credit' | 'debit',
    amount: string,
    newBalance: string,
    description: string
  ): Promise<boolean> {
    const subject = `Account ${changeType === 'credit' ? 'Credit' : 'Debit'} - $${amount}`;
    
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #EC0000; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Santander Bank</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827; margin: 0 0 20px 0;">Account Activity</h2>
          
          <p style="color: #374151; margin: 0 0 15px 0;">
            A ${changeType} of <strong>$${amount}</strong> has been applied to your account.
          </p>
          
          <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280;"><strong>Account:</strong> ${accountNumber}</p>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Amount:</strong> $${amount}</p>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Description:</strong> ${description}</p>
            <p style="margin: 5px 0 0 0; color: #6b7280;"><strong>New Balance:</strong> $${newBalance}</p>
          </div>
          
          <p style="color: #374151; margin: 20px 0 0 0;">
            Thank you for banking with Santander.
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      userId,
    });
  }

  async sendCustomEmail(
    userEmail: string,
    userId: string,
    subject: string,
    message: string
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #EC0000; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Santander Bank</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
          <div style="color: #374151; line-height: 1.6;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          
          <p style="color: #374151; margin: 20px 0 0 0;">
            Best regards,<br>
            Santander Bank Team
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      userId,
    });
  }
}

export const emailService = new EmailService();
