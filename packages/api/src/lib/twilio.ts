import twilio from 'twilio';

// Lazy initialization - only throws when actually used, not at build time
let twilioClientInstance: ReturnType<typeof twilio> | null = null;
let twilioPhoneNumber: string | null = null;

export const getTwilioClient = () => {
  if (!twilioClientInstance) {
    const accountSid = process.env['TWILIO_ACCOUNT_SID'];
    const authToken = process.env['TWILIO_AUTH_TOKEN'];
    const phoneNumber = process.env['TWILIO_PHONE_NUMBER'];

    if (!accountSid || !authToken || !phoneNumber) {
      throw new Error('Twilio credentials are not defined in environment variables');
    }

    twilioClientInstance = twilio(accountSid, authToken);
    twilioPhoneNumber = phoneNumber;
  }
  return twilioClientInstance;
};

export const getTwilioPhoneNumber = (): string => {
  if (!twilioPhoneNumber) {
    getTwilioClient(); // This will initialize the phone number
  }
  return twilioPhoneNumber!;
};

// For backward compatibility
export const twilioClient = new Proxy({} as ReturnType<typeof twilio>, {
  get(_, prop) {
    return getTwilioClient()[prop as keyof ReturnType<typeof twilio>];
  },
});

export const TWILIO_PHONE_NUMBER = new Proxy({ value: '' }, {
  get(_, prop) {
    if (prop === 'toString' || prop === 'valueOf') {
      return () => getTwilioPhoneNumber();
    }
    return getTwilioPhoneNumber();
  },
}) as unknown as string;
