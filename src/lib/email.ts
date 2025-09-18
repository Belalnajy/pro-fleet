import nodemailer from 'nodemailer'

// Create transporter for sending emails
const createTransporter = () => {
  // For development, you can use Gmail SMTP or any other email service
  // For production, use a service like SendGrid, AWS SES, or Mailgun
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // Your email
      pass: process.env.SMTP_PASS, // Your email password or app password
    },
  })
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', result.messageId)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

// Email templates
export const getPasswordResetEmailTemplate = (resetUrl: string, userName: string) => {
  const primaryColor = '#007bff'; // Your app's primary color
  const backgroundColor = '#f4f7fc';
  const textColor = '#333333';

  return {
    subject: 'إعادة تعيين كلمة المرور - PRO FLEET',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إعادة تعيين كلمة المرور</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
          body {
            font-family: 'Tajawal', sans-serif;
            line-height: 1.6;
            color: ${textColor};
            margin: 0;
            padding: 0;
            background-color: ${backgroundColor};
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 30px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            border-top: 5px solid ${primaryColor};
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: 700;
            color: ${primaryColor};
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            background-color: ${primaryColor};
            color: white !important; /* Important for email clients */
            padding: 14px 35px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            transition: background-color 0.3s;
          }
          .warning {
            background-color: #fffbe6;
            border: 1px solid #ffe58f;
            color: #8a6d3b;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eeeeee;
            color: #888888;
            font-size: 12px;
          }
          p { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <span>🚛</span>
              <span>PRO FLEET</span>
            </div>
          </div>
          
          <div class="content">
            <h2 style="color: ${primaryColor};">مرحباً ${userName}،</h2>
            <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في PRO FLEET.</p>
            <p>إذا كنت أنت من طلب هذا الإجراء، يرجى النقر على الزر أدناه لإكمال العملية:</p>
            
            <div class="button-container">
              <a href="${resetUrl}" class="button">إعادة تعيين كلمة المرور</a>
            </div>
            
            <div class="warning">
              <strong>تنبيه هام:</strong> هذا الرابط صالح لمدة 15 دقيقة فقط. لأسباب أمنية، ستنتهي صلاحيته بعد ذلك.
            </div>
            
            <p>إذا لم تكن أنت من طلب إعادة تعيين كلمة المرور، فلا داعي لاتخاذ أي إجراء. حسابك آمن تماماً.</p>
          </div>
          
          <div class="footer">
            <p>هذه رسالة آلية، يرجى عدم الرد عليها.</p>
            <p>&copy; ${new Date().getFullYear()} PRO FLEET. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      مرحباً ${userName},
      
      تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في PRO FLEET.
      
      يرجى نسخ الرابط التالي ولصقه في متصفحك لإعادة تعيين كلمة المرور:
      ${resetUrl}
      
      هذا الرابط صالح لمدة 15 دقيقة فقط.
      
      إذا لم تطلب هذا الإجراء، يرجى تجاهل هذه الرسالة.
      
      فريق PRO FLEET
    `
  }
}
