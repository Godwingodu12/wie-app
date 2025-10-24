import nodemailer from 'nodemailer';
export const sendEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'salmanulfarisc13@gmail.com',
        pass: 'jzbiiuvgblokcard', // Consider using environment variable
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: '"Wie Verification" <salmanulfarisc13@gmail.com>',
      to: email,
      subject: 'Your Wie Verification Code',
      // Plain text version with Web OTP format
      text: `Your Wie verification code is: ${otp}\n\n@yourdomain.com #${otp}\n\nThis code will expire in 1 minutes.`,
      // HTML version for better appearance
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 0; text-align: center;">
                <table role="presentation" style="width: 600px; max-width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Verification Code</h1>
                      <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                        Enter this code to verify your account:
                      </p>
                      <div style="background-color: #f8f9fa; border: 2px dashed #6d62ff; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; color: #6d62ff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                          ${otp}
                        </span>
                      </div>
                      <!-- Web OTP API format (hidden but readable by browser) -->
                      <div style="display: none;">@yourdomain.com #${otp}</div>
                      <p style="margin: 0; color: #999999; font-size: 14px;">
                        This code will expire in 1 minutes.
                      </p>
                      <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px;">
                        If you didn't request this code, please ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw new Error('Failed to send OTP email');
  }
};
