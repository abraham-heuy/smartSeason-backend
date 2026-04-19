import { getWelcomeTemplate } from "../utils/helpers/email.template";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error('BREVO_API_KEY is not set');
      return false;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || 'SmartSeason',
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@smartseason.com',
        },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text || options.html.replace(/<[^>]*>/g, ''),
        replyTo: {
          email: 'support@smartseason.com',
          name: 'SmartSeason Support',
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo API error:', response.status, data);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('Email send exception:', error.message);
    return false;
  }
};

export class EmailService {
    async sendWelcomeWithPassword(to: string, fullName: string, tempPassword: string): Promise<boolean> {
      const subject = 'Welcome to SmartSeason Field Monitoring System';
      const loginUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const html = getWelcomeTemplate({ fullName, tempPassword, loginUrl });
      return sendEmail({ to, subject, html });
    }
  }