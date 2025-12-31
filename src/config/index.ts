import dotenv from 'dotenv';
dotenv.config();

export const config = {
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 6730,
  socketPort: process.env.SOCKET || 6730,

  redis: {
    host: process.env.REDIS_HOST, // || 'localhost'
    port: process.env.REDIS_PORT, // || 6380
  },

  // openRouterOrChatGPT: {
  //   openai: {
  //     apiKey: process.env.OPENAI_API_KEY,
  //   },
  // },

  firebase : {
    translation : process.env.Firebase_Service_Account_Path_For_Translation,
  },

  //--------- for kaj bd
  agora: {
    appId: process.env.AGORA_APP_ID,
    appCertificationPrimary: process.env.AGORA_APP_CERTIFICATE_PRIMARY,
    appKey: process.env.AGORA_APP_KEY,
    appOrgName: process.env.AGORA_APP_ORG_NAME,
    appName: process.env.AGORA_APP_NAME,
  },

  database: {
    mongoUrl:
      process.env.MONGODB_URL || 'mongodb://localhost:27017/mentor-service',
  },

  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET ||
      '1018b783185a124050d697313a5dc97f4b7e7f66f4fb82bc7f2998303e48604c',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'bc4b3506f99e4254fc3b8382bf135ffec4a4adf043720555dd0849cb51aa5b02',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION_TIME || '5d',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION_TIME || '365d',
  },

  auth: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockTime: parseInt(process.env.LOCK_TIME || '2'),
  },
  token: {
    TokenSecret:
      process.env.TOKEN_SECRET ||
      '065ec2afe73bb1e47454907a56146e5b75ee441af05fe5bb82bdf169a1901d26',
    verifyEmailTokenExpiration:
      process.env.VERIFY_EMAIL_TOKEN_EXPIRATION_TIME || '10m',
    resetPasswordTokenExpiration:
      process.env.RESET_PASSWORD_TOKEN_EXPIRATION_TIME || '5m',
  },

  otp: {
    verifyEmailOtpExpiration: parseInt(
      process.env.VERIFY_EMAIL_OTP_EXPIRATION_TIME || '10',
    ),
    resetPasswordOtpExpiration: parseInt(
      process.env.RESET_PASSWORD_OTP_EXPIRATION_TIME || '5',
    ),
    maxOtpAttempts: parseInt(process.env.MAX_OTP_ATTEMPTS || '5'),
    attemptWindowMinutes: parseInt(process.env.ATTEMPT_WINDOW_MINUTES || '10'),
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    username: process.env.SMTP_USERNAME || '',
    password: process.env.SMTP_PASSWORD || '',
    emailFrom: process.env.EMAIL_FROM || '',
  },

  client: {
    url: process.env.CLIENT_URL || 'http://localhost:3000',
  },

  backend: {
    ip: process.env.BACKEND_IP || '10.0.60.220',
    baseUrl: `http://${process.env.BACKEND_IP}:${process.env.PORT}`,
    shobhoyUrl : process.env.SHOBHOY_URL,
  },

  // stripe: {
  //   success_url: process.env.STRIPE_SUCCESS_URL, // http://10.10.7.79:7000/api/v1/payments/success
  //   cancel_url: process.env.STRIPE_CANCEL_URL, // http://10.10.7.79:7000/api/v1/payments/cancel
  // },
  
  //--------- for kaj bd
  sslcommerz: {
    store_id: process.env.SSL_STORE_ID,
    store_passwd: process.env.SSL_STORE_PASSWORD,
    is_live: process.env.NODE_ENV === 'production',
    
    // for home  TODO : MUST :
    // success_url: `http://localhost:6737/api/v1/payment-transactions/pay/apn/validate`,
    
    // for office  TODO : MUST :
    //success_url: `http://172.26.89.58:6737/api/v1/payment-transactions/pay/apn/validate`,
    
    success_url: `https://newsheakh6737.sobhoy.com/api/v1/payment-transactions/pay/apn/validate`,
    
    fail_url: `${process.env.BACKEND_URL}/api/payment/ssl/fail`,
    cancel_url: `${process.env.BACKEND_URL}/api/payment/ssl/cancel`,
    ipn_url: `${process.env.BACKEND_URL}/api/payment/ssl/ipn`,

    Session_API_to_generate_transaction: process.env.SSL_SESSION_API,
    Validation_API : process.env.SSL_VALIDATION_API,
    Validation_API_Web_Service_name : process.env.SSL_VALIDATION_API_WEB_SERVICE,
  },

  //--------- for kaj bd
  kajbd : {
    default_service_category_image_id : process.env.DEFAULT_SERVICE_CATEGORY_IMAGE_ID
  }
};
