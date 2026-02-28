import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'salmanulfarisc13@gmail.com',
    pass: process.env.EMAIL_PASS || 'jzbiiuvgblokcard',
  },
  tls: { rejectUnauthorized: false },
});

export const sendEventCancellationEmail = async ({
  email,
  userName,
  eventName,
  eventDate,
  venue,             
  refundAmount,
  isPaid,
  refundPercentage,   
  cancellationReason,
}) => {
  if (!email) return;
    const venueHtml = venue
        ? `<p style="margin:4px 0 0 0;color:#666;font-size:14px;">📍 Venue: <strong>${venue}</strong></p>`
        : '';
    const refundSection = isPaid && refundAmount > 0
        ? `
        <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;
                    padding:20px;margin:20px 0;text-align:center;">
            <p style="margin:0 0 8px 0;color:#856404;font-size:14px;font-weight:bold;">
            REFUND INFORMATION (${refundPercentage}% of ticket price)
            </p>
            <p style="margin:0;color:#856404;font-size:28px;font-weight:bold;">
            ₹${refundAmount.toFixed(2)}
            </p>
            <p style="margin:8px 0 0 0;color:#856404;font-size:13px;">
            will be refunded to your original payment method within 5–7 business days
            </p>
        </div>`
        : `
        <div style="background:#d4edda;border:1px solid #28a745;border-radius:8px;
                    padding:16px;margin:20px 0;text-align:center;">
            <p style="margin:0;color:#155724;font-size:14px;">
            This was a <strong>free event</strong> — no payment was collected.
            </p>
        </div>`;


    const mailOptions = {
        from: '"Wie Events" <salmanulfarisc13@gmail.com>',
        to: email,
        subject: `Event Cancelled: ${eventName}`,
        text: `Hi ${userName || 'there'},\n\nWe're sorry to inform you that "${eventName}" scheduled for ${eventDate} has been cancelled.\n\nReason: ${cancellationReason || 'No reason provided'}\n\n${isPaid && refundAmount > 0 ? `Refund of ₹${refundAmount.toFixed(2)} will be processed within 5–7 business days.` : 'This was a free event — no refund needed.'}\n\nSorry for the inconvenience.\n\nThe Wie Team`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
            <table role="presentation" style="width:100%;border-collapse:collapse;">
            <tr>
                <td style="padding:40px 0;text-align:center;">
                <table role="presentation" style="width:600px;max-width:100%;margin:0 auto;
                        background:#ffffff;border-radius:8px;
                        box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                    <td style="background:#dc3545;border-radius:8px 8px 0 0;
                                padding:30px;text-align:center;">
                        <h1 style="margin:0;color:#ffffff;font-size:24px;">
                        Event Cancelled
                        </h1>
                    </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                    <td style="padding:30px;">
                        <p style="color:#333;font-size:16px;margin:0 0 16px 0;">
                        Hi <strong>${userName || 'there'}</strong>,
                        </p>
                        <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
                        We're sorry to inform you that the following event has been 
                        <strong>cancelled by the host</strong>:
                        </p>

                        <!-- Event Info Box -->
                        <div style="background:#f8f9fa;border-left:4px solid #dc3545;
                                    border-radius:4px;padding:16px;margin:0 0 20px 0;">
                        <p style="margin:0 0 8px 0;font-size:18px;font-weight:bold;
                                    color:#333;">${eventName}</p>
                        <p style="margin:0;color:#666;font-size:14px;">
                            📅 Scheduled for: <strong>${eventDate}</strong>
                        </p>
                        ${cancellationReason ? `
                        <p style="margin:8px 0 0 0;color:#666;font-size:14px;">
                            📝 Reason: <em>${cancellationReason}</em>
                        </p>` : ''}
                        </div>

                        ${refundSection}

                        <p style="color:#999;font-size:13px;margin:20px 0 0 0;
                                line-height:1.5;">
                        We sincerely apologize for the inconvenience. If you have 
                        questions about your refund, please contact our support team.
                        </p>
                    </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                    <td style="background:#f8f9fa;border-radius:0 0 8px 8px;
                                padding:20px;text-align:center;">
                        <p style="margin:0;color:#999;font-size:12px;">
                        © 2025 Wie Events. All rights reserved.
                        </p>
                    </td>
                    </tr>

                </table>
                </td>
            </tr>
            </table>
        </body>
        </html>`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Cancellation email sent to ${email}:`, info.response);
    } catch (err) {
        console.error(`❌ [Email] Failed to send to ${email}:`, err.message);
        // Don't throw — email failure should not block other notifications
    }
};

export const sendEventRehostEmail = async ({
  email,
  userName,
  eventName,
  eventDate,
  venue,
}) => {
  if (!email) return;

  const venueHtml = venue
    ? `<p style="margin:4px 0 0 0;color:#666;font-size:14px;">📍 Venue: <strong>${venue}</strong></p>`
    : '';

  const mailOptions = {
    from: '"Wie Events" <salmanulfarisc13@gmail.com>',
    to: email,
    subject: `🎉 Event is Back: ${eventName}`,
    text: `Hi ${userName || 'there'},\n\nGreat news! "${eventName}" has been re-hosted and is now live again.\n\nDate: ${eventDate}\n${venue ? `Venue: ${venue}\n` : ''}\nBook your tickets now at wie.app\n\nThe Wie Team`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
      <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:40px 0;text-align:center;">
            <table role="presentation" style="width:600px;max-width:100%;margin:0 auto;
                    background:#ffffff;border-radius:8px;
                    box-shadow:0 2px 8px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#16a34a,#22c55e);
                            border-radius:8px 8px 0 0;padding:30px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:24px;">🎉 Event is Back!</h1>
                  <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                    An event you attended before has been re-hosted
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:30px;">
                  <p style="color:#333;font-size:16px;margin:0 0 16px 0;">
                    Hi <strong>${userName || 'there'}</strong>,
                  </p>
                  <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
                    Great news! The event you previously booked has been 
                    <strong>re-hosted and is live again</strong>. 
                    Don't miss out — grab your tickets now!
                  </p>

                  <!-- Event Info Box -->
                  <div style="background:#f0fdf4;border-left:4px solid #22c55e;
                              border-radius:4px;padding:16px;margin:0 0 20px 0;">
                    <p style="margin:0 0 8px 0;font-size:18px;font-weight:bold;color:#333;">
                      ${eventName}
                    </p>
                    ${eventDate ? `
                    <p style="margin:0;color:#666;font-size:14px;">
                      📅 Date: <strong>${eventDate}</strong>
                    </p>` : ''}
                    ${venueHtml}
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align:center;margin:24px 0;">
                    <a href="https://wie.app"
                       style="background:linear-gradient(135deg,#16a34a,#22c55e);
                              color:#fff;text-decoration:none;padding:14px 32px;
                              border-radius:8px;font-size:15px;font-weight:bold;
                              display:inline-block;">
                      Book Again →
                    </a>
                  </div>

                  <p style="color:#999;font-size:13px;margin:20px 0 0 0;line-height:1.5;">
                    Spots may be limited. Book early to secure your place.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8f9fa;border-radius:0 0 8px 8px;
                            padding:20px;text-align:center;">
                  <p style="margin:0;color:#999;font-size:12px;">
                    © 2025 Wie Events. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Email] Rehost email sent to ${email}:`, info.response);
  } catch (err) {
    console.error(`❌ [Email] Failed to send rehost email to ${email}:`, err.message);
  }
};
