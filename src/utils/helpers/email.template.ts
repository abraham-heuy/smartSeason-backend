
interface WelcomeTemplateData {
  fullName: string;
  tempPassword: string;
  loginUrl: string;
}

export function getWelcomeTemplate(data: WelcomeTemplateData): string {
  const { fullName, tempPassword, loginUrl } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to SmartSeason</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body {
          margin: 0;
          padding: 0;
          background-color: #f0fdf4;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 35px -10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #166534, #14532d);
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.3px;
        }
        .content {
          padding: 40px 32px;
          background: #ffffff;
          border-radius: 32px 32px 24px 24px;
          margin: -20px 16px 16px 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .greeting {
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 16px;
        }
        .message {
          color: #334155;
          line-height: 1.6;
          margin-bottom: 24px;
          font-size: 16px;
        }
        .password-box {
          background: #f1f5f9;
          border-left: 4px solid #16a34a;
          padding: 16px 20px;
          border-radius: 12px;
          margin: 24px 0;
          font-family: monospace;
          font-size: 20px;
          font-weight: 600;
          color: #0f172a;
          text-align: center;
          letter-spacing: 1px;
        }
        .button {
          display: inline-block;
          background-color: #16a34a;
          color: white;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 40px;
          font-weight: 600;
          margin: 24px 0 16px;
          transition: background 0.2s;
          box-shadow: 0 2px 6px rgba(22,163,74,0.3);
        }
        .button:hover {
          background-color: #15803d;
        }
        .instructions {
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px 20px;
          margin: 24px 0 16px;
          font-size: 14px;
          color: #1e293b;
          border-left: 3px solid #16a34a;
        }
        .instructions p {
          margin: 8px 0;
        }
        .instructions ol {
          margin: 8px 0 8px 20px;
          padding-left: 0;
        }
        .instructions li {
          margin: 6px 0;
        }
        .note {
          font-size: 14px;
          color: #64748b;
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }
        .footer {
          text-align: center;
          padding: 24px;
          font-size: 12px;
          color: #5b6e8c;
          background: #f8fafc;
        }
        @media only screen and (max-width: 600px) {
          .content {
            padding: 28px 20px;
          }
          .greeting {
            font-size: 22px;
          }
        }
      </style>
    </head>
    <body style="margin:0;padding:20px 12px;background:#f0fdf4;">
      <div class="container">
        <div class="header">
          <h1>SmartSeason</h1>
        </div>
        <div class="content">
          <div class="greeting">Welcome, ${escapeHtml(fullName)}!</div>
          <div class="message">
            Your account for the <strong>SmartSeason Field Monitoring System</strong> has been created.
            You can now log in using the temporary password below.
          </div>
          <div class="password-box">
            ${escapeHtml(tempPassword)}
          </div>
          <div style="text-align:center;">
            <a href="${escapeHtml(loginUrl)}" class="button" style="color:#ffffff;">Go to Dashboard</a>
          </div>
          <div class="instructions">
            <strong>Next steps – change your password</strong>
            <ol>
              <li>After logging in, click on your profile avatar in the top‑right corner of the dashboard.</li>
              <li>Select <strong>Profile</strong> from the dropdown menu.</li>
              <li>Click the <strong>Change Password</strong> button.</li>
              <li>Use the temporary password shown above as your <strong>Current Password</strong>.</li>
              <li>Enter and confirm your new secure password, then click <strong>Update Password</strong>.</li>
            </ol>
          </div>
          <div class="note">
            If you did not request this account, please ignore this email.<br>
            For security, we recommend changing your password immediately after your first login.
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} SmartSeason — Agricultural Field Monitoring System<br>
          Need help? Contact support@smartseason.com
        </div>
      </div>
    </body>
    </html>
  `;
}

// Simple escape to prevent XSS
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}