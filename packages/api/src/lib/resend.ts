import { Resend } from 'resend';

// Lazy initialization - only throws when actually used, not at build time
let resendInstance: Resend | null = null;

export const getResend = (): Resend => {
  if (!resendInstance) {
    const apiKey = process.env['RESEND_API_KEY'];
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not defined in environment variables');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
};

// For backward compatibility
export const resend = new Proxy({} as Resend, {
  get(_, prop) {
    return getResend()[prop as keyof Resend];
  },
});
