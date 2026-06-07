// src/utils/sendSMS.js
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC797869e17fb516bc22a8d976022db59c';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'da76713d932f54aaf6fc2d43ea67892c';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+16672206163';

let twilioClient;
try {
  twilioClient = twilio(accountSid, authToken);
} catch (error) {
  console.log('⚠️ Twilio client setup failed. Falling back to console logging.');
  twilioClient = null;
}

export const sendSMSOTP = async (contact_no, otp) => {
  try {
    const formattedNumber = contact_no.startsWith('+') ? contact_no : `+91${contact_no}`;
    const message = `WIE Creator: Your OTP is ${otp}. Valid for 5 minutes.`;

    if (!twilioClient) {
      console.log('\n📱 SMS OTP (Development Mode Fallback):');
      console.log('To:', formattedNumber);
      console.log('OTP:', otp);
      return true;
    }

    await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });

    console.log('✅ SMS OTP sent to:', formattedNumber);
    return true;
  } catch (error) {
    console.error('❌ Failed to send SMS OTP:', error.message);
    return false;
  }
};
