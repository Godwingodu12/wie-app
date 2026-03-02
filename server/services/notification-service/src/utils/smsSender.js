import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;
const getClient = () => {
  if (!client && accountSid && authToken) {
    client = twilio(accountSid, authToken);
  }
  return client;
};
export const sendEventCancellationSMS = async ({
  contactNo,
  userName,
  eventName,
  eventDate,         
  venue,             
  refundAmount,
  isPaid,
  refundPercentage,   
}) => {
  if (!contactNo) return;

  const twilioClient = getClient();
  if (!twilioClient) {
    console.warn('⚠️ [SMS] Twilio not configured — skipping');
    return;
  }

  let phone = contactNo.toString().trim();
  if (!phone.startsWith('+')) {
    phone = '+91' + phone;
  }

  const venueText   = venue    ? ` at ${venue}`    : '';
  const dateText    = eventDate ? ` on ${eventDate}` : '';
  const refundText  = isPaid && refundAmount > 0
    ? ` Refund of INR ${refundAmount.toFixed(2)} (${refundPercentage}%) will be credited in 5-7 business days.`
    : '';

  const message = `Hi ${userName}, your event "${eventName}"${venueText}${dateText} has been cancelled by the host.${refundText} -Wie Events`;

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to:   phone,
    });
    console.log(`✅ [SMS] Sent to ${phone}: SID ${result.sid}`);
  } catch (err) {
    console.error(`❌ [SMS] Failed to ${phone}:`, err.message);
  }
};

export const sendEventRehostSMS = async ({
  contactNo,
  userName,
  eventName,
  eventDate,
  venue,
}) => {
  if (!contactNo) return;

  const twilioClient = getClient();
  if (!twilioClient) {
    console.warn('⚠️ [SMS] Twilio not configured — skipping rehost SMS');
    return;
  }

  let phone = contactNo.toString().trim();
  if (!phone.startsWith('+')) {
    phone = '+91' + phone;
  }

  const dateText  = eventDate ? ` on ${eventDate}` : '';
  const venueText = venue     ? ` at ${venue}`     : '';

  const message = `Hi ${userName}, great news! "${eventName}"${venueText}${dateText} is back & live again. Book your tickets at wie.app -Wie Events`;

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to:   phone,
    });
    console.log(`✅ [SMS] Rehost SMS sent to ${phone}: SID ${result.sid}`);
  } catch (err) {
    console.error(`❌ [SMS] Failed rehost SMS to ${phone}:`, err.message);
  }
};

export const sendRefundSuccessSMS = async ({ contactNo, userName, eventName, refundAmount, refundId }) => {
  if (!contactNo) return;
  const twilioClient = getClient();
  if (!twilioClient) { console.warn('⚠️ [SMS] Twilio not configured'); return; }

  let phone = contactNo.toString().trim();
  if (!phone.startsWith('+')) phone = '+91' + phone;

  const message = `Hi ${userName}, your refund of INR ${refundAmount.toFixed(2)} for "${eventName}" is successful. Ref: ${refundId.slice(-8)} -Wie Events`;

  try {
    const result = await twilioClient.messages.create({ body: message, from: fromNumber, to: phone });
    console.log(`✅ [SMS] Refund success SMS sent to ${phone}: SID ${result.sid}`);
  } catch (err) {
    console.error(`❌ [SMS] Refund SMS failed to ${phone}:`, err.message);
  }
};
