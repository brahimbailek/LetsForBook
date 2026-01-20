import twilio from 'twilio';

const accountSid = process.env['TWILIO_ACCOUNT_SID'];
const authToken = process.env['TWILIO_AUTH_TOKEN'];
const phoneNumber = process.env['TWILIO_PHONE_NUMBER'];

if (!accountSid || !authToken || !phoneNumber) {
  throw new Error('Twilio credentials are not defined in environment variables');
}

export const twilioClient = twilio(accountSid, authToken);
export const TWILIO_PHONE_NUMBER = phoneNumber;
