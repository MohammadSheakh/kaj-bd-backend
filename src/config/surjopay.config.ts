// config/shurjopay.ts
import axios from 'axios';

export const SHURJOPAY_CONFIG = {
  username: process.env.SP_USERNAME!,
  password: process.env.SP_PASSWORD!,
  endpoint: process.env.SP_ENDPOINT || 'https://sandbox.shurjopay.com.bd',
  return_url: process.env.SP_RETURN_URL!,
  cancel_url: process.env.SP_CANCEL_URL!,
  notification_url: process.env.SP_NOTIFICATION_URL!, // your webhook
};

let authToken: string | null = null;
let tokenExpiry: number = 0;

// Get auth token (valid 1 hour)
export const getShurjoPayToken = async () => {
  if (authToken && Date.now() < tokenExpiry) return authToken;

  const res = await axios.post(`${SHURJOPAY_CONFIG.endpoint}/api/get_token`, {
    username: SHURJOPAY_CONFIG.username,
    password: SHURJOPAY_CONFIG.password,
  });

  if (res.data.token) {
    authToken = res.data.token;
    tokenExpiry = Date.now() + 55 * 60 * 1000; // 55 mins
    return authToken;
  }

  throw new Error('Failed to get ShurjoPay token');
};